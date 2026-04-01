import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";
import {
  createAbacatePixCharge,
  isAbacatePayConfigured,
} from "@/lib/payments/abacatepay";

type CreateCondominiumPaymentInput = {
  planId: string;
  condominiumId?: string;
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

export async function createCondominiumPayment({
  planId,
  condominiumId,
}: CreateCondominiumPaymentInput) {
  if (!isAbacatePayConfigured()) {
    throw new Error("ABACATEPAY_API_KEY nao configurada.");
  }

  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const plan = await planRepository.findOne({
    where: { id: planId },
    relations: {
      condominium: {
        primaryAdmin: true,
      },
    },
  });

  if (!plan) {
    throw new Error("Plano nao encontrado.");
  }

  const condominium = plan.condominium;

  if (!condominium || (condominiumId && condominium.id !== condominiumId)) {
    throw new Error("Plano nao pertence ao condominio informado.");
  }

  const defaultCustomerCellphone = getDefaultAbacatePayCustomerCellphone();

  if (!defaultCustomerCellphone) {
    throw new Error("ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE nao configurado.");
  }

  const defaultCustomerTaxId = getDefaultAbacatePayCustomerTaxId();

  if (!defaultCustomerTaxId) {
    throw new Error("ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID nao configurado.");
  }

  const reference = buildPaymentReference();
  const charge = await createAbacatePixCharge({
    amountInCents: plan.monthlyPriceInCents,
    reference,
    customer: {
      name: condominium.primaryAdmin.name,
      email: condominium.primaryAdmin.email,
      cellphone: defaultCustomerCellphone,
      taxId: defaultCustomerTaxId,
    },
    metadata: {
      reference,
      planId: plan.id,
      condominiumId: condominium.id,
    },
  });

  return paymentRepository.save({
    condominium,
    plan,
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
