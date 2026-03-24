import Link from "next/link";

import { SubmitButton } from "@/app/dashboard/_components/submit-button";
import { createPaymentAction } from "@/app/dashboard/actions";
import { getAdminDashboardData } from "@/lib/data/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
};

export default async function DashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-strong/80">
              Dashboard administrativa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              PIX confirmado vira saldo real de bolinhas.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Cada cobranca nasce com um TXID unico. O credito so e liberado
              depois que a transacao PIX e validada, evitando confirmar
              pagamentos sem evidencia.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Voltar para a home
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-border bg-white/85 p-5">
            <p className="text-sm text-slate-500">Saldo total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {dashboard.summary.totalAvailableBalls}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              bolinhas disponiveis
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white/85 p-5">
            <p className="text-sm text-slate-500">Pagamentos pagos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {dashboard.summary.paidPayments}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white/85 p-5">
            <p className="text-sm text-slate-500">Pagamentos pendentes</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {dashboard.summary.pendingPayments}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white/85 p-5">
            <p className="text-sm text-slate-500">Bolinhas creditadas</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {dashboard.summary.creditedBalls}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">
              Registrar cobranca PIX
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Cria uma cobranca PIX pendente para um condominio. Depois, o
              sistema so liquida o pagamento quando o TXID recebido bater com a
              cobranca esperada.
            </p>

            <form action={createPaymentAction} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Condominio
                </span>
                <select
                  name="condominiumId"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  defaultValue={dashboard.condominiums[0]?.id ?? ""}
                >
                  {dashboard.condominiums.map((condominium) => (
                    <option key={condominium.id} value={condominium.id}>
                      {condominium.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Plano</span>
                <select
                  name="planId"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  defaultValue={dashboard.plans[0]?.id ?? ""}
                >
                  {dashboard.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.monthlyBallAllowance} bolinhas -{" "}
                      {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Pagamento exclusivo via PIX com TXID unico e validacao antes da
                liberacao do saldo.
              </div>

              <SubmitButton
                idleLabel="Criar cobranca PIX"
                pendingLabel="Criando..."
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-slate-950 p-6 text-white shadow-2xl">
            <h2 className="text-2xl font-semibold">Cobrancas PIX em aberto</h2>
            <div className="mt-5 space-y-4">
              {dashboard.pendingPayments.length === 0 ? (
                <p className="text-sm text-slate-300">
                  Nenhum pagamento pendente no momento.
                </p>
              ) : (
                dashboard.pendingPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-medium">
                            {payment.condominiumName}
                          </p>
                          <p className="text-sm text-slate-300">
                            {payment.planName} -{" "}
                            {currencyFormatter.format(payment.amountInCents / 100)}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                            TXID esperado: {payment.pixTransactionId ?? "aguardando geracao"}
                          </p>
                        </div>
                        <span className="rounded-full bg-orange-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                          {paymentMethodLabels[payment.method] ?? payment.method}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-slate-300">
                          +{payment.ballQuantity} bolinhas
                        </div>
                        <Link
                          href={`/pagamentos/${payment.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-orange-100"
                        >
                          Abrir cobranca PIX
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Saldo por condominio
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                O administrador passa a enxergar o saldo de bolinhas baseado nos
                pagamentos efetivamente liquidados.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {dashboard.condominiums.map((condominium) => (
              <article
                key={condominium.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {condominium.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {condominium.city}, {condominium.state} -{" "}
                      {condominium.administratorName}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Planos disponiveis:{" "}
                      {condominium.plans.map((plan) => plan.name).join(", ")}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Saldo
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {condominium.availableBalls}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Pagos
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {condominium.paidPayments}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Pendentes
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {condominium.pendingPayments}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {condominium.recentPayments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Ainda nao ha pagamentos para esse condominio.
                    </p>
                  ) : (
                    condominium.recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {payment.reference}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {payment.planName}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">
                          {currencyFormatter.format(payment.amountInCents / 100)} -{" "}
                          {payment.ballQuantity} bolinhas
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-accent-strong">
                          {payment.status}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
