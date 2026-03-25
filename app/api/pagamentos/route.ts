import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { createCondominiumPayment } from "@/lib/payments/create-payment";

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

  try {
    const payment = await createCondominiumPayment({
      condominiumId: payload.condominiumId,
      planId: payload.planId,
    });

    return Response.json(payment, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar cobranca PIX.";

    if (message === "Condominio ou plano nao encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "ABACATEPAY_API_KEY nao configurada.") {
      return Response.json(
        { error: "Configure ABACATEPAY_API_KEY para criar cobrancas PIX." },
        { status: 503 },
      );
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
