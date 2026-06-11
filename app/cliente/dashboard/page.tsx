import { notFound, redirect } from "next/navigation";

import { SalesCharts } from "@/app/dashboard/[condominiumId]/_components/sales-charts";
import { logoutCondominiumClientAction } from "@/app/cliente/actions";
import { getAuthenticatedCondominiumClientFromCookies } from "@/lib/auth/client-session";
import { getAdminCondominiumDetails } from "@/lib/data/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export const dynamic = "force-dynamic";

export default async function ClienteDashboardPage() {
  const client = await getAuthenticatedCondominiumClientFromCookies();

  if (!client) {
    redirect("/cliente/login");
  }

  const condominium = await getAdminCondominiumDetails(client.condominiumId);

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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

          <form action={logoutCondominiumClientAction}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Sair
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.25rem] border border-border bg-white p-5">
            <p className="text-sm text-slate-500">Estoque livre</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {condominium.availableBalls}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-white p-5">
            <p className="text-sm text-slate-500">Tubos vendidos</p>
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
            <p className="text-sm text-slate-500">Estoque total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {condominium.ballQuantity}
            </p>
          </div>
        </div>

        {condominium.tubeStockByBrand.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {condominium.tubeStockByBrand.map((entry) => (
              <span
                key={entry.tubeBrandId}
                className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {entry.tubeBrandName}: {entry.quantity} tubos
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <SalesCharts payments={chartPayments} />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Quadras</h2>
            <div className="mt-5 space-y-3">
              {condominium.courtDetails.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  Nenhuma quadra detalhada para este condomínio.
                </div>
              ) : (
                condominium.courtDetails.map((court) => (
                  <article
                    key={court.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-base font-semibold text-slate-900">
                      {court.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Marcas de tubos:{" "}
                      {court.tubeBrandNames?.length
                        ? court.tubeBrandNames.join(", ")
                        : court.tubeBrandName}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Planos ativos
            </h2>
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
                    <p className="text-base font-semibold text-slate-900">
                      {plan.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {plan.monthlyBallAllowance} tubos/mês -{" "}
                      {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Histórico de vendas
          </h2>

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
                      <p className="text-sm font-semibold text-slate-900">
                        {payment.reference}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {payment.planName}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {currencyFormatter.format(payment.amountInCents / 100)} -{" "}
                        {payment.ballQuantity} tubos
                        {payment.tubeBrandName ? ` - ${payment.tubeBrandName}` : ""}
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
