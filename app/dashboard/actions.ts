'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCondominiumPayment } from "@/lib/payments/create-payment";

export async function createPaymentAction(formData: FormData) {
  const condominiumId = String(formData.get("condominiumId") ?? "");
  const planId = String(formData.get("planId") ?? "");

  if (!condominiumId || !planId) {
    throw new Error("Condominio e plano sao obrigatorios para criar pagamento.");
  }

  try {
    const payment = await createCondominiumPayment({
      condominiumId,
      planId,
    });

    revalidatePath("/dashboard");
    redirect(`/pagamentos/${payment.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar cobranca PIX.";

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE nao configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE no .env.local para criar cobrancas na AbacatePay.",
      );
    }

    throw error;
  }
}
