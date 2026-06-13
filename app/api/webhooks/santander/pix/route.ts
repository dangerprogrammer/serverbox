import { revalidatePath } from "next/cache";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";
import {
  getSantanderProviderName,
  type SantanderWebhookPixPayload,
} from "@/lib/payments/santander";
import { syncPixPayment } from "@/lib/payments/settle-payment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | SantanderWebhookPixPayload
    | null;

  if (!payload || !Array.isArray(payload.pix)) {
    return Response.json({ error: "Payload Santander incompleto." }, { status: 400 });
  }

  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  let processed = 0;
  let ignored = 0;
  let notFound = 0;
  let missingConfiguration = false;

  for (const pix of payload.pix) {
    if (!pix.txid) {
      ignored += 1;
      continue;
    }

    const payment = await paymentRepository.findOne({
      where: [
        {
          provider: getSantanderProviderName(),
          providerPaymentId: pix.txid,
        },
        {
          provider: getSantanderProviderName(),
          reference: pix.txid,
        },
      ],
      relations: {
        condominium: true,
      },
    });

    if (!payment) {
      notFound += 1;
      continue;
    }

    const savedPayment = await syncPixPayment({
      paymentId: payment.id,
      verificationSource: PaymentVerificationSource.WEBHOOK,
      santanderWebhookPix: pix,
    });

    if (!savedPayment) {
      missingConfiguration = true;
      continue;
    }

    processed += 1;
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/pagamentos/${savedPayment.id}`);
  }

  if (missingConfiguration && processed === 0) {
    return Response.json(
      { error: "Configure as credenciais Santander para validar o webhook." },
      { status: 503 },
    );
  }

  return Response.json({
    received: true,
    processed,
    ignored,
    notFound,
  });
}
