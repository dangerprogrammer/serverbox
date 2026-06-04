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
  type AbacatePayChargeSnapshot,
  checkAbacatePixCharge,
  getAbacatePayProviderName,
  isAbacatePayConfigured,
  simulateAbacatePixCharge,
} from "@/lib/payments/abacatepay";

function isAbacatePayAuthOrKeyError(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  return (
    normalizedMessage.includes("invalid or inactive api key") ||
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("forbidden")
  );
}

function isAmountMismatch(payment: CondominiumPayment, snapshot: AbacatePayChargeSnapshot) {
  return snapshot.amountInCents !== payment.amountInCents;
}

export async function applyProviderPaymentSnapshot({
  payment,
  snapshot,
  verificationSource,
}: {
  payment: CondominiumPayment;
  snapshot: AbacatePayChargeSnapshot;
  verificationSource: PaymentVerificationSource;
}) {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  payment.provider = snapshot.provider;
  payment.providerPaymentId = snapshot.providerPaymentId;
  payment.providerRawStatus = snapshot.providerRawStatus;
  payment.providerReceiptUrl = snapshot.providerReceiptUrl;
  payment.providerDevMode = snapshot.providerDevMode;
  payment.pixQrCode = snapshot.pixQrCode;
  payment.pixCopyPasteCode = snapshot.pixCopyPasteCode;
  payment.pixExpiresAt = snapshot.pixExpiresAt;

  if (isAmountMismatch(payment, snapshot)) {
    console.warn(
      "[abacatepay] amount mismatch while syncing payment snapshot",
      {
        paymentId: payment.id,
        reference: payment.reference,
        localAmountInCents: payment.amountInCents,
        providerAmountInCents: snapshot.amountInCents,
      },
    );
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

export async function syncAbacatePixPayment({
  paymentId,
  verificationSource = PaymentVerificationSource.STATUS_CHECK,
}: {
  paymentId: string;
  verificationSource?: PaymentVerificationSource;
}) {
  if (!isAbacatePayConfigured()) {
    return null;
  }

  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: { id: paymentId },
    relations: {
      condominium: true,
    },
  });

  if (
    !payment ||
    payment.provider !== getAbacatePayProviderName() ||
    !payment.providerPaymentId
  ) {
    return payment;
  }

  try {
    const snapshot = await checkAbacatePixCharge(
      payment.providerPaymentId,
      payment.amountInCents,
    );

    return applyProviderPaymentSnapshot({
      payment,
      snapshot,
      verificationSource,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (isAbacatePayAuthOrKeyError(errorMessage)) {
      console.warn(
        "[abacatepay] skipping payment sync because the API key is invalid, inactive, or unavailable",
      );

      return payment;
    }

    throw error;
  }
}

export async function simulateAbacatePixPayment(paymentId: string) {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: { id: paymentId },
    relations: {
      condominium: true,
    },
  });

  if (!payment) {
    throw new Error("Pagamento não encontrado.");
  }

  if (payment.provider !== getAbacatePayProviderName() || !payment.providerPaymentId) {
    throw new Error("Pagamento não está vinculado a AbacatePay.");
  }

  if (process.env.NODE_ENV === "development" && payment.providerDevMode) {
    const snapshot: AbacatePayChargeSnapshot = {
      provider: getAbacatePayProviderName(),
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

  if (!isAbacatePayConfigured()) {
    throw new Error("ABACATEPAY_API_KEY não configurada.");
  }

  const snapshot = await simulateAbacatePixCharge(payment.providerPaymentId);

  return applyProviderPaymentSnapshot({
    payment,
    snapshot,
    verificationSource: PaymentVerificationSource.MANUAL_REVIEW,
  });
}
