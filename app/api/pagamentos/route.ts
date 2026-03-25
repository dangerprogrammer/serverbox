import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";
import {
  createAbacatePixCharge,
  isAbacatePayConfigured,
} from "@/lib/payments/abacatepay";
import {
  buildLocalPixProviderCharge,
  buildPaymentReference,
} from "@/lib/payments/pix";

type CreatePaymentPayload = {
  condominiumId?: string;
  planId?: string;
  method?: string;
};

export async function GET() {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const payments = await paymentRepository.find({
    relations: {
      condominium: true,
      plan: true,
    },
    order: {
      createdAt: "DESC",
    },
  });

  return Response.json(
    payments.map((payment: CondominiumPayment) => ({
      id: payment.id,
      reference: payment.reference,
      status: payment.status,
      method: payment.method,
      amountInCents: payment.amountInCents,
      ballQuantity: payment.ballQuantity,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      providerRawStatus: payment.providerRawStatus,
      providerReceiptUrl: payment.providerReceiptUrl,
      providerDevMode: payment.providerDevMode,
      pixTransactionId: payment.pixTransactionId,
      pixQrCode: payment.pixQrCode,
      pixCopyPasteCode: payment.pixCopyPasteCode,
      pixExpiresAt: payment.pixExpiresAt,
      paidAt: payment.paidAt,
      verifiedAt: payment.verifiedAt,
      verificationSource: payment.verificationSource,
      condominium: {
        id: payment.condominium.id,
        name: payment.condominium.name,
      },
      plan: {
        id: payment.plan.id,
        name: payment.plan.name,
      },
    })),
  );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreatePaymentPayload;

  if (!payload.condominiumId || !payload.planId) {
    return Response.json(
      { error: "condominiumId e planId sao obrigatorios." },
      { status: 400 },
    );
  }

  if (payload.method && payload.method !== PaymentMethod.PIX) {
    return Response.json(
      { error: "Somente pagamentos PIX sao suportados." },
      { status: 400 },
    );
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const [condominium, plan] = await Promise.all([
    condominiumRepository.findOne({
      where: { id: payload.condominiumId },
      relations: {
        primaryAdmin: true,
      },
    }),
    planRepository.findOneBy({ id: payload.planId }),
  ]);

  if (!condominium || !plan) {
    return Response.json(
      { error: "Condominio ou plano nao encontrado." },
      { status: 404 },
    );
  }

  const reference = buildPaymentReference();
  const pixCharge = isAbacatePayConfigured()
    ? await createAbacatePixCharge({
        amountInCents: plan.monthlyPriceInCents,
        reference,
        customer: {
          name: condominium.primaryAdmin.name,
          email: condominium.primaryAdmin.email,
        },
        metadata: {
          condominiumId: condominium.id,
          planId: plan.id,
        },
      })
    : buildLocalPixProviderCharge({
        amountInCents: plan.monthlyPriceInCents,
        reference,
      });

  const payment = await paymentRepository.save({
    condominium,
    plan,
    reference,
    method: PaymentMethod.PIX,
    status: PaymentStatus.PENDING,
    amountInCents: pixCharge.amountInCents,
    ballQuantity: plan.monthlyBallAllowance,
    provider: pixCharge.provider,
    providerPaymentId: pixCharge.providerPaymentId,
    providerRawStatus: pixCharge.providerRawStatus,
    providerReceiptUrl: pixCharge.providerReceiptUrl,
    providerDevMode: pixCharge.providerDevMode,
    pixTransactionId: pixCharge.pixTransactionId,
    pixQrCode: pixCharge.pixQrCode,
    pixCopyPasteCode: pixCharge.pixCopyPasteCode,
    pixExpiresAt: pixCharge.pixExpiresAt,
    paidAt: null,
    verifiedAt: null,
    verificationSource: null,
  });

  return Response.json(payment, { status: 201 });
}
