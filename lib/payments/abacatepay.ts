import crypto from "node:crypto";

import {
  PaymentMethod,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";

const ABACATEPAY_API_BASE_URL =
  process.env.ABACATEPAY_API_BASE_URL?.trim() || "https://api.abacatepay.com/v2";
const ABACATEPAY_PROVIDER = "abacatepay";

type AbacatePayRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  searchParams?: Record<string, string | undefined>;
  body?: unknown;
};

type AbacatePayTransparentStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "REFUNDED"
  | "FAILED";

type AbacatePayTransparent = {
  id: string;
  amount: number;
  status: AbacatePayTransparentStatus;
  devMode?: boolean;
  brCode?: string | null;
  brCodeBase64?: string | null;
  platformFee?: number;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;
  receiptUrl?: string | null;
  metadata?: Record<string, string>;
};

type CreateAbacatePixChargeInput = {
  amountInCents: number;
  reference: string;
  customer: {
    name: string;
    email: string;
    cellphone?: string;
    taxId?: string;
  };
  metadata?: Record<string, string>;
};

export type AbacatePayChargeSnapshot = {
  provider: typeof ABACATEPAY_PROVIDER;
  providerPaymentId: string;
  providerRawStatus: AbacatePayTransparentStatus;
  providerReceiptUrl: string | null;
  providerDevMode: boolean;
  method: PaymentMethod;
  status: PaymentStatus;
  amountInCents: number;
  pixTransactionId: string | null;
  pixQrCode: string | null;
  pixCopyPasteCode: string | null;
  pixExpiresAt: Date | null;
};

export type AbacatePayWebhookPayload = {
  event: string;
  apiVersion: number;
  devMode: boolean;
  data?: {
    transparent?: AbacatePayTransparent;
    payerInformation?: {
      method?: string;
      PIX?: {
        name?: string;
        taxId?: string;
        isSameAsCustomer?: boolean;
      };
    };
  };
};

function getAbacatePayApiKey() {
  return process.env.ABACATEPAY_API_KEY?.trim() || null;
}

function getAbacatePayWebhookSecret() {
  return process.env.ABACATEPAY_WEBHOOK_SECRET?.trim() || null;
}

function getAbacatePayPublicWebhookKey() {
  return process.env.ABACATEPAY_PUBLIC_WEBHOOK_KEY?.trim() || null;
}

function buildUrl(path: string, searchParams?: Record<string, string | undefined>) {
  const url = new URL(path, `${ABACATEPAY_API_BASE_URL}/`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url;
}

async function requestAbacatePay<T>({
  method = "GET",
  path,
  searchParams,
  body,
}: AbacatePayRequestOptions): Promise<T> {
  const apiKey = getAbacatePayApiKey();

  if (!apiKey) {
    throw new Error("ABACATEPAY_API_KEY nao configurada.");
  }

  const response = await fetch(buildUrl(path, searchParams), {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: T;
    error?: { message?: string } | string | null;
    success?: boolean;
  };

  if (!response.ok || !payload.data) {
    const errorMessage =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message || "Falha ao comunicar com a AbacatePay.";

    throw new Error(errorMessage);
  }

  return payload.data;
}

function mapAbacateStatus(status: string): PaymentStatus {
  switch (status) {
    case "PAID":
      return PaymentStatus.PAID;
    case "EXPIRED":
      return PaymentStatus.EXPIRED;
    case "REFUNDED":
      return PaymentStatus.REFUNDED;
    case "FAILED":
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
}

function buildChargeSnapshot(
  transparent: AbacatePayTransparent,
): AbacatePayChargeSnapshot {
  return {
    provider: ABACATEPAY_PROVIDER,
    providerPaymentId: transparent.id,
    providerRawStatus: transparent.status,
    providerReceiptUrl: transparent.receiptUrl ?? null,
    providerDevMode: Boolean(transparent.devMode),
    method: PaymentMethod.PIX,
    status: mapAbacateStatus(transparent.status),
    amountInCents: transparent.amount,
    pixTransactionId: null,
    pixQrCode: transparent.brCodeBase64 ?? null,
    pixCopyPasteCode: transparent.brCode ?? null,
    pixExpiresAt: transparent.expiresAt ? new Date(transparent.expiresAt) : null,
  };
}

export function isAbacatePayConfigured() {
  return Boolean(getAbacatePayApiKey());
}

export function getAbacatePayProviderName() {
  return ABACATEPAY_PROVIDER;
}

export async function createAbacatePixCharge({
  amountInCents,
  reference,
  customer,
  metadata,
}: CreateAbacatePixChargeInput) {
  const body: Record<string, unknown> = {
    method: "PIX",
    data: {
      amount: amountInCents,
      description: `Pagamento ${reference}`,
      customer: {
        name: customer.name,
        email: customer.email,
        ...(customer.cellphone ? { cellphone: customer.cellphone } : {}),
        ...(customer.taxId ? { taxId: customer.taxId } : {}),
      },
      metadata: {
        reference,
        ...metadata,
      },
    },
  };

  const transparent = await requestAbacatePay<AbacatePayTransparent>({
    method: "POST",
    path: "transparents/create",
    body,
  });

  return buildChargeSnapshot(transparent);
}

export async function checkAbacatePixCharge(providerPaymentId: string) {
  const transparent = await requestAbacatePay<AbacatePayTransparent>({
    path: "transparents/check",
    searchParams: {
      id: providerPaymentId,
    },
  });

  return buildChargeSnapshot(transparent);
}

export async function simulateAbacatePixCharge(providerPaymentId: string) {
  const transparent = await requestAbacatePay<AbacatePayTransparent>({
    method: "POST",
    path: "transparents/simulate-payment",
    searchParams: {
      id: providerPaymentId,
    },
    body: {
      metadata: {},
    },
  });

  return buildChargeSnapshot(transparent);
}

export function verifyAbacatePayWebhook({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string | null;
  secret: string | null;
}) {
  const expectedSecret = getAbacatePayWebhookSecret();

  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return false;
  }

  const publicKey = getAbacatePayPublicWebhookKey();

  if (!publicKey || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", publicKey)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");
  const providedSignature = Buffer.from(signature);
  const normalizedExpectedSignature = Buffer.from(expectedSignature);

  return (
    normalizedExpectedSignature.length === providedSignature.length &&
    crypto.timingSafeEqual(normalizedExpectedSignature, providedSignature)
  );
}

export function getAbacatePayWebhookReference(payload: AbacatePayWebhookPayload) {
  return payload.data?.transparent?.metadata?.reference ?? null;
}

export function getAbacatePayWebhookProviderPaymentId(
  payload: AbacatePayWebhookPayload,
) {
  return payload.data?.transparent?.id ?? null;
}

export function getAbacatePayWebhookSnapshot(payload: AbacatePayWebhookPayload) {
  const transparent = payload.data?.transparent;

  if (!transparent) {
    return null;
  }

  return buildChargeSnapshot(transparent);
}
