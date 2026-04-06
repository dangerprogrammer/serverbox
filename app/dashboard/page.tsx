import Link from "next/link";
import { connection } from "next/server";

import { CurrencyInput } from "@/app/_components/currency-input";
import { SubmitButton } from "@/app/dashboard/_components/submit-button";
import { FloatingInput } from "@/app/_components/floating-field";
import { logoutAdmin } from "@/app/login/actions";
import {
  createPaymentAction,
  createStandalonePaymentAction,
} from "@/app/dashboard/actions";
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
  await requireAuthenticatedAdmin();
  await connection();
  const dashboard = await getAdminDashboardData();
  const hasCondominiums = dashboard.condominiums.length > 0;
  const hasPlans = dashboard.plans.length > 0;
  const canCreatePayment = hasPlans;
  const canCreateStandalonePayment = hasCondominiums;

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
                Operação financeira e saldo por condomínio.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                Acompanhe cobranças PIX, saldo liberado e o que ainda falta
                cadastrar para a operação rodar com dados reais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/gerenciar-condominios"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Gerenciar Condomínios
              </Link>
              <Link
                href="/sobre-nos"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Ir para Sobre nós
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
                    bolinhas disponíveis
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
                Preparação da operação
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
                  <span>Condomínios cadastrados</span>
                  <strong className="text-base text-slate-900">
                    {dashboard.condominiums.length}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
                  <span>Planos disponíveis</span>
                  <strong className="text-base text-slate-900">
                    {dashboard.plans.length}
                  </strong>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-white px-4 py-4 leading-7">
                  {canCreatePayment
                    ? "Já existe base suficiente para emitir cobranças PIX reais."
                    : "Cadastre ao menos um condomínio com plano para liberar a emissão de cobranças PIX."}
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
              Nova cobrança PIX
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Escolha um plano já vinculado a um condomínio. O crédito de
              bolinhas só entra no saldo depois da confirmação do pagamento.
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
                  ? "O checkout abre em seguida para copiar o código PIX ou acompanhar o QR Code."
                  : "Antes de cobrar, cadastre a base operacional em Gerenciar Condomínios."}
              </div>

              <SubmitButton
                idleLabel="Criar cobrança AbacatePay"
                pendingLabel="Criando..."
                disabled={!canCreatePayment}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>

            {!canCreatePayment ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                Sem plano vinculado a condomínio não existe cobrança real para emitir.
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Compra avulsa de bolinhas
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Use esta cobrança quando o condomínio precisar comprar bolinhas
              fora de um plano já cadastrado.
            </p>

            <form action={createStandalonePaymentAction} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Condomínio</span>
                <select
                  name="condominiumId"
                  disabled={!canCreateStandalonePayment}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  defaultValue={dashboard.condominiums[0]?.id ?? ""}
                >
                  {hasCondominiums ? (
                    dashboard.condominiums.map((condominium) => (
                      <option key={condominium.id} value={condominium.id}>
                        {condominium.name} - {condominium.city}/{condominium.state}
                      </option>
                    ))
                  ) : (
                    <option value="">Nenhum condomínio cadastrado</option>
                  )}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <FloatingInput
                  label="Quantidade de bolinhas"
                  name="ballQuantity"
                  type="number"
                  min={1}
                  defaultValue={100}
                  placeholder="Quantidade de bolinhas"
                  className="bg-white"
                />
                <CurrencyInput
                  label="Valor"
                  name="amountInCents"
                  defaultValueInCents={10000}
                  className="bg-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                {canCreateStandalonePayment
                  ? "A cobrança PIX avulsa também libera saldo só depois da confirmação do pagamento."
                  : "Cadastre ao menos um condomínio para emitir compra avulsa de bolinhas."}
              </div>

              <SubmitButton
                idleLabel="Criar compra avulsa"
                pendingLabel="Criando..."
                disabled={!canCreateStandalonePayment}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Cobranças em aberto
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Pagamentos pendentes que ainda aguardam confirmação do PIX.
            </p>
            <div className="mt-5 space-y-4">
              {dashboard.pendingPayments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  Nenhuma cobrança pendente no momento.
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
                              ? `AbacatePay ID: ${payment.providerPaymentId ?? "aguardando geração"}`
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
                Operação por condomínio
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Visão consolidada do saldo, pagamentos e planos ativos de cada
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
                          ? `Planos disponíveis: ${condominium.plans.map((plan) => plan.name).join(", ")}`
                          : "Nenhum plano vinculado a este condomínio ainda."}
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
                        Ainda não há pagamentos registrados para este condomínio.
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
                  Nenhum condomínio cadastrado ainda
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Quando os primeiros condomínios entrarem na base, esta área vai
                  mostrar saldo, histórico recente e situação de cobranças por
                  cliente.
                </p>
                <Link
                  href="/gerenciar-condominios"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-sky-700 px-5 text-sm font-semibold !text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                >
                  Cadastrar primeiro condomínio
                </Link>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
