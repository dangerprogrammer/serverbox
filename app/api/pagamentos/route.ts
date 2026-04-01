import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { createCondominiumPayment } from "@/lib/payments/create-payment";

type CreatePaymentPayload = {
  planId?: string;
  condominiumId?: string;
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

  if (!payload.planId) {
    return Response.json(
      { error: "planId e obrigatorio." },
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
      planId: payload.planId,
      condominiumId: payload.condominiumId,
    });

    return Response.json(payment, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar cobranca PIX.";

    if (message === "Plano nao encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Plano nao pertence ao condominio informado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "ABACATEPAY_API_KEY nao configurada.") {
      return Response.json(
        { error: "Configure ABACATEPAY_API_KEY para criar cobrancas PIX." },
        { status: 503 },
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE nao configurado.") {
      return Response.json(
        {
          error:
            "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE para criar cobrancas PIX.",
        },
        { status: 503 },
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID nao configurado.") {
      return Response.json(
        {
          error:
            "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID para criar cobrancas PIX.",
        },
        { status: 503 },
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL invalida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      return Response.json(
        {
          error:
            "A ABACATEPAY_API_BASE_URL configurada precisa apontar para uma URL valida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
        },
        { status: 503 },
      );
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
