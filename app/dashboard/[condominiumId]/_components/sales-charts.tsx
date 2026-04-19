"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SalesChartPayment = {
  id: string;
  status: string;
  planName: string;
  amountInCents: number;
  ballQuantity: number;
  createdAt: string;
};

type SalesChartsProps = {
  payments: SalesChartPayment[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
});

type SalesPeriod = "30d" | "90d" | "12m" | "all";

const periodOptions: Array<{ value: SalesPeriod; label: string }> = [
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" },
  { value: "all", label: "Tudo" },
];

const statusPalette: Record<string, { label: string; color: string }> = {
  paid: { label: "Pago", color: "#059669" },
  pending: { label: "Pendente", color: "#d97706" },
  expired: { label: "Expirado", color: "#64748b" },
  failed: { label: "Falhou", color: "#e11d48" },
  refunded: { label: "Estornado", color: "#0284c7" },
};

function getCutoffDate(period: SalesPeriod) {
  const now = new Date();

  if (period === "all") {
    return null;
  }

  const cutoff = new Date(now);

  if (period === "30d") {
    cutoff.setDate(cutoff.getDate() - 30);
    return cutoff;
  }

  if (period === "90d") {
    cutoff.setDate(cutoff.getDate() - 90);
    return cutoff;
  }

  cutoff.setMonth(cutoff.getMonth() - 12);
  return cutoff;
}

export function SalesCharts({ payments }: SalesChartsProps) {
  const [period, setPeriod] = useState<SalesPeriod>("90d");
  const [selectedPlan, setSelectedPlan] = useState("all");

  const availablePlans = useMemo(
    () => Array.from(new Set(payments.map((payment) => payment.planName))).sort(),
    [payments],
  );

  const filteredPayments = useMemo(() => {
    const cutoff = getCutoffDate(period);

    return payments.filter((payment) => {
      const createdAt = new Date(payment.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      if (selectedPlan !== "all" && payment.planName !== selectedPlan) {
        return false;
      }

      if (cutoff && createdAt < cutoff) {
        return false;
      }

      return true;
    });
  }, [payments, period, selectedPlan]);

  const monthlySalesData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        key: string;
        label: string;
        confirmedRevenueInCents: number;
        pendingRevenueInCents: number;
        confirmedBalls: number;
        pendingBalls: number;
      }
    >();

    for (const payment of filteredPayments) {
      const createdAt = new Date(payment.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        continue;
      }

      const monthKey = `${createdAt.getUTCFullYear()}-${String(createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
      const monthStart = new Date(Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), 1));
      const existing = monthMap.get(monthKey) ?? {
        key: monthKey,
        label: monthFormatter.format(monthStart),
        confirmedRevenueInCents: 0,
        pendingRevenueInCents: 0,
        confirmedBalls: 0,
        pendingBalls: 0,
      };

      if (payment.status === "paid") {
        existing.confirmedRevenueInCents += payment.amountInCents;
        existing.confirmedBalls += payment.ballQuantity;
      }

      if (payment.status === "pending") {
        existing.pendingRevenueInCents += payment.amountInCents;
        existing.pendingBalls += payment.ballQuantity;
      }

      monthMap.set(monthKey, existing);
    }

    return Array.from(monthMap.values())
      .sort((left, right) => left.key.localeCompare(right.key))
      .slice(-12)
      .map((month) => ({
        ...month,
        confirmedRevenue: month.confirmedRevenueInCents / 100,
        pendingRevenue: month.pendingRevenueInCents / 100,
      }));
  }, [filteredPayments]);

  const statusDistributionData = useMemo(() => {
    const statusCount = new Map<string, number>();

    for (const payment of filteredPayments) {
      statusCount.set(payment.status, (statusCount.get(payment.status) ?? 0) + 1);
    }

    return Array.from(statusCount.entries())
      .map(([status, total]) => {
        const palette = statusPalette[status] ?? {
          label: status,
          color: "#475569",
        };

        return {
          status,
          label: palette.label,
          value: total,
          color: palette.color,
        };
      })
      .sort((left, right) => right.value - left.value);
  }, [filteredPayments]);

  const planPerformanceData = useMemo(() => {
    const planMap = new Map<
      string,
      {
        planName: string;
        confirmedRevenueInCents: number;
        confirmedBalls: number;
        pendingBalls: number;
      }
    >();

    for (const payment of filteredPayments) {
      const existing = planMap.get(payment.planName) ?? {
        planName: payment.planName,
        confirmedRevenueInCents: 0,
        confirmedBalls: 0,
        pendingBalls: 0,
      };

      if (payment.status === "paid") {
        existing.confirmedRevenueInCents += payment.amountInCents;
        existing.confirmedBalls += payment.ballQuantity;
      }

      if (payment.status === "pending") {
        existing.pendingBalls += payment.ballQuantity;
      }

      planMap.set(payment.planName, existing);
    }

    return Array.from(planMap.values())
      .map((plan) => ({
        ...plan,
        confirmedRevenue: plan.confirmedRevenueInCents / 100,
      }))
      .sort((left, right) => right.confirmedRevenue - left.confirmedRevenue)
      .slice(0, 8);
  }, [filteredPayments]);

  const totalConfirmedRevenue = useMemo(
    () =>
      filteredPayments
        .filter((payment) => payment.status === "paid")
        .reduce((total, payment) => total + payment.amountInCents, 0),
    [filteredPayments],
  );

  const totalPendingPayments = useMemo(
    () => filteredPayments.filter((payment) => payment.status === "pending").length,
    [filteredPayments],
  );

  if (payments.length === 0) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Painel analitico de vendas</h2>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
          Ainda nao ha dados suficientes para exibir graficos de vendas.
        </div>
      </section>
    );
  }

  if (filteredPayments.length === 0) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Painel analitico de vendas</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {periodOptions.map((option) => {
            const isActive = period === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {option.label}
              </button>
            );
          })}
          <select
            value={selectedPlan}
            onChange={(event) => setSelectedPlan(event.target.value)}
            className="h-9 cursor-pointer rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
          >
            <option value="all">Todos os planos</option>
            {availablePlans.map((planName) => (
              <option key={planName} value={planName}>
                {planName}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
          Nao ha vendas para os filtros selecionados. Ajuste o periodo ou selecione outro plano.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Painel analitico de vendas</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Evolucao mensal de receita e tubos, com distribuicao dos status das cobrancas.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {periodOptions.map((option) => {
          const isActive = period === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {option.label}
            </button>
          );
        })}

        <select
          value={selectedPlan}
          onChange={(event) => setSelectedPlan(event.target.value)}
          className="h-9 cursor-pointer rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
        >
          <option value="all">Todos os planos</option>
          {availablePlans.map((planName) => (
            <option key={planName} value={planName}>
              {planName}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Receita confirmada (filtro)</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {currencyFormatter.format(totalConfirmedRevenue / 100)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Cobrancas pendentes (filtro)</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{totalPendingPayments}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Receita mensal</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
            Confirmada x pendente
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData} margin={{ top: 8, right: 12, left: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="confirmedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} width={72} />
                <Tooltip
                  formatter={(value, name) => [
                    currencyFormatter.format(Number(value ?? 0)),
                    name === "confirmedRevenue" ? "Confirmada" : "Pendente",
                  ]}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="confirmedRevenue"
                  name="confirmedRevenue"
                  stroke="#059669"
                  fill="url(#confirmedGradient)"
                  strokeWidth={2.2}
                />
                <Area
                  type="monotone"
                  dataKey="pendingRevenue"
                  name="pendingRevenue"
                  stroke="#d97706"
                  fill="url(#pendingGradient)"
                  strokeWidth={2.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Tubos por mes</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
            Entrada confirmada x aguardando pagamento
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} width={46} />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value ?? 0)} tubos`,
                    name === "confirmedBalls" ? "Confirmadas" : "Pendentes",
                  ]}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Bar dataKey="confirmedBalls" name="confirmedBalls" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pendingBalls" name="pendingBalls" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Receita confirmada por plano</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
            Drill-down dos planos com maior faturamento
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planPerformanceData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="planName" tick={{ fill: "#64748b", fontSize: 12 }} interval={0} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} width={72} />
                <Tooltip
                  formatter={(value) => currencyFormatter.format(Number(value ?? 0))}
                  labelFormatter={(label) => `Plano: ${label}`}
                />
                <Bar dataKey="confirmedRevenue" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Distribuicao de status</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
            Situacao atual das cobrancas emitidas
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {statusDistributionData.map((status) => (
                      <Cell key={status.status} fill={status.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value ?? 0)} cobranca(s)`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid content-start gap-2">
              {statusDistributionData.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-700">{status.label}</span>
                  </div>
                  <strong className="text-sm text-slate-900">{status.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
