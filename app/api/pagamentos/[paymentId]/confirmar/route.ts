import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";
import { settlePixPayment } from "@/lib/payments/settle-payment";

type ConfirmPaymentPayload = {
  pixTransactionId?: string;
  paidAmountInCents?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  const payload = (await request.json()) as ConfirmPaymentPayload;

  if (!payload.pixTransactionId) {
    return Response.json(
      { error: "pixTransactionId e obrigatorio para confirmar o PIX." },
      { status: 400 },
    );
  }

  try {
    const savedPayment = await settlePixPayment({
      paymentId,
      pixTransactionId: payload.pixTransactionId,
      paidAmountInCents: payload.paidAmountInCents,
      verificationSource: PaymentVerificationSource.WEBHOOK,
    });

    return Response.json(savedPayment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao confirmar pagamento.";

    if (message === "Pagamento nao encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "A cobranca PIX expirou e nao pode mais ser confirmada.") {
      const dataSource = await getDataSource();
      const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
      const payment = await paymentRepository.findOneBy({ id: paymentId });

      if (payment && payment.status !== PaymentStatus.EXPIRED) {
        payment.status = PaymentStatus.EXPIRED;
        await paymentRepository.save(payment);
      }

      return Response.json({ error: message }, { status: 410 });
    }

    if (
      message === "O identificador PIX informado nao corresponde a cobranca." ||
      message === "O valor recebido difere do valor esperado da cobranca."
    ) {
      return Response.json({ error: message }, { status: 409 });
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
