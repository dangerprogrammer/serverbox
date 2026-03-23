import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";

type CreatePaymentPayload = {
  condominiumId?: string;
  planId?: string;
  method?: string;
};

function normalizePaymentMethod(value?: string) {
  switch (value) {
    case PaymentMethod.CREDIT_CARD:
      return PaymentMethod.CREDIT_CARD;
    case PaymentMethod.BOLETO:
      return PaymentMethod.BOLETO;
    case PaymentMethod.MANUAL:
      return PaymentMethod.MANUAL;
    default:
      return PaymentMethod.PIX;
  }
}

function buildReference() {
  return `api-pay-${Date.now()}`;
}

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
      paidAt: payment.paidAt,
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

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const [condominium, plan] = await Promise.all([
    condominiumRepository.findOneBy({ id: payload.condominiumId }),
    planRepository.findOneBy({ id: payload.planId }),
  ]);

  if (!condominium || !plan) {
    return Response.json(
      { error: "Condominio ou plano nao encontrado." },
      { status: 404 },
    );
  }

  const payment = await paymentRepository.save({
    condominium,
    plan,
    reference: buildReference(),
    method: normalizePaymentMethod(payload.method),
    status: PaymentStatus.PENDING,
    amountInCents: plan.monthlyPriceInCents,
    ballQuantity: plan.monthlyBallAllowance,
    paidAt: null,
  });

  return Response.json(payment, { status: 201 });
}
