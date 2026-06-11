import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  createCondominiumPayment,
  createStandaloneBallPayment,
} from "@/lib/payments/create-payment";

type CreatePaymentPayload = {
  planId?: string;
  condominiumId?: string;
  tubeBrandId?: string;
  ballQuantity?: number;
  amountInCents?: number;
  method?: string;
};

export async function GET() {
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);

  const payments = await paymentRepository.find({
    relations: {
      condominium: true,
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
      tubeBrandId: payment.tubeBrandId,
      tubeBrandName: payment.tubeBrandName,
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
        id: payment.planId,
        name: payment.planName,
      },
    })),
  );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreatePaymentPayload;

  if (payload.method && payload.method !== PaymentMethod.PIX) {
    return Response.json(
      { error: "Somente pagamentos PIX são suportados." },
      { status: 400 },
    );
  }

  try {
    const payment = payload.planId
      ? await createCondominiumPayment({
          planId: payload.planId,
          condominiumId: payload.condominiumId,
        })
      : await createStandaloneBallPayment({
          condominiumId: String(payload.condominiumId ?? ""),
          tubeBrandId: String(payload.tubeBrandId ?? ""),
          ballQuantity: Number(payload.ballQuantity),
          amountInCents: Number(payload.amountInCents),
        });

    return Response.json(payment, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar plano mensal/anual.";

    if (message === "Plano não encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Plano não pertence ao condomínio informado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Condomínio não encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Pagamento avulso em aberto não encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (
      message.startsWith("Estoque insuficiente") ||
      message === "Estoque insuficiente para reutilizar o QR Code avulso aberto deste condomínio."
    ) {
      return Response.json({ error: message }, { status: 409 });
    }

    if (message === "Plano precisa ter uma quantidade de tubos maior que zero.") {
      return Response.json({ error: message }, { status: 400 });
    }

    if (message === "ABACATEPAY_API_KEY não configurada.") {
      return Response.json(
        { error: "Configure ABACATEPAY_API_KEY para criar planos mensais/anuais." },
        { status: 503 },
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE não configurado.") {
      return Response.json(
        {
          error:
            "Configure ABACATEPAY_DEFAULT_CUSTOMER_CELLPHONE para criar planos mensais/anuais.",
        },
        { status: 503 },
      );
    }

    if (message === "ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID não configurado.") {
      return Response.json(
        {
          error:
            "Configure ABACATEPAY_DEFAULT_CUSTOMER_TAX_ID para criar planos mensais/anuais.",
        },
        { status: 503 },
      );
    }

    if (message === "ABACATEPAY_API_BASE_URL inválida. Use uma URL da API v1 ou v2 da AbacatePay.") {
      return Response.json(
        {
          error:
            "A ABACATEPAY_API_BASE_URL configurada precisa apontar para uma URL válida da AbacatePay, como https://api.abacatepay.com/v1 ou https://api.abacatepay.com/v2.",
        },
        { status: 503 },
      );
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
