'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";
import {
  buildPaymentReference,
  buildPixCharge,
  getPixTestAmountInCents,
} from "@/lib/payments/pix";

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
  const testAmountInCents = getPixTestAmountInCents();
  const pixCharge = buildPixCharge({
    amountInCents: testAmountInCents,
    reference,
  });

  const payment = await paymentRepository.save({
    condominium,
    plan,
    reference,
    method: pixCharge.method,
    status: PaymentStatus.PENDING,
    amountInCents: testAmountInCents,
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
  redirect(`/pagamentos/${payment.id}`);
}
