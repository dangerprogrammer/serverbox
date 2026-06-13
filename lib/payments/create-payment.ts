import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import type { Repository } from "typeorm";
import crypto from "node:crypto";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  createPixCharge,
  getActivePaymentProviderName,
  getPaymentProviderConfigError,
  isPaymentProviderConfigured,
} from "@/lib/payments/gateway";
import {
  STANDALONE_BALL_PURCHASE_PLAN_NAME,
  calculateRemainingBallStock,
  calculateStandalonePaymentCapacity,
  findOpenStandaloneBallPayment,
  hasPendingPaymentExpired,
} from "@/lib/payments/stock";
import {
  sumActiveTubeStockEntries,
  getActiveTubeStockEntries,
  type TubeStockEntry,
} from "@/lib/domain/tube-stock";

type CreateCondominiumPaymentInput = {
  planId: string;
  condominiumId?: string;
};

type CreateStandaloneBallPaymentInput = {
  condominiumId: string;
  tubeBrandId: string;
  ballQuantity: number;
  amountInCents: number;
};

function getDefaultPaymentCustomerCellphone() {
  return (
    process.env.PAYMENT_DEFAULT_CUSTOMER_CELLPHONE?.trim() ||
    process.env.ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE?.trim() ||
    null
  );
}

function getDefaultPaymentCustomerTaxId() {
  return (
    process.env.PAYMENT_DEFAULT_CUSTOMER_TAX_ID?.trim() ||
    process.env.SANTANDER_DEFAULT_PAYER_TAX_ID?.trim() ||
    process.env.ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID?.trim() ||
    null
  );
}

function buildPaymentReference() {
  const now = new Date();
  const serial = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

  return `SB${serial}${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
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
  courtDetails?: Array<{
    tubeBrand?: { id?: string | null } | null;
    tubeBrands?: Array<{ id?: string | null } | null> | null;
  }> | null;
}) {
  return sumActiveTubeStockEntries(
    condominium.tubeStockByBrand,
    condominium.courtDetails,
    condominium.ballQuantity,
  );
}

function getActiveTubeBrandName(
  condominium: {
    courtDetails?: Array<{
      tubeBrand?: { id?: string | null; name?: string | null } | null;
      tubeBrands?: Array<{ id?: string | null; name?: string | null } | null> | null;
    }> | null;
  },
  tubeBrandId: string,
) {
  for (const court of condominium.courtDetails ?? []) {
    const tubeBrands =
      court.tubeBrands && court.tubeBrands.length > 0
        ? court.tubeBrands
        : [court.tubeBrand];
    const tubeBrand = tubeBrands.find((brand) => brand?.id === tubeBrandId);

    if (tubeBrand?.name) {
      return tubeBrand.name;
    }
  }

  return "Marca selecionada";
}

function getCondominiumTubeBrandStock(
  condominium: {
    ballQuantity: number;
    tubeStockByBrand?: TubeStockEntry[] | null;
    courtDetails?: Array<{
      tubeBrand?: { id?: string | null; name?: string | null } | null;
      tubeBrands?: Array<{ id?: string | null; name?: string | null } | null> | null;
    }> | null;
  },
  tubeBrandId: string,
) {
  return getActiveTubeStockEntries(
    condominium.tubeStockByBrand,
    condominium.courtDetails,
  ).find((entry) => entry.tubeBrandId === tubeBrandId);
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
  const provider = getActivePaymentProviderName();

  if (!isPaymentProviderConfigured(provider)) {
    throw new Error(getPaymentProviderConfigError(provider));
  }

  const defaultCustomerCellphone = getDefaultPaymentCustomerCellphone();

  if (provider === "abacatepay" && !defaultCustomerCellphone) {
    throw new Error("PAYMENT_DEFAULT_CUSTOMER_CELLPHONE nao configurado.");
  }

  const defaultCustomerTaxId = getDefaultPaymentCustomerTaxId();

  if (!defaultCustomerTaxId) {
    throw new Error("PAYMENT_DEFAULT_CUSTOMER_TAX_ID nao configurado.");
  }

  const reference = buildPaymentReference();
  const stringMetadata = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)]),
  );
  const charge = await createPixCharge({
    amountInCents,
    reference,
    customer: {
      name: administratorName,
      email: administratorEmail,
      cellphone: defaultCustomerCellphone ?? undefined,
      taxId: defaultCustomerTaxId,
    },
    metadata: {
      reference,
      condominiumName,
      ...stringMetadata,
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
      courtDetails: { tubeBrand: true, tubeBrands: true },
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
    tubeBrandId: null,
    tubeBrandName: null,
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
  tubeBrandId,
  ballQuantity,
  amountInCents,
}: CreateStandaloneBallPaymentInput) {
  const requestedTubeBrandId = tubeBrandId.trim();

  if (!condominiumId) {
    throw new Error("CondomÃ­nio Ã© obrigatÃ³rio para compra avulsa.");
  }

  if (!Number.isFinite(ballQuantity) || ballQuantity <= 0) {
    throw new Error("Quantidade de tubos invÃ¡lida.");
  }

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    throw new Error("Valor em centavos invÃ¡lido.");
  }

  if (!requestedTubeBrandId) {
    throw new Error("Marca de tubos Ã© obrigatÃ³ria para compra avulsa.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const condominium = await condominiumRepository.findOne({
    where: { id: condominiumId },
    relations: {
      primaryAdmin: true,
      courtDetails: { tubeBrand: true, tubeBrands: true },
      payments: true,
    },
  });

  if (!condominium) {
    throw new Error("CondomÃ­nio nÃ£o encontrado.");
  }

  await expirePendingPaymentsIfNeeded(paymentRepository, condominium.payments);
  const tubeBrandStock = getCondominiumTubeBrandStock(
    condominium,
    requestedTubeBrandId,
  );

  if (!tubeBrandStock) {
    throw new Error("Marca de tubos indisponÃ­vel para compra avulsa.");
  }

  const tubeBrandName = getActiveTubeBrandName(condominium, requestedTubeBrandId);
  const openStandalonePayment = findOpenStandaloneBallPayment(condominium.payments, {
    tubeBrandId: requestedTubeBrandId,
  });

  if (openStandalonePayment) {
    const totalStockQuantity = getCondominiumStockQuantity(condominium);
    const availableByBrand = calculateStandalonePaymentCapacity({
      stockQuantity: tubeBrandStock.quantity,
      payments: condominium.payments,
      payment: openStandalonePayment,
      tubeBrandId: requestedTubeBrandId,
    });
    const availableByTotalStock = calculateStandalonePaymentCapacity({
      stockQuantity: totalStockQuantity,
      payments: condominium.payments,
      payment: openStandalonePayment,
    });
    const availablePaymentCount = Math.min(
      availableByBrand,
      availableByTotalStock,
    );

    if (availablePaymentCount <= 0) {
      throw new Error(
        "Estoque insuficiente para reutilizar o QR Code avulso aberto desta marca.",
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

  const totalRemainingBallStock = calculateRemainingBallStock({
    stockQuantity: getCondominiumStockQuantity(condominium),
    payments: condominium.payments,
  });
  const remainingBrandStock = calculateRemainingBallStock({
    stockQuantity: tubeBrandStock.quantity,
    payments: condominium.payments,
    tubeBrandId: requestedTubeBrandId,
  });
  const availableBallStock = Math.min(totalRemainingBallStock, remainingBrandStock);

  assertBallStockAvailable({
    requestedBallQuantity: ballQuantity,
    remainingBallStock: availableBallStock,
  });

  const { charge, reference } = await buildChargeForCondominium({
    condominiumName: condominium.name,
    administratorName: condominium.primaryAdmin.name,
    administratorEmail: condominium.primaryAdmin.email,
    amountInCents,
    metadata: {
      condominiumId: condominium.id,
      paymentType: "standalone_ball_purchase",
      tubeBrandId: requestedTubeBrandId,
      tubeBrandName,
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
    tubeBrandId: requestedTubeBrandId,
    tubeBrandName,
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

