'use server';

import { revalidatePath } from "next/cache";

import { getDataSource } from "@/lib/db/data-source";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";

function normalizePaymentMethod(value: FormDataEntryValue | null) {
  switch (value) {
    case PaymentMethod.CREDIT_CARD:
      return PaymentMethod.CREDIT_CARD;
    case PaymentMethod.BOLETO:
      return PaymentMethod.BOLETO;
    case PaymentMethod.MANUAL:
      return PaymentMethod.MANUAL;
    default:
      return PaymentMethod.PIX;
  }
}

function buildReference() {
  const now = new Date();
  const serial = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

  return `pay-${serial}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createPaymentAction(formData: FormData) {
  const condominiumId = String(formData.get("condominiumId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const method = normalizePaymentMethod(formData.get("method"));

  if (!condominiumId || !planId) {
    throw new Error("Condominio e plano sao obrigatorios para criar pagamento.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const [condominium, plan] = await Promise.all([
    condominiumRepository.findOneBy({ id: condominiumId }),
    planRepository.findOneBy({ id: planId }),
  ]);

  if (!condominium || !plan) {
    throw new Error("Condominio ou plano nao encontrado.");
  }

  await paymentRepository.save({
    condominium,
    plan,
    reference: buildReference(),
    method,
    status: PaymentStatus.PENDING,
    amountInCents: plan.monthlyPriceInCents,
    ballQuantity: plan.monthlyBallAllowance,
    paidAt: null,
  });

  revalidatePath("/dashboard");
}

export async function confirmPaymentAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");

  if (!paymentId) {
    throw new Error("Pagamento invalido.");
  }

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

  if (payment.status !== PaymentStatus.PENDING) {
    revalidatePath("/dashboard");
    return;
  }

  payment.status = PaymentStatus.PAID;
  payment.paidAt = new Date();
  await paymentRepository.save(payment);

  await movementRepository.save({
    condominium: payment.condominium,
    payment,
    kind: BallMovementKind.CREDIT,
    quantity: payment.ballQuantity,
    reason: `Credito liberado para o pagamento ${payment.reference}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
}
