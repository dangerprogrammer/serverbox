import Link from "next/link";
import { connection } from "next/server";

import { CurrencyInput } from "@/app/_components/currency-input";
import { SubmitButton } from "@/app/dashboard/_components/submit-button";
import { FloatingInput } from "@/app/_components/floating-field";
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
  const eligibleCondominiums = dashboard.condominiums.filter(
    (condominium) => condominium.ballQuantity > 0,
  );
  const eligibleCondominiumIds = new Set(
    eligibleCondominiums.map((condominium) => condominium.id),
  );
  const eligiblePlans = dashboard.plans.filter((plan) =>
    eligibleCondominiumIds.has(plan.condominiumId),
  );
  const hasCondominiums = dashboard.condominiums.length > 0;
  const hasEligibleCondominiums = eligibleCondominiums.length > 0;
  const canCreateStandalonePayment = hasEligibleCondominiums;
  const canCreatePayment = eligiblePlans.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-4 py-6 shadow-sm sm:px-8">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Dashboard administrativa
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Operação financeira e saldo por condomínio.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Priorize compras avulsas e mantenha planos mensais/anuais ativos
              quando o condomínio tiver base de tubos configurada.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[1.25rem] border border-border bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Indicadores de venda
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Faturamento confirmado</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {currencyFormatter.format(
                      dashboard.summary.totalRevenueInCents / 100,
                    )}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    vendas já pagas
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Condomínio líder</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {dashboard.summary.topCondominiumBySales?.name ?? "—"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    mais tubos vendidas
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Tubos vendidas</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {dashboard.summary.confirmedBalls}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    compras confirmadas
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
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
                  <span>Condomínios habilitados</span>
                  <strong className="text-base text-slate-900">
                    {eligibleCondominiums.length}
                  </strong>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-white px-4 py-4 leading-7">
                  {!hasEligibleCondominiums
                    ? "Defina a quantidade de tubos dos condomínios para liberar compras avulsas e planos."
                    : canCreatePayment
                      ? "Compras avulsas liberadas e planos mensais/anuais prontos para operar."
                      : "Compras avulsas já liberadas. Cadastre planos para ativar cobrança mensal/anual."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="flex flex-col gap-6">
          <section className="order-2 rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Novo plano mensal/anual
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Escolha um plano já vinculado a um condomínio. O crédito de
              tubos só entra no saldo depois da confirmação do pagamento.
            </p>

            <form action={createPaymentAction} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Plano</span>
                <select
                  name="planId"
                  disabled={!canCreatePayment}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  defaultValue={eligiblePlans[0]?.id ?? ""}
                >
                  {canCreatePayment ? (
                    eligiblePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.condominiumName} - {plan.name} -{" "}
                        {plan.monthlyBallAllowance} tubos -{" "}
                        {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
                      </option>
                    ))
                  ) : (
                    <option value="">Sem planos habilitados para cobrança</option>
                  )}
                </select>
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                {canCreatePayment
                  ? "O checkout abre em seguida para copiar o código PIX ou acompanhar o QR Code."
                  : "Defina quantidade de tubos e cadastre ao menos um plano para liberar cobrança mensal/anual."}
              </div>

              <SubmitButton
                idleLabel="Criar plano mensal/anual"
                pendingLabel="Criando..."
                disabled={!canCreatePayment}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>

            {!canCreatePayment ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                Sem base de tubos e plano vinculado não existe cobrança mensal/anual para emitir.
              </div>
            ) : null}
          </section>

          <section className="order-1 rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Compra avulsa de tubos
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Use esta cobrança quando o condomínio precisar comprar tubos
              fora de um plano já cadastrado.
            </p>

            <form action={createStandalonePaymentAction} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Condomínio</span>
                <select
                  name="condominiumId"
                  disabled={!canCreateStandalonePayment}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  defaultValue={eligibleCondominiums[0]?.id ?? ""}
                >
                  {canCreateStandalonePayment ? (
                    eligibleCondominiums.map((condominium) => (
                      <option key={condominium.id} value={condominium.id}>
                        {condominium.name} - {condominium.city}/{condominium.state}
                      </option>
                    ))
                  ) : (
                    <option value="">Nenhum condomínio habilitado</option>
                  )}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <FloatingInput
                  label="Quantidade de tubos"
                  name="ballQuantity"
                  type="number"
                  min={1}
                  defaultValue={100}
                  placeholder="Quantidade de tubos"
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
                  ? "A compra avulsa do plano mensal/anual também libera saldo só depois da confirmação do pagamento."
                  : "Defina quantidade de tubos no condomínio para habilitar compra avulsa."}
              </div>

              <SubmitButton
                idleLabel="Criar compra avulsa"
                pendingLabel="Criando..."
                disabled={!canCreateStandalonePayment}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-600">
                          +{payment.ballQuantity} tubos
                        </div>
                        <Link
                          href={`/pagamentos/${payment.id}`}
                          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
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
                      <Link
                        href={`/dashboard/${condominium.id}`}
                        className="text-xl font-semibold text-slate-900 transition hover:text-slate-700"
                      >
                        {condominium.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {condominium.city}, {condominium.state} -{" "}
                        {condominium.administratorName}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {condominium.plans.length > 0
                          ? `Planos disponíveis: ${condominium.plans.map((plan) => plan.name).join(", ")}`
                          : "Nenhum plano vinculado a este condomínio ainda."}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Base configurada: {condominium.ballQuantity} tubos
                      </p>
                      <Link
                        href={`/dashboard/${condominium.id}`}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                      >
                        Ver detalhes do condomínio
                      </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Tubos restantes
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {condominium.availableBalls}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Tubos confirmadas
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {condominium.paidBalls}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Tubos pendentes
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {condominium.pendingBalls}
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
                            {payment.ballQuantity} tubos
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
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold !text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 sm:w-auto"
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

