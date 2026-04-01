import Link from "next/link";
import { connection } from "next/server";

import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function Home() {
  await connection();
  const administrator = await getAuthenticatedAdmin();
  const dashboard = await getDashboardData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8 lg:px-12 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-border bg-surface-strong px-4 py-2 text-sm font-medium text-slate-700">
              ServerBox
            </div>
            <div className="max-w-3xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Venda recorrente de bolinhas de tenis para condominios.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Uma base administrativa simples para organizar condominios,
                planos proprios por cliente e cobrancas PIX sem planilhas ou
                controles paralelos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border bg-white p-5">
                <p className="text-sm text-slate-500">Condominios ativos</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {dashboard.summary.activeCondominiums}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border bg-white p-5">
                <p className="text-sm text-slate-500">Planos cadastrados</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {dashboard.summary.totalPlans}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border bg-white p-5">
                <p className="text-sm text-slate-500">Saldo total</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {dashboard.summary.availableBalls}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  bolinhas disponiveis
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <Link
                href={administrator ? "/dashboard" : "/login"}
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {administrator ? "Abrir dashboard" : "Entrar como admin"}
              </Link>
              {administrator ? (
                <Link
                  href="/gerenciar-condominios"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                >
                  Gerenciar condominios
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-surface-strong p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Operacao
            </p>
            <div className="mt-6 space-y-4">
              {dashboard.condominiums.length === 0 ? (
                <div className="rounded-[1.25rem] border border-border bg-white p-4 text-sm text-slate-600">
                  Nenhum condominio cadastrado ainda.
                </div>
              ) : (
                dashboard.condominiums.map((condominium) => (
                  <article
                    key={condominium.id}
                    className="rounded-[1.25rem] border border-border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-medium text-slate-900">
                          {condominium.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {condominium.city}, {condominium.state} •{" "}
                          {condominium.courts} quadras
                        </p>
                      </div>
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        {condominium.availablePlanCount} planos
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3 text-sm text-slate-600">
                      <span>
                        {condominium.availableBalls} bolinhas •{" "}
                        {condominium.paidPayments} pagamentos pagos
                      </span>
                      <strong className="text-base text-slate-900">
                        {condominium.administratorName}
                      </strong>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-[1.5rem] border border-border bg-white p-7 shadow-sm">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Estrutura
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Cada condominio concentra seus proprios planos.
          </h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
            <p>
              O modelo atual remove a ideia de catalogo global. Cada plano
              pertence a um condominio especifico e acompanha a realidade da
              operacao daquele cliente.
            </p>
            <p>
              O pagamento gera um checkout PIX e o saldo de bolinhas so muda
              depois da confirmacao real do gateway.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {plan.tierLabel}
                </span>
                <span className="text-sm text-slate-500">{plan.condominiumName}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {plan.description}
              </p>
              <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
                {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
              </p>
              <p className="mt-1 text-sm text-slate-500">por mes</p>
              <dl className="mt-6 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <dt>Bolinhas inclusas</dt>
                  <dd className="font-semibold">{plan.monthlyBallAllowance}/mes</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <dt>Reposicao extra</dt>
                  <dd className="font-semibold">
                    {currencyFormatter.format(plan.overagePriceInCents / 100)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
