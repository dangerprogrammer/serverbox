import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  createAbacatePixCharge,
  isAbacatePayConfigured,
} from "@/lib/payments/abacatepay";

type CreateCondominiumPaymentInput = {
  planId: string;
  condominiumId?: string;
};

type CreateStandaloneBallPaymentInput = {
  condominiumId: string;
  ballQuantity: number;
  amountInCents: number;
};

function getDefaultAbacatePayCustomerCellphone() {
  return process.env.ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE?.trim() || null;
}

function getDefaultAbacatePayCustomerTaxId() {
  return process.env.ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID?.trim() || null;
}

function buildPaymentReference() {
  const now = new Date();
  const serial = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

  return `pay-${serial}-${Math.random().toString(36).slice(2, 6)}`;
}

async function buildChargeForCondominium({
  condominiumName,
  administratorName,
  administratorEmail,
  amountInCents,
  metadata,
}: {
  condominiumName: string;
  administratorName: string;
  administratorEmail: string;
  amountInCents: number;
  metadata: Record<string, string | number>;
}) {
  if (!isAbacatePayConfigured()) {
    throw new Error("ABACATEPAY_API_KEY não configurada.");
  }

  const defaultCustomerCellphone = getDefaultAbacatePayCustomerCellphone();

  if (!defaultCustomerCellphone) {
    throw new Error("ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE não configurado.");
  }

  const defaultCustomerTaxId = getDefaultAbacatePayCustomerTaxId();

  if (!defaultCustomerTaxId) {
    throw new Error("ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID não configurado.");
  }

  const reference = buildPaymentReference();
  const charge = await createAbacatePixCharge({
    amountInCents,
    reference,
    customer: {
      name: administratorName,
      email: administratorEmail,
      cellphone: defaultCustomerCellphone,
      taxId: defaultCustomerTaxId,
    },
    metadata: {
      reference,
      condominiumName,
      ...metadata,
    },
  });

  return { charge, reference };
}

export async function createCondominiumPayment({
  planId,
  condominiumId,
}: CreateCondominiumPaymentInput) {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
    },
  });
  const condominium = condominiums.find(
    (entry) =>
      (!condominiumId || entry.id === condominiumId) &&
      entry.plans.some((plan) => plan.id === planId),
  );

  if (!condominium) {
    const hasPlan = condominiums.some((entry) =>
      entry.plans.some((plan) => plan.id === planId),
    );

    if (!hasPlan) {
      throw new Error("Plano não encontrado.");
    }

    throw new Error("Plano não pertence ao condomínio informado.");
  }

  const plan = condominium.plans.find((entry) => entry.id === planId);

  if (!plan) {
    throw new Error("Plano não encontrado.");
  }

  const { charge, reference } = await buildChargeForCondominium({
    condominiumName: condominium.name,
    administratorName: condominium.primaryAdmin.name,
    administratorEmail: condominium.primaryAdmin.email,
    amountInCents: plan.monthlyPriceInCents,
    metadata: {
      planId,
      condominiumId: condominium.id,
      paymentType: "plan",
    },
  });

  return paymentRepository.save({
    condominium,
    planId: plan.id,
    planName: plan.name,
    reference,
    method: charge.method,
    status: PaymentStatus.PENDING,
    amountInCents: charge.amountInCents,
    ballQuantity: plan.monthlyBallAllowance,
    provider: charge.provider,
    providerPaymentId: charge.providerPaymentId,
    providerRawStatus: charge.providerRawStatus,
    providerReceiptUrl: charge.providerReceiptUrl,
    providerDevMode: charge.providerDevMode,
    pixTransactionId: charge.pixTransactionId,
    pixQrCode: charge.pixQrCode,
    pixCopyPasteCode: charge.pixCopyPasteCode,
    pixExpiresAt: charge.pixExpiresAt,
    paidAt: null,
    verifiedAt: null,
    verificationSource: null,
  });
}

export async function createStandaloneBallPayment({
  condominiumId,
  ballQuantity,
  amountInCents,
}: CreateStandaloneBallPaymentInput) {
  if (!condominiumId) {
    throw new Error("Condomínio é obrigatório para compra avulsa.");
  }

  if (!Number.isFinite(ballQuantity) || ballQuantity <= 0) {
    throw new Error("Quantidade de bolinhas inválida.");
  }

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    throw new Error("Valor em centavos inválido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const condominium = await condominiumRepository.findOne({
    where: { id: condominiumId },
    relations: {
      primaryAdmin: true,
    },
  });

  if (!condominium) {
    throw new Error("Condomínio não encontrado.");
  }

  const { charge, reference } = await buildChargeForCondominium({
    condominiumName: condominium.name,
    administratorName: condominium.primaryAdmin.name,
    administratorEmail: condominium.primaryAdmin.email,
    amountInCents,
    metadata: {
      condominiumId: condominium.id,
      paymentType: "standalone_ball_purchase",
      ballQuantity,
    },
  });

  return paymentRepository.save({
    condominium,
    planId: `standalone-${reference}`,
    planName: "Compra avulsa de bolinhas",
    reference,
    method: charge.method,
    status: PaymentStatus.PENDING,
    amountInCents: charge.amountInCents,
    ballQuantity,
    provider: charge.provider,
    providerPaymentId: charge.providerPaymentId,
    providerRawStatus: charge.providerRawStatus,
    providerReceiptUrl: charge.providerReceiptUrl,
    providerDevMode: charge.providerDevMode,
    pixTransactionId: charge.pixTransactionId,
    pixQrCode: charge.pixQrCode,
    pixCopyPasteCode: charge.pixCopyPasteCode,
    pixExpiresAt: charge.pixExpiresAt,
    paidAt: null,
    verifiedAt: null,
    verificationSource: null,
  });
}
