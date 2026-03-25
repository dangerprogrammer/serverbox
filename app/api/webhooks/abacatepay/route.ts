import { revalidatePath } from "next/cache";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  getAbacatePayWebhookProviderPaymentId,
  getAbacatePayWebhookReference,
  getAbacatePayWebhookSnapshot,
  type AbacatePayWebhookPayload,
  verifyAbacatePayWebhook,
} from "@/lib/payments/abacatepay";
import { applyProviderPaymentSnapshot } from "@/lib/payments/settle-payment";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const url = new URL(request.url);
  const payload = JSON.parse(rawBody) as AbacatePayWebhookPayload;

  const isVerified = verifyAbacatePayWebhook({
    rawBody,
    signature: request.headers.get("X-Webhook-Signature"),
    secret: url.searchParams.get("webhookSecret"),
  });

  if (!isVerified) {
    return Response.json({ error: "Webhook invalido." }, { status: 401 });
  }

  if (!payload.event.startsWith("transparent.")) {
    return Response.json({ received: true });
  }

  const reference = getAbacatePayWebhookReference(payload);
  const providerPaymentId = getAbacatePayWebhookProviderPaymentId(payload);
  const snapshot = getAbacatePayWebhookSnapshot(payload);

  if (!reference || !providerPaymentId || !snapshot) {
    return Response.json({ error: "Payload incompleto." }, { status: 400 });
  }

  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const payment = await paymentRepository.findOne({
    where: [{ reference }, { providerPaymentId }],
    relations: {
      condominium: true,
      plan: true,
    },
  });

  if (!payment) {
    return Response.json({ error: "Pagamento nao encontrado." }, { status: 404 });
  }

  await applyProviderPaymentSnapshot({
    payment,
    snapshot,
    verificationSource: PaymentVerificationSource.WEBHOOK,
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/pagamentos/${payment.id}`);

  return Response.json({ received: true });
}
