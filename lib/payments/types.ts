import type {
  PaymentMethod,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";

export type PaymentProviderName = "abacatepay" | "santander" | "infinitepay";

export type CreatePixChargeInput = {
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

export type PaymentChargeSnapshot = {
  provider: PaymentProviderName;
  providerPaymentId: string;
  providerRawStatus: string;
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
