import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import type { Repository } from "typeorm";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  createAbacatePixCharge,
  isAbacatePayConfigured,
} from "@/lib/payments/abacatepay";
import {
  STANDALONE_BALL_PURCHASE_PLAN_NAME,
  calculateRemainingBallStock,
  calculateStandalonePaymentCapacity,
  findOpenStandaloneBallPayment,
  hasPendingPaymentExpired,
} from "@/lib/payments/stock";
import { sumTubeStockEntries, type TubeStockEntry } from "@/lib/domain/tube-stock";

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

async function expirePendingPaymentsIfNeeded(
  paymentRepository: Repository<CondominiumPayment>,
  payments: CondominiumPayment[],
) {
  const expiredPayments = payments.filter(hasPendingPaymentExpired);

  if (expiredPayments.length === 0) {
    return payments;
  }

  for (const payment of expiredPayments) {
    payment.status = PaymentStatus.EXPIRED;
  }

  await paymentRepository.save(expiredPayments);

  return payments;
}

function assertBallStockAvailable({
  requestedBallQuantity,
  remainingBallStock,
}: {
  requestedBallQuantity: number;
  remainingBallStock: number;
}) {
  if (requestedBallQuantity > remainingBallStock) {
    throw new Error(
      `Estoque insuficiente. Restam ${remainingBallStock} tubos disponíveis para este condomínio.`,
    );
  }
}

function getCondominiumStockQuantity(condominium: {
  ballQuantity: number;
  tubeStockByBrand?: TubeStockEntry[] | null;
}) {
  return sumTubeStockEntries(condominium.tubeStockByBrand) || condominium.ballQuantity;
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
    throw new Error("ABACATEPAY_API_KEY nÃ£o configurada.");
  }

  const defaultCustomerCellphone = getDefaultAbacatePayCustomerCellphone();

  if (!defaultCustomerCellphone) {
    throw new Error("ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE nÃ£o configurado.");
  }

  const defaultCustomerTaxId = getDefaultAbacatePayCustomerTaxId();

  if (!defaultCustomerTaxId) {
    throw new Error("ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID nÃ£o configurado.");
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
      payments: true,
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
      throw new Error("Plano nÃ£o encontrado.");
    }

    throw new Error("Plano nÃ£o pertence ao condomÃ­nio informado.");
  }

  const plan = condominium.plans.find((entry) => entry.id === planId);

  if (!plan) {
    throw new Error("Plano nÃ£o encontrado.");
  }

  if (!Number.isFinite(plan.monthlyBallAllowance) || plan.monthlyBallAllowance <= 0) {
    throw new Error("Plano precisa ter uma quantidade de tubos maior que zero.");
  }

  await expirePendingPaymentsIfNeeded(paymentRepository, condominium.payments);
  const stockQuantity = getCondominiumStockQuantity(condominium);
  const remainingBallStock = calculateRemainingBallStock({
    stockQuantity,
    payments: condominium.payments,
  });

  assertBallStockAvailable({
    requestedBallQuantity: plan.monthlyBallAllowance,
    remainingBallStock,
  });

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
    throw new Error("CondomÃ­nio Ã© obrigatÃ³rio para compra avulsa.");
  }

  if (!Number.isFinite(ballQuantity) || ballQuantity <= 0) {
    throw new Error("Quantidade de tubos invÃ¡lida.");
  }

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    throw new Error("Valor em centavos invÃ¡lido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const condominium = await condominiumRepository.findOne({
    where: { id: condominiumId },
    relations: {
      primaryAdmin: true,
      payments: true,
    },
  });

  if (!condominium) {
    throw new Error("CondomÃ­nio nÃ£o encontrado.");
  }

  await expirePendingPaymentsIfNeeded(paymentRepository, condominium.payments);
  const openStandalonePayment = findOpenStandaloneBallPayment(condominium.payments);

  if (openStandalonePayment) {
    const stockQuantity = getCondominiumStockQuantity(condominium);
    const availablePaymentCount = calculateStandalonePaymentCapacity({
      stockQuantity,
      payments: condominium.payments,
      payment: openStandalonePayment,
    });

    if (availablePaymentCount <= 0) {
      throw new Error(
        "Estoque insuficiente para reutilizar o QR Code avulso aberto deste condomínio.",
      );
    }

    const reusablePayment = await paymentRepository.findOne({
      where: { id: openStandalonePayment.id },
      relations: {
        condominium: true,
      },
    });

    if (!reusablePayment) {
      throw new Error("Pagamento avulso em aberto não encontrado.");
    }

    return reusablePayment;
  }

  const remainingBallStock = calculateRemainingBallStock({
    stockQuantity: getCondominiumStockQuantity(condominium),
    payments: condominium.payments,
  });

  assertBallStockAvailable({
    requestedBallQuantity: ballQuantity,
    remainingBallStock,
  });

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
    planName: STANDALONE_BALL_PURCHASE_PLAN_NAME,
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

