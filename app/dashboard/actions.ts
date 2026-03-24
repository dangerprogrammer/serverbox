'use server';

import { revalidatePath } from "next/cache";

import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";
import { buildPaymentReference, buildPixCharge } from "@/lib/payments/pix";
import { settlePixPayment } from "@/lib/payments/settle-payment";

export async function createPaymentAction(formData: FormData) {
  const condominiumId = String(formData.get("condominiumId") ?? "");
  const planId = String(formData.get("planId") ?? "");

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

  const reference = buildPaymentReference();
  const pixCharge = buildPixCharge({
    amountInCents: plan.monthlyPriceInCents,
    condominiumName: condominium.name,
    reference,
  });

  await paymentRepository.save({
    condominium,
    plan,
    reference,
    method: pixCharge.method,
    status: PaymentStatus.PENDING,
    amountInCents: plan.monthlyPriceInCents,
    ballQuantity: plan.monthlyBallAllowance,
    pixTransactionId: pixCharge.pixTransactionId,
    pixQrCode: pixCharge.pixQrCode,
    pixCopyPasteCode: pixCharge.pixCopyPasteCode,
    pixExpiresAt: pixCharge.pixExpiresAt,
    paidAt: null,
    verifiedAt: null,
    verificationSource: null,
  });

  revalidatePath("/dashboard");
}

export async function confirmPaymentAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  const pixTransactionId = String(formData.get("pixTransactionId") ?? "").trim();

  if (!paymentId || !pixTransactionId) {
    throw new Error("Pagamento invalido.");
  }

  await settlePixPayment({
    paymentId,
    pixTransactionId,
    verificationSource: PaymentVerificationSource.MANUAL_REVIEW,
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
}
