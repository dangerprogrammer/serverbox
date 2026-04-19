'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import {
  createCondominiumPayment,
  createStandaloneBallPayment,
} from "@/lib/payments/create-payment";

function parsePositiveInteger(value: FormDataEntryValue | null, fieldLabel: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(`${fieldLabel} invÃ¡lido.`);
  }

  return parsed;
}

function parseCurrencyToCents(value: FormDataEntryValue | null, fieldLabel: string) {
  if (typeof value !== "string") {
    throw new Error(`${fieldLabel} invÃ¡lido.`);
  }

  const digits = value.replace(/\D/g, "");
  const parsed = Number(digits);

  if (!digits || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldLabel} invÃ¡lido.`);
  }

  return parsed;
}

export async function createPaymentAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano Ã© obrigatÃ³rio para criar pagamento.");
  }

  try {
    const payment = await createCondominiumPayment({
      planId,
    });

    revalidatePath("/dashboard");
    redirect(`/pagamentos/${payment.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar plano mensal/anual.";

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE nÃ£o configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE no .env.local para criar cobranÃ§as na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID nÃ£o configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID no .env.local para criar cobranÃ§as na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL invÃ¡lida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      throw new Error(
        "A ABACATEPAY_API_BASE_URL do .env.local precisa apontar para uma URL vÃ¡lida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
      );
    }

    throw error;
  }
}

export async function createStandalonePaymentAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const condominiumId = String(formData.get("condominiumId") ?? "");

  if (!condominiumId) {
    throw new Error("CondomÃ­nio Ã© obrigatÃ³rio para criar compra avulsa.");
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
      ballQuantity,
      amountInCents,
    });

    revalidatePath("/dashboard");
    redirect(`/pagamentos/${payment.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar plano mensal/anual.";

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE nÃ£o configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE no .env.local para criar cobranÃ§as na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID nÃ£o configurado.") {
      throw new Error(
        "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID no .env.local para criar cobranÃ§as na AbacatePay.",
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL invÃ¡lida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      throw new Error(
        "A ABACATEPAY_API_BASE_URL do .env.local precisa apontar para uma URL vÃ¡lida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
      );
    }

    throw error;
  }
}

