import "server-only";

import {
  checkAbacatePixCharge,
  createAbacatePixCharge,
  getAbacatePayProviderName,
  isAbacatePayConfigured,
  simulateAbacatePixCharge,
} from "@/lib/payments/abacatepay";
import {
  checkSantanderPixCharge,
  createSantanderPixCharge,
  isSantanderConfigured,
  type SantanderPix,
} from "@/lib/payments/santander";
import {
  checkInfinitePayCheckoutCharge,
  createInfinitePayCheckoutCharge,
  isInfinitePayConfigured,
} from "@/lib/payments/infinitepay";
import type {
  CreatePixChargeInput,
  PaymentChargeSnapshot,
  PaymentProviderName,
} from "@/lib/payments/types";

export function normalizePaymentProviderName(
  provider: string | null | undefined,
): PaymentProviderName | null {
  const normalizedProvider = provider?.trim().toLowerCase();

  if (
    normalizedProvider === "abacatepay" ||
    normalizedProvider === "santander" ||
    normalizedProvider === "infinitepay"
  ) {
    return normalizedProvider;
  }

  return null;
}

export function getActivePaymentProviderName(): PaymentProviderName {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  if (!provider) {
    return getAbacatePayProviderName();
  }

  const normalizedProvider = normalizePaymentProviderName(provider);

  if (!normalizedProvider) {
    throw new Error(
      "PAYMENT_PROVIDER invalido. Use infinitepay, abacatepay ou santander.",
    );
  }

  return normalizedProvider;
}

export function getPaymentProviderLabel(provider: string | null | undefined) {
  switch (normalizePaymentProviderName(provider)) {
    case "abacatepay":
      return "AbacatePay";
    case "santander":
      return "Santander";
    case "infinitepay":
      return "InfinitePay";
    default:
      return "Gateway";
  }
}

export function getPaymentProviderConfigError(provider = getActivePaymentProviderName()) {
  switch (provider) {
    case "abacatepay":
      return "Configure ABACATEPAY_API_KEY para operar pagamentos PIX.";
    case "santander":
      return "Configure SANTANDER_CLIENT_ID, SANTANDER_CLIENT_SECRET, SANTANDER_PIX_KEY e certificado PEM para operar pagamentos PIX.";
    case "infinitepay":
      return "Configure INFINITEPAY_TAG para criar links de checkout.";
  }
}

export function isPaymentProviderConfigured(
  provider = getActivePaymentProviderName(),
) {
  switch (provider) {
    case "abacatepay":
      return isAbacatePayConfigured();
    case "santander":
      return isSantanderConfigured();
    case "infinitepay":
      return isInfinitePayConfigured();
  }
}

export async function createPixCharge(input: CreatePixChargeInput) {
  switch (getActivePaymentProviderName()) {
    case "abacatepay":
      return createAbacatePixCharge(input);
    case "santander":
      return createSantanderPixCharge(input);
    case "infinitepay":
      return createInfinitePayCheckoutCharge(input);
  }
}

export async function checkPixCharge({
  provider,
  providerPaymentId,
  amountInCents,
  santanderWebhookPix,
}: {
  provider: PaymentProviderName;
  providerPaymentId: string;
  amountInCents?: number;
  santanderWebhookPix?: SantanderPix;
}): Promise<PaymentChargeSnapshot> {
  switch (provider) {
    case "abacatepay":
      return checkAbacatePixCharge(providerPaymentId, amountInCents);
    case "santander":
      return checkSantanderPixCharge(
        providerPaymentId,
        amountInCents,
        santanderWebhookPix,
      );
    case "infinitepay":
      return checkInfinitePayCheckoutCharge(providerPaymentId, amountInCents);
  }
}

export async function simulatePixCharge({
  provider,
  providerPaymentId,
}: {
  provider: PaymentProviderName;
  providerPaymentId: string;
}) {
  switch (provider) {
    case "abacatepay":
      return simulateAbacatePixCharge(providerPaymentId);
    case "santander":
      throw new Error("Simulacao nao disponivel para este gateway.");
    case "infinitepay":
      throw new Error("Simulacao nao disponivel para este gateway.");
  }
}
