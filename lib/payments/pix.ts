import { PaymentMethod } from "@/lib/db/entities/condominium-payment.entity";

type BuildPixChargeInput = {
  amountInCents: number;
  condominiumName: string;
  reference: string;
};

function normalizeSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

export function buildPaymentReference() {
  const now = new Date();
  const serial = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

  return `pay-${serial}-${Math.random().toString(36).slice(2, 6)}`;
}

export function buildPixTransactionId(reference: string) {
  const compactReference = normalizeSegment(reference);
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${compactReference}${randomSuffix}`.slice(0, 32);
}

export function buildPixCharge({
  amountInCents,
  condominiumName,
  reference,
}: BuildPixChargeInput) {
  const pixTransactionId = buildPixTransactionId(reference);
  const normalizedCondominium = normalizeSegment(condominiumName).slice(0, 24);
  const amount = (amountInCents / 100).toFixed(2);
  const pixCopyPasteCode =
    `000201PIXSERVERBOX|REF:${reference}|TXID:${pixTransactionId}` +
    `|VAL:${amount}|COND:${normalizedCondominium}`;

  return {
    method: PaymentMethod.PIX,
    pixTransactionId,
    pixQrCode: `pix:${pixCopyPasteCode}`,
    pixCopyPasteCode,
    pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };
}
