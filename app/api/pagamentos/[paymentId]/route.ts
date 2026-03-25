import { revalidatePath } from "next/cache";

import { getPaymentDetails } from "@/lib/data/payment";
import {
  simulateAbacatePixPayment,
  simulateLocalPixPayment,
  syncAbacatePixPayment,
} from "@/lib/payments/settle-payment";

type ConfirmPaymentPayload = {
  simulate?: boolean;
};

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
      ? await simulateAbacatePixPayment(paymentId).catch(async (error) => {
          if (
            error instanceof Error &&
            error.message === "ABACATEPAY_API_KEY nao configurada."
          ) {
            return simulateLocalPixPayment(paymentId);
          }

          if (
            error instanceof Error &&
            error.message === "Pagamento nao esta vinculado a AbacatePay."
          ) {
            return simulateLocalPixPayment(paymentId);
          }

          throw error;
        })
      : await syncAbacatePixPayment({ paymentId });

    if (!savedPayment) {
      return Response.json(
        { error: "Configure ABACATEPAY_API_KEY para sincronizar pagamentos." },
        { status: 503 },
      );
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/pagamentos/${paymentId}`);

    return Response.json(savedPayment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao sincronizar pagamento.";

    if (message === "Pagamento nao encontrado.") {
      return Response.json({ error: message }, { status: 404 });
    }

    if (message === "Pagamento nao esta vinculado a AbacatePay.") {
      return Response.json({ error: message }, { status: 409 });
    }

    return Response.json({ error: message }, { status: 400 });
  }
}
