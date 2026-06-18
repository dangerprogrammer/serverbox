'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedAdminFromFormData } from "@/lib/auth/session";
import {
  createCondominiumPayment,
  createStandaloneBallPayment,
} from "@/lib/payments/create-payment";

function parsePositiveInteger(value: FormDataEntryValue | null, fieldLabel: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(`${fieldLabel} inválido.`);
  }

  return parsed;
}

function parseCurrencyToCents(value: FormDataEntryValue | null, fieldLabel: string) {
  if (typeof value !== "string") {
    throw new Error(`${fieldLabel} inválido.`);
  }

  const digits = value.replace(/\D/g, "");
  const parsed = Number(digits);

  if (!digits || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldLabel} inválido.`);
  }

  return parsed;
}

function getPaymentGatewayConfigurationMessage(message: string) {
  if (message === "PAYMENT_DEFAULT_CUSTOMER_CELLPHONE nao configurado.") {
    return "Configure PAYMENT_DEFAULT_CUSTOMER_CELLPHONE no .env.local para criar cobrancas neste gateway.";
  }

  if (message === "PAYMENT_DEFAULT_CUSTOMER_TAX_ID nao configurado.") {
    return "Configure PAYMENT_DEFAULT_CUSTOMER_TAX_ID no .env.local para criar cobrancas neste gateway.";
  }

  if (
    message.includes("SANTANDER") ||
    message.includes("ABACATEPAY") ||
    message.includes("INFINITEPAY") ||
    message.includes("PAYMENT_PROVIDER")
  ) {
    return message;
  }

  return null;
}

export async function createPaymentAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const planId = String(formData.get("planId") ?? "");
  const condominiumId = String(formData.get("condominiumId") ?? "");

  if (!planId) {
    throw new Error("Plano é obrigatório para criar pagamento.");
  }

  try {
    const payment = await createCondominiumPayment({
      planId,
      condominiumId: condominiumId || undefined,
    });

    revalidatePath("/dashboard");
    if (condominiumId) {
      revalidatePath(`/condominio/${condominiumId}`);
    }
    redirect(`/pagamentos/${payment.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar plano mensal/anual.";
    const gatewayMessage = getPaymentGatewayConfigurationMessage(message);

    if (gatewayMessage) {
      throw new Error(gatewayMessage);
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE não configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE no .env.local para criar cobranças na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID não configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID no .env.local para criar cobranças na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL inválida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      throw new Error(
        "A ABACATEPAY_API_BASE_URL do .env.local precisa apontar para uma URL válida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
      );
    }

    throw error;
  }
}

export async function createStandalonePaymentAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const condominiumId = String(formData.get("condominiumId") ?? "");
  const tubeBrandId = String(formData.get("tubeBrandId") ?? "");

  if (!condominiumId) {
    throw new Error("Condomínio é obrigatório para criar compra avulsa.");
  }

  if (!tubeBrandId) {
    throw new Error("Marca de tubos é obrigatória para criar compra avulsa.");
  }

  const ballQuantity = parsePositiveInteger(
    formData.get("ballQuantity"),
    "Quantidade de tubos",
  );
  const amountInCents = parseCurrencyToCents(
    formData.get("amountInCents"),
    "Valor",
  );

  try {
    const payment = await createStandaloneBallPayment({
      condominiumId,
      tubeBrandId,
      ballQuantity,
      amountInCents,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/condominio/${condominiumId}`);
    redirect(`/pagamentos/${payment.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar compra avulsa.";
    const gatewayMessage = getPaymentGatewayConfigurationMessage(message);

    if (gatewayMessage) {
      throw new Error(gatewayMessage);
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE não configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE no .env.local para criar cobranças na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID não configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID no .env.local para criar cobranças na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL inválida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      throw new Error(
        "A ABACATEPAY_API_BASE_URL do .env.local precisa apontar para uma URL válida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
      );
    }

    throw error;
  }
}

