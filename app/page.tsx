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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-8 sm:px-10 lg:px-12">
      <section className="card-grid relative overflow-hidden rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[0_30px_90px_rgba(166,61,20,0.12)] sm:px-8 lg:px-12 lg:py-12">
        <div className="absolute right-0 top-0 h-44 w-44 translate-x-10 -translate-y-10 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-8 translate-y-8 rounded-full bg-[#0f766e]/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-accent/20 bg-accent-soft px-4 py-2 text-sm font-medium text-accent-strong">
              ServerBox • assinatura de bolinhas por condominio
            </div>
            <div className="max-w-3xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Venda recorrente de bolinhas de tenis para condominios sem
                planilha improvisada.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                A base do projeto ja nasce com Next.js 16 no App Router,
                TypeORM no servidor e um modelo em que cada condominio recebe
                os planos padrao e pode ganhar planos personalizados.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-white/85 p-5 backdrop-blur">
                <p className="text-sm text-slate-500">Condominios ativos</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {dashboard.summary.activeCondominiums}
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-white/85 p-5 backdrop-blur">
                <p className="text-sm text-slate-500">Planos cadastrados</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {dashboard.summary.totalPlans}
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-white/85 p-5 backdrop-blur">
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
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                {administrator ? "Abrir dashboard de pagamentos" : "Entrar como admin"}
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

          <div className="rounded-[1.75rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-2xl">
            <p className="text-sm uppercase tracking-[0.22em] text-orange-200/70">
              Operacao inicial
            </p>
            <div className="mt-8 space-y-5">
              {dashboard.condominiums.map((condominium) => (
                <div
                  key={condominium.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-medium">
                        {condominium.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-300">
                        {condominium.city}, {condominium.state} •{" "}
                        {condominium.courts} quadras
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                      {condominium.availablePlanCount} planos
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between text-sm text-slate-300">
                    <span>
                      {condominium.availableBalls} bolinhas • {condominium.paidPayments} pagamentos pagos
                    </span>
                    <strong className="text-base text-white">
                      {condominium.administratorName}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-[1.75rem] border border-border bg-surface-strong p-7">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-strong/80">
            Como pensamos o dominio
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Planos prontos para assinatura, renovacao e historico.
          </h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
            <p>
              Cada condominio passa a ter um catalogo proprio de planos
              disponiveis. Isso permite ofertar os 3 planos padrao e somar
              opcoes personalizadas sem duplicar cadastro de condominio.
            </p>
            <p>
              Agora o fluxo de pagamento gera um checkout PIX com QR Code e
              copia e cola. O acesso so deve ser liberado depois da confirmacao
              real do pagamento no backend.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {dashboard.plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  {plan.tierLabel}
                </span>
                <span className="text-sm text-slate-500">
                  {plan.condominiumCount} condominios
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {plan.description}
              </p>
              <p className="mt-6 text-3xl font-semibold tracking-tight text-accent-strong">
                {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
              </p>
              <p className="mt-1 text-sm text-slate-500">por mes</p>
              <p className="mt-2 text-sm text-slate-500">
                {plan.isDefault
                  ? "Plano padrao"
                  : `Criado por ${plan.createdByName}`}
              </p>
              <dl className="mt-6 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <dt>Bolinhas inclusas</dt>
                  <dd className="font-semibold">
                    {plan.monthlyBallAllowance}/mes
                  </dd>
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
