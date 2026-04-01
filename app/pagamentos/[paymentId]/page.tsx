import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PaymentStatusPanel } from "@/app/pagamentos/[paymentId]/_components/payment-status-panel";
import { getPaymentDetails } from "@/lib/data/payment";
import { buildPixQrCodeSvg } from "@/lib/payments/pix-qr";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  await connection();
  const { paymentId } = await params;
  const payment = await getPaymentDetails(paymentId);

  if (!payment) {
    notFound();
  }

  const qrCodeSvg = payment.pixQrCode?.startsWith("data:image/")
    ? null
    : payment.pixCopyPasteCode
      ? await buildPixQrCodeSvg(payment.pixCopyPasteCode)
      : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Checkout PIX AbacatePay
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              QR Code e copia e cola com liberacao automatica.
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Esta cobranca fica em acompanhamento automatico. O saldo so deve
              ser liberado quando a AbacatePay confirmar o pagamento.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Pague com PIX
          </p>
          <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            {payment.pixQrCode?.startsWith("data:image/") ? (
              <Image
                src={payment.pixQrCode}
                alt="QR Code PIX"
                width={280}
                height={280}
                unoptimized
                className="mx-auto w-full max-w-[280px]"
              />
            ) : qrCodeSvg ? (
              <div
                aria-label="QR Code PIX"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-[1rem] border border-dashed border-slate-300 text-sm text-slate-500">
                QR Code indisponivel
              </div>
            )}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Escaneie o QR Code ou copie o codigo PIX. Assim que a AbacatePay
            confirmar a cobranca, o status muda automaticamente.
          </p>
        </section>

        <PaymentStatusPanel
          initialPayment={{
            ...payment,
            pixExpiresAt: payment.pixExpiresAt?.toISOString() ?? null,
            paidAt: payment.paidAt?.toISOString() ?? null,
          }}
        />
      </section>
    </main>
  );
}
