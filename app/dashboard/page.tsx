import Link from "next/link";
import { connection } from "next/server";

import { SubmitButton } from "@/app/dashboard/_components/submit-button";
import { logoutAdmin } from "@/app/login/actions";
import { createPaymentAction } from "@/app/dashboard/actions";
import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/data/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
};

export default async function DashboardPage() {
  const administrator = await requireAuthenticatedAdmin();
  await connection();
  const dashboard = await getAdminDashboardData();
  const hasCondominiums = dashboard.condominiums.length > 0;
  const hasPlans = dashboard.plans.length > 0;
  const canCreatePayment = hasPlans;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Dashboard administrativa
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                Operacao financeira e saldo por condominio.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                Acompanhe cobrancas PIX, saldo liberado e o que ainda falta
                cadastrar para a operacao rodar com dados reais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                {administrator.name}
              </span>
              <Link
                href="/gerenciar-condominios"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Gerenciar estrutura
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Voltar para a home
              </Link>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[1.25rem] border border-border bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Panorama do momento
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Saldo total</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {dashboard.summary.totalAvailableBalls}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    bolinhas disponiveis
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Pagamentos pagos</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {dashboard.summary.paidPayments}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Pagamentos pendentes</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {dashboard.summary.pendingPayments}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Bolinhas creditadas</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {dashboard.summary.creditedBalls}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border bg-surface-strong p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Preparacao da operacao
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
                  <span>Condominios cadastrados</span>
                  <strong className="text-base text-slate-900">
                    {dashboard.condominiums.length}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
                  <span>Planos disponiveis</span>
                  <strong className="text-base text-slate-900">
                    {dashboard.plans.length}
                  </strong>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-white px-4 py-4 leading-7">
                  {canCreatePayment
                    ? "Ja existe base suficiente para emitir cobrancas PIX reais."
                    : "Cadastre ao menos um condominio com plano para liberar a emissao de cobrancas PIX."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Nova cobranca PIX
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Escolha um plano ja vinculado a um condominio. O credito de
              bolinhas so entra no saldo depois da confirmacao do pagamento.
            </p>

            <form action={createPaymentAction} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Plano</span>
                <select
                  name="planId"
                  disabled={!hasPlans}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  defaultValue={dashboard.plans[0]?.id ?? ""}
                >
                  {hasPlans ? (
                    dashboard.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.condominiumName} - {plan.name} -{" "}
                        {plan.monthlyBallAllowance} bolinhas -{" "}
                        {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
                      </option>
                    ))
                  ) : (
                    <option value="">Nenhum plano cadastrado</option>
                  )}
                </select>
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                {canCreatePayment
                  ? "O checkout abre em seguida para copiar o codigo PIX ou acompanhar o QR Code."
                  : "Antes de cobrar, cadastre a base operacional em Gerenciar estrutura."}
              </div>

              <SubmitButton
                idleLabel="Criar cobranca AbacatePay"
                pendingLabel="Criando..."
                disabled={!canCreatePayment}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>

            {!canCreatePayment ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                Sem plano vinculado a condominio nao existe cobranca real para emitir.
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Cobrancas em aberto
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Pagamentos pendentes que ainda aguardam confirmacao do PIX.
            </p>
            <div className="mt-5 space-y-4">
              {dashboard.pendingPayments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  Nenhuma cobranca pendente no momento.
                </div>
              ) : (
                dashboard.pendingPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[1.25rem] border border-border bg-slate-50 p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-slate-900">
                            {payment.condominiumName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {payment.planName} -{" "}
                            {currencyFormatter.format(payment.amountInCents / 100)}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {payment.provider === "abacatepay"
                              ? `AbacatePay ID: ${payment.providerPaymentId ?? "aguardando geracao"}`
                              : `Referencia: ${payment.reference}`}
                          </p>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                          {paymentMethodLabels[payment.method] ?? payment.method}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                          +{payment.ballQuantity} bolinhas
                        </div>
                        <Link
                          href={`/pagamentos/${payment.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Abrir checkout PIX
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Operacao por condominio
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Visao consolidada do saldo, pagamentos e planos ativos de cada
                cliente cadastrado.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {hasCondominiums ? (
              dashboard.condominiums.map((condominium) => (
                <article
                  key={condominium.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5"
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
                        {condominium.plans.length > 0
                          ? `Planos disponiveis: ${condominium.plans.map((plan) => plan.name).join(", ")}`
                          : "Nenhum plano vinculado a este condominio ainda."}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Saldo
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {condominium.availableBalls}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Pagos
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {condominium.paidPayments}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3">
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
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm leading-7 text-slate-500 md:col-span-3">
                        Ainda nao ha pagamentos registrados para este condominio.
                      </div>
                    ) : (
                      condominium.recentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-4"
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
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-700">
                            {payment.status}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8">
                <h3 className="text-lg font-semibold text-slate-900">
                  Nenhum condominio cadastrado ainda
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Quando os primeiros condominios entrarem na base, esta area vai
                  mostrar saldo, historico recente e situacao de cobrancas por
                  cliente.
                </p>
                <Link
                  href="/gerenciar-condominios"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Cadastrar primeiro condominio
                </Link>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
