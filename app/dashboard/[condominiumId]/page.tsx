import { notFound } from "next/navigation";
import { connection } from "next/server";

import { SalesCharts } from "@/app/dashboard/[condominiumId]/_components/sales-charts";
import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { getAdminCondominiumDetails } from "@/lib/data/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CondominiumDashboardPage({
  params,
}: {
  params: Promise<{ condominiumId: string }>;
}) {
  await requireAuthenticatedAdmin();
  await connection();

  const { condominiumId } = await params;
  const condominium = await getAdminCondominiumDetails(condominiumId);

  if (!condominium) {
    notFound();
  }

  const chartPayments = condominium.payments.map((payment) => ({
    id: payment.id,
    status: payment.status,
    planName: payment.planName,
    amountInCents: payment.amountInCents,
    ballQuantity: payment.ballQuantity,
    createdAt: payment.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-4 py-6 shadow-sm sm:px-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            Dashboard do condomínio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {condominium.name}
          </h1>
          <p className="text-sm leading-7 text-slate-600">
            {condominium.city}, {condominium.state}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.25rem] border border-border bg-white p-5">
            <p className="text-sm text-slate-500">Tubos restantes</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {condominium.availableBalls}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white p-5">
            <p className="text-sm text-slate-500">Tubos confirmados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {condominium.paidBalls}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white p-5">
            <p className="text-sm text-slate-500">Faturamento confirmado</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {currencyFormatter.format(condominium.paidRevenueInCents / 100)}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white p-5">
            <p className="text-sm text-slate-500">Base configurada</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {condominium.ballQuantity}
            </p>
          </div>
        </div>
      </section>

      <SalesCharts payments={chartPayments} />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Planos ativos</h2>
          <div className="mt-5 space-y-3">
            {condominium.plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                Nenhum plano cadastrado para este condomínio.
              </div>
            ) : (
              condominium.plans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-base font-semibold text-slate-900">{plan.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {plan.monthlyBallAllowance} tubos/mês - {currencyFormatter.format(
                      plan.monthlyPriceInCents / 100,
                    )}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Histórico de vendas</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Últimas transações do condomínio, com status e quantidade de tubos.
          </p>

          <div className="mt-5 space-y-3">
            {condominium.payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                Ainda não há vendas registradas para este condomínio.
              </div>
            ) : (
              condominium.payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{payment.reference}</p>
                      <p className="mt-1 text-sm text-slate-600">{payment.planName}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {currencyFormatter.format(payment.amountInCents / 100)} - {payment.ballQuantity} tubos
                      </p>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.18em] text-slate-500">
                      <p>{payment.status}</p>
                      <p className="mt-2 normal-case tracking-normal text-slate-600">
                        {dateFormatter.format(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
