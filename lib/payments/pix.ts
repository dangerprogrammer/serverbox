import { PaymentMethod } from "@/lib/db/entities/condominium-payment.entity";

type BuildPixChargeInput = {
  amountInCents: number;
  reference: string;
};

const PIX_TEST_AMOUNT_IN_CENTS = 100;
const PIX_KEY = "52591490848";
const PIX_RECIPIENT_NAME = "PATRICK LEO";
const PIX_RECIPIENT_CITY = "SAO PAULO";

function normalizeSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

function normalizePixText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function buildTlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function calculatePixCrc16(payload: string) {
  let crc = 0xffff;

  for (const character of payload) {
    crc ^= character.charCodeAt(0) << 8;

    for (let index = 0; index < 8; index += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildPixCopyPasteCode({
  amountInCents,
  pixTransactionId,
}: {
  amountInCents: number;
  pixTransactionId: string;
}) {
  const amount = (amountInCents / 100).toFixed(2);
  const merchantName = normalizePixText(PIX_RECIPIENT_NAME, 25);
  const merchantCity = normalizePixText(PIX_RECIPIENT_CITY, 15);
  const accountInformation = buildTlv(
    "26",
    buildTlv("00", "BR.GOV.BCB.PIX") + buildTlv("01", PIX_KEY),
  );
  const additionalDataField = buildTlv("62", buildTlv("05", pixTransactionId));
  const payloadWithoutCrc =
    buildTlv("00", "01") +
    buildTlv("01", "12") +
    accountInformation +
    buildTlv("52", "0000") +
    buildTlv("53", "986") +
    buildTlv("54", amount) +
    buildTlv("58", "BR") +
    buildTlv("59", merchantName) +
    buildTlv("60", merchantCity) +
    additionalDataField +
    "6304";

  return `${payloadWithoutCrc}${calculatePixCrc16(payloadWithoutCrc)}`;
}

export function getPixTestAmountInCents() {
  return PIX_TEST_AMOUNT_IN_CENTS;
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
  reference,
}: BuildPixChargeInput) {
  const pixTransactionId = buildPixTransactionId(reference);
  const pixCopyPasteCode = buildPixCopyPasteCode({
    amountInCents,
    pixTransactionId,
  });

  return {
    method: PaymentMethod.PIX,
    pixTransactionId,
    pixQrCode: `pix:${pixCopyPasteCode}`,
    pixCopyPasteCode,
    pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };
}
