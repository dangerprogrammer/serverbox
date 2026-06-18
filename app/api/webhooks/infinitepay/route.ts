import { revalidatePath } from "next/cache";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  getInfinitePayProviderName,
  getInfinitePayWebhookAmountInCents,
  getInfinitePayWebhookReference,
  getInfinitePayWebhookSnapshot,
  getInfinitePayWebhookTransactionId,
  type InfinitePayWebhookPayload,
  verifyInfinitePayWebhook,
} from "@/lib/payments/infinitepay";
import { applyProviderPaymentSnapshot } from "@/lib/payments/settle-payment";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const isVerified = verifyInfinitePayWebhook({
    secret: url.searchParams.get("webhookSecret"),
  });

  if (!isVerified) {
    return Response.json({ success: false, message: "Webhook invalido." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | InfinitePayWebhookPayload
    | null;

  if (!payload) {
    return Response.json(
      { success: false, message: "Payload InfinitePay invalido." },
      { status: 400 },
    );
  }

  const reference = getInfinitePayWebhookReference(payload);

  if (!reference) {
    return Response.json(
      { success: false, message: "Payload InfinitePay sem order_nsu." },
      { status: 400 },
    );
  }

  const providerPaymentId = reference;
  const transactionId = getInfinitePayWebhookTransactionId(payload);
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: [
      {
        provider: getInfinitePayProviderName(),
        reference,
      },
      {
        provider: getInfinitePayProviderName(),
        providerPaymentId,
      },
      ...(transactionId
        ? [
            {
              provider: getInfinitePayProviderName(),
              pixTransactionId: transactionId,
            },
          ]
        : []),
    ],
    relations: {
      condominium: true,
    },
  });

  if (!payment) {
    return Response.json(
      { success: false, message: "Pagamento nao encontrado." },
      { status: 404 },
    );
  }

  const webhookAmountInCents = getInfinitePayWebhookAmountInCents(payload);

  if (
    webhookAmountInCents !== null &&
    webhookAmountInCents !== payment.amountInCents
  ) {
    console.warn("[infinitepay] webhook amount mismatch", {
      paymentId: payment.id,
      reference,
      localAmountInCents: payment.amountInCents,
      webhookAmountInCents,
    });

    return Response.json(
      { success: false, message: "Valor do pagamento divergente." },
      { status: 400 },
    );
  }

  const snapshot = getInfinitePayWebhookSnapshot({
    payload,
    providerPaymentId,
    fallbackAmountInCents: payment.amountInCents,
  });

  await applyProviderPaymentSnapshot({
    payment,
    snapshot,
    verificationSource: PaymentVerificationSource.WEBHOOK,
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/pagamentos/${payment.id}`);

  return Response.json({ success: true, message: null, received: true });
}
