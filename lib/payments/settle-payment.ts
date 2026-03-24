import { getDataSource } from "@/lib/db/data-source";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  PaymentStatus,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";

type SettlePixPaymentInput = {
  paymentId: string;
  pixTransactionId: string;
  paidAmountInCents?: number;
  verificationSource: PaymentVerificationSource;
};

export async function settlePixPayment({
  paymentId,
  pixTransactionId,
  paidAmountInCents,
  verificationSource,
}: SettlePixPaymentInput) {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

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

  if (payment.method !== PaymentMethod.PIX) {
    throw new Error("Somente pagamentos PIX podem ser liquidados automaticamente.");
  }

  if (!payment.pixTransactionId) {
    throw new Error("Esta cobranca nao possui identificador PIX para validacao.");
  }

  if (payment.status === PaymentStatus.EXPIRED) {
    throw new Error("A cobranca PIX expirou e nao pode mais ser confirmada.");
  }

  if (payment.pixTransactionId !== pixTransactionId.trim()) {
    throw new Error("O identificador PIX informado nao corresponde a cobranca.");
  }

  if (
    typeof paidAmountInCents === "number" &&
    paidAmountInCents !== payment.amountInCents
  ) {
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

  if (payment.status !== PaymentStatus.PAID) {
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
  }

  payment.verifiedAt = new Date();
  payment.verificationSource = verificationSource;

  const savedPayment = await paymentRepository.save(payment);

  if (!existingCredit) {
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
