import { getDataSource } from "@/lib/db/data-source";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
  PaymentVerificationSource,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  checkPixCharge,
  getPaymentProviderConfigError,
  isPaymentProviderConfigured,
  normalizePaymentProviderName,
  simulatePixCharge,
} from "@/lib/payments/gateway";
import type { SantanderPix } from "@/lib/payments/santander";
import type { PaymentChargeSnapshot } from "@/lib/payments/types";

function isProviderAuthOrConfigError(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  return (
    normalizedMessage.includes("invalid or inactive api key") ||
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("client_id") ||
    normalizedMessage.includes("client_secret") ||
    normalizedMessage.includes("certificado") ||
    normalizedMessage.includes("chave privada") ||
    normalizedMessage.includes("nao configurad") ||
    normalizedMessage.includes("não configurad") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("forbidden")
  );
}

function isAmountMismatch(
  payment: CondominiumPayment,
  snapshot: PaymentChargeSnapshot,
) {
  return snapshot.amountInCents !== payment.amountInCents;
}

export async function applyProviderPaymentSnapshot({
  payment,
  snapshot,
  verificationSource,
}: {
  payment: CondominiumPayment;
  snapshot: PaymentChargeSnapshot;
  verificationSource: PaymentVerificationSource;
}) {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  payment.provider = snapshot.provider;
  payment.providerPaymentId = snapshot.providerPaymentId;
  payment.providerRawStatus = snapshot.providerRawStatus;
  payment.providerReceiptUrl =
    snapshot.providerReceiptUrl ?? payment.providerReceiptUrl;
  payment.providerDevMode = snapshot.providerDevMode;
  payment.pixTransactionId = snapshot.pixTransactionId ?? payment.pixTransactionId;
  payment.pixQrCode = snapshot.pixQrCode ?? payment.pixQrCode;
  payment.pixCopyPasteCode = snapshot.pixCopyPasteCode ?? payment.pixCopyPasteCode;
  payment.pixExpiresAt = snapshot.pixExpiresAt ?? payment.pixExpiresAt;

  if (isAmountMismatch(payment, snapshot)) {
    console.warn("[payments] amount mismatch while syncing payment snapshot", {
      paymentId: payment.id,
      reference: payment.reference,
      localAmountInCents: payment.amountInCents,
      providerAmountInCents: snapshot.amountInCents,
    });
  }

  const existingCredit = await movementRepository.findOne({
    where: {
      payment: { id: payment.id },
      kind: BallMovementKind.CREDIT,
    },
    relations: {
      payment: true,
    },
  });

  payment.status = snapshot.status;

  if (snapshot.status === PaymentStatus.PAID && !payment.paidAt) {
    payment.paidAt = new Date();
  }

  if (snapshot.status !== PaymentStatus.PENDING) {
    payment.verifiedAt = new Date();
    payment.verificationSource = verificationSource;
  }

  const savedPayment = await paymentRepository.save(payment);

  if (snapshot.status === PaymentStatus.PAID && !existingCredit) {
    await movementRepository.save({
      condominium: payment.condominium,
      payment: savedPayment,
      kind: BallMovementKind.CREDIT,
      quantity: payment.ballQuantity,
      reason: `Credito liberado para o pagamento ${payment.reference}.`,
    });
  }

  return savedPayment;
}

export async function syncPixPayment({
  paymentId,
  verificationSource = PaymentVerificationSource.STATUS_CHECK,
  santanderWebhookPix,
}: {
  paymentId: string;
  verificationSource?: PaymentVerificationSource;
  santanderWebhookPix?: SantanderPix;
}) {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: { id: paymentId },
    relations: {
      condominium: true,
    },
  });

  if (!payment || !payment.providerPaymentId) {
    return payment;
  }

  const provider = normalizePaymentProviderName(payment.provider);

  if (!provider) {
    return payment;
  }

  if (!isPaymentProviderConfigured(provider)) {
    return null;
  }

  try {
    const snapshot = await checkPixCharge({
      provider,
      providerPaymentId: payment.providerPaymentId,
      amountInCents: payment.amountInCents,
      santanderWebhookPix,
    });

    return applyProviderPaymentSnapshot({
      payment,
      snapshot,
      verificationSource,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isProviderAuthOrConfigError(errorMessage)) {
      console.warn(
        "[payments] skipping payment sync because provider credentials are invalid, inactive, or unavailable",
      );

      return payment;
    }

    throw error;
  }
}

export async function simulatePixPayment(paymentId: string) {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: { id: paymentId },
    relations: {
      condominium: true,
    },
  });

  if (!payment) {
    throw new Error("Pagamento nao encontrado.");
  }

  const provider = normalizePaymentProviderName(payment.provider);

  if (!provider || !payment.providerPaymentId) {
    throw new Error("Pagamento nao esta vinculado ao gateway de pagamento.");
  }

  if (
    provider === "abacatepay" &&
    process.env.NODE_ENV === "development" &&
    payment.providerDevMode
  ) {
    const snapshot: PaymentChargeSnapshot = {
      provider,
      providerPaymentId: payment.providerPaymentId,
      providerRawStatus: "PAID",
      providerReceiptUrl: payment.providerReceiptUrl,
      providerDevMode: true,
      method: payment.method,
      status: PaymentStatus.PAID,
      amountInCents: payment.amountInCents,
      pixTransactionId: payment.pixTransactionId,
      pixQrCode: payment.pixQrCode,
      pixCopyPasteCode: payment.pixCopyPasteCode,
      pixExpiresAt: payment.pixExpiresAt,
    };

    return applyProviderPaymentSnapshot({
      payment,
      snapshot,
      verificationSource: PaymentVerificationSource.MANUAL_REVIEW,
    });
  }

  if (!isPaymentProviderConfigured(provider)) {
    throw new Error(getPaymentProviderConfigError(provider));
  }

  const snapshot = await simulatePixCharge({
    provider,
    providerPaymentId: payment.providerPaymentId,
  });

  return applyProviderPaymentSnapshot({
    payment,
    snapshot,
    verificationSource: PaymentVerificationSource.MANUAL_REVIEW,
  });
}
