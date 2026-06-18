import Link from "next/link";

import { getAdminDashboardData } from "@/lib/data/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
};

function getProviderLabel(provider: string | null) {
  switch (provider) {
    case "abacatepay":
      return "AbacatePay";
    case "santander":
      return "Santander";
    case "infinitepay":
      return "InfinitePay";
    default:
      return "Gateway";
  }
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getAdminDashboardData();
  const stockReadyCondominiums = dashboard.condominiums.filter(
    (condominium) => condominium.remainingBallStock > 0,
  );
  const hasCondominiums = dashboard.condominiums.length > 0;
  const hasStockReadyCondominiums = stockReadyCondominiums.length > 0;

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
              quando o condomínio tiver estoque real configurado.
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
                    mais tubos vendidos
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border bg-white p-5">
                  <p className="text-sm text-slate-500">Tubos vendidos</p>
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
                    {stockReadyCondominiums.length}
                  </strong>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-white px-4 py-4 leading-7">
                  {!hasStockReadyCondominiums
                    ? "Atualize o estoque real dos condomínios para liberar novas cobranças."
                    : "Compras avulsas e planos mensais/anuais prontos para operar nas dashboards dos condomínios."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Cobranças em aberto
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Pagamentos pendentes que ainda aguardam confirmação do gateway.
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
                            {payment.provider
                              ? `${getProviderLabel(payment.provider)} ID: ${payment.providerPaymentId ?? "aguardando geração"}`
                              : `Referencia: ${payment.reference}`}
                          </p>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                          {payment.provider === "infinitepay"
                            ? "Checkout"
                            : paymentMethodLabels[payment.method] ?? payment.method}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-600">
                          +{payment.ballQuantity} tubos
                          {payment.tubeBrandName
                            ? ` - ${payment.tubeBrandName}`
                            : ""}
                        </div>
                        <Link
                          href={`/pagamentos/${payment.id}`}
                          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
                        >
                          Abrir checkout
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
                        href={`/condominio/${condominium.id}`}
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
                        Estoque total informado: {condominium.ballQuantity} tubos
                      </p>
                      {condominium.tubeStockByBrand.length > 0 ? (
                        <p className="mt-1 text-sm text-slate-600">
                          Estoque por marca:{" "}
                          {condominium.tubeStockByBrand
                            .map(
                              (entry) => `${entry.tubeBrandName} (${entry.quantity})`,
                            )
                            .join(", ")}
                        </p>
                      ) : null}
                      {condominium.courtDetails.length > 0 ? (
                        <p className="mt-1 text-sm text-slate-600">
                          Quadras:{" "}
                          {condominium.courtDetails
                            .map((court) => {
                              const brandNames = court.tubeBrandNames?.length
                                ? court.tubeBrandNames.join(", ")
                                : court.tubeBrandName;

                              return `${court.name} (${brandNames})`;
                            })
                            .join(", ")}
                        </p>
                      ) : null}
                      <Link
                        href={`/condominio/${condominium.id}`}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                      >
                        Ver detalhes do condomínio
                      </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Estoque livre
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {condominium.availableBalls}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Tubos vendidos
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
                            {payment.tubeBrandName
                              ? ` - ${payment.tubeBrandName}`
                              : ""}
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

