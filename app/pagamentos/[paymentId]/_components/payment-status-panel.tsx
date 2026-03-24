'use client';

import { useEffect, useMemo, useState } from "react";

type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";

type PaymentDetails = {
  id: string;
  reference: string;
  status: PaymentStatus;
  amountInCents: number;
  ballQuantity: number;
  pixCopyPasteCode: string | null;
  pixExpiresAt: string | null;
  paidAt: string | null;
  condominiumName: string;
  planName: string;
};

type PaymentStatusPanelProps = {
  initialPayment: PaymentDetails;
};

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pagamento confirmado",
  failed: "Pagamento falhou",
  expired: "PIX expirado",
  refunded: "Pagamento estornado",
};

export function PaymentStatusPanel({
  initialPayment,
}: PaymentStatusPanelProps) {
  const [payment, setPayment] = useState(initialPayment);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (payment.status !== "pending") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/pagamentos/${payment.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextPayment = (await response.json()) as PaymentDetails;
      setPayment(nextPayment);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [payment.id, payment.status]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  const expirationLabel = useMemo(() => {
    if (!payment.pixExpiresAt) {
      return "Sem expiracao informada";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(payment.pixExpiresAt));
  }, [payment.pixExpiresAt]);

  const paidAtLabel = useMemo(() => {
    if (!payment.paidAt) {
      return null;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(payment.paidAt));
  }, [payment.paidAt]);

  async function copyPixCode() {
    if (!payment.pixCopyPasteCode) {
      return;
    }

    await navigator.clipboard.writeText(payment.pixCopyPasteCode);
    setCopied(true);
  }

  return (
    <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Status da cobranca
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            {statusLabels[payment.status]}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {payment.status === "pending"
              ? "O acesso so deve ser liberado depois que o PSP confirmar o pagamento deste PIX."
              : "A cobranca ja recebeu um retorno definitivo do pagamento."}
          </p>
        </div>

        <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {payment.reference}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Condominio</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {payment.condominiumName}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Plano</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {payment.planName}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Liberacao</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {payment.status === "paid" ? "Site liberado" : "Bloqueado"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Codigo copia e cola</p>
            <p className="mt-2 break-all font-mono text-sm text-slate-900">
              {payment.pixCopyPasteCode ?? "Codigo PIX indisponivel"}
            </p>
          </div>
          <button
            type="button"
            onClick={copyPixCode}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            {copied ? "Copiado" : "Copiar codigo"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Valor</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(payment.amountInCents / 100)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Expira em</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {expirationLabel}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Confirmado em</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {paidAtLabel ?? "Aguardando"}
          </p>
        </div>
      </div>
    </section>
  );
}
