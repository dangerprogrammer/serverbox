import { revalidatePath } from "next/cache";

import { getPaymentDetails } from "@/lib/data/payment";
import { simulatePixPayment, syncPixPayment } from "@/lib/payments/settle-payment";

type ConfirmPaymentPayload = {
  simulate?: boolean;
};

function isProviderConfigurationMessage(message: string) {
  return (
    message.includes("ABACATEPAY") ||
    message.includes("SANTANDER") ||
    message.includes("PAYMENT_PROVIDER") ||
    message.includes("gateway")
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  const payment = await getPaymentDetails(paymentId);

  if (!payment) {
    return Response.json({ error: "Pagamento nao encontrado." }, { status: 404 });
  }

  return Response.json(payment);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as ConfirmPaymentPayload;

  try {
    const savedPayment = payload.simulate
      ? await simulatePixPayment(paymentId)
      : await syncPixPayment({ paymentId });

    if (!savedPayment) {
      return Response.json(
        { error: "Configure as credenciais do gateway para sincronizar pagamentos." },
        { status: 503 },
      );
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/pagamentos/${paymentId}`);

    const payment = await getPaymentDetails(paymentId);

    return Response.json(payment ?? savedPayment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao sincronizar pagamento.";

    if (message === "Pagamento nao encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (
      message === "Pagamento nao esta vinculado ao gateway de pagamento." ||
      message === "Simulacao nao disponivel para este gateway."
    ) {
      return Response.json({ error: message }, { status: 409 });
    }

    if (isProviderConfigurationMessage(message)) {
      return Response.json({ error: message }, { status: 503 });
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
