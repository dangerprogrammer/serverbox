'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { createCondominiumPayment } from "@/lib/payments/create-payment";

export async function createPaymentAction(formData: FormData) {
  await requireAuthenticatedAdmin();

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

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID nao configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID no .env.local para criar cobrancas na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL invalida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      throw new Error(
        "A ABACATEPAY_API_BASE_URL do .env.local precisa apontar para uma URL valida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
      );
    }

    throw error;
  }
}
