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

  if (snapshot.amountInCents !== payment.amountInCents) {
    throw new Error("O valor recebido difere do valor esperado da cobranca.");
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
      plan: true,
    },
  });

  if (
    !payment ||
    payment.provider !== getAbacatePayProviderName() ||
    !payment.providerPaymentId
  ) {
    return payment;
  }

  const snapshot = await checkAbacatePixCharge(payment.providerPaymentId);

  return applyProviderPaymentSnapshot({
    payment,
    snapshot,
    verificationSource,
  });
}

export async function simulateAbacatePixPayment(paymentId: string) {
  if (!isAbacatePayConfigured()) {
    throw new Error("ABACATEPAY_API_KEY nao configurada.");
  }

  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: { id: paymentId },
    relations: {
      condominium: true,
      plan: true,
    },
  });

  if (!payment) {
    throw new Error("Pagamento nao encontrado.");
  }

  if (payment.provider !== getAbacatePayProviderName() || !payment.providerPaymentId) {
    throw new Error("Pagamento nao esta vinculado a AbacatePay.");
  }

  const snapshot = await simulateAbacatePixCharge(payment.providerPaymentId);

  return applyProviderPaymentSnapshot({
    payment,
    snapshot,
    verificationSource: PaymentVerificationSource.MANUAL_REVIEW,
  });
}
