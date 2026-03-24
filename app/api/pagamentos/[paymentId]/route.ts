import { getPaymentDetails } from "@/lib/data/payment";

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
