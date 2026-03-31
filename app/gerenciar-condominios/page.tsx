import Link from "next/link";

import { logoutAdmin } from "@/app/login/actions";
import {
  createCondominiumAction,
  createPlanAction,
  deleteCondominiumAction,
  deletePlanAction,
  updateCondominiumAction,
  updatePlanAction,
} from "@/app/gerenciar-condominios/actions";
import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { getCondominiumManagementData } from "@/lib/data/admin-management";
import { PlanTier } from "@/lib/db/entities/plan.entity";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const tierLabels: Record<string, string> = {
  [PlanTier.BASIC]: "Basico",
  [PlanTier.INTERMEDIATE]: "Intermediario",
  [PlanTier.PREMIUM]: "Premium",
  [PlanTier.CUSTOM]: "Customizado",
};

export default async function GerenciarCondominiosPage() {
  const administrator = await requireAuthenticatedAdmin();
  const { condominiums, plans } = await getCondominiumManagementData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-strong/80">
              Gestao administrativa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Criar, editar e excluir condominios e seus planos.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Painel central para manter a estrutura comercial do site: catalogo
              de planos, condominios ativos e quais planos ficam disponiveis em
              cada operacao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
              {administrator.name}
            </span>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Abrir dashboard
            </Link>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">
              Novo condominio
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              O condominio nasce ja vinculado ao admin autenticado.
            </p>

            <form action={createCondominiumAction} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="name"
                  placeholder="Nome do condominio"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
                <input
                  name="city"
                  placeholder="Cidade"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
                <input
                  name="state"
                  placeholder="UF"
                  maxLength={2}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none"
                />
                <input
                  name="courts"
                  type="number"
                  min={1}
                  defaultValue={1}
                  placeholder="Quadras"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
              <input
                name="activeResidents"
                type="number"
                min={0}
                defaultValue={0}
                placeholder="Moradores ativos"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Planos disponiveis nesse condominio
                </p>
                <div className="mt-3 grid gap-2">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <input type="checkbox" name="planIds" value={plan.id} />
                      <span>
                        {plan.name} •{" "}
                        {currencyFormatter.format(plan.monthlyPriceInCents / 100)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Criar condominio
              </button>
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">Novo plano</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Planos criados aqui podem ser padrao ou customizados e depois ser
              vinculados aos condominios.
            </p>

            <form action={createPlanAction} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="name"
                  placeholder="Nome do plano"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
                <input
                  name="slug"
                  placeholder="slug-do-plano"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
                <select
                  name="tier"
                  defaultValue={PlanTier.CUSTOM}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  {Object.values(PlanTier).map((tier) => (
                    <option key={tier} value={tier}>
                      {tierLabels[tier]}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input name="isDefault" type="checkbox" />
                  Plano padrao
                </label>
                <input
                  name="monthlyBallAllowance"
                  type="number"
                  min={0}
                  placeholder="Bolinhas por mes"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
                <input
                  name="monthlyPriceInCents"
                  type="number"
                  min={0}
                  placeholder="Preco mensal em centavos"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
              <input
                name="overagePriceInCents"
                type="number"
                min={0}
                placeholder="Preco excedente em centavos"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />
              <textarea
                name="description"
                rows={4}
                placeholder="Descricao comercial do plano"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              />

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Criar plano
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">
              Condominios cadastrados
            </h2>
            <div className="mt-6 space-y-5">
              {condominiums.map((condominium) => (
                <article
                  key={condominium.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <form action={updateCondominiumAction} className="space-y-4">
                    <input type="hidden" name="condominiumId" value={condominium.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={condominium.name}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <input
                        name="city"
                        defaultValue={condominium.city}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <input
                        name="state"
                        maxLength={2}
                        defaultValue={condominium.state}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none"
                      />
                      <input
                        name="courts"
                        type="number"
                        min={1}
                        defaultValue={condominium.courts}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <input
                      name="activeResidents"
                      type="number"
                      min={0}
                      defaultValue={condominium.activeResidents}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                    <p className="text-sm text-slate-500">
                      Admin responsavel: {condominium.administratorName} •{" "}
                      {condominium.administratorEmail}
                    </p>

                    <div className="grid gap-2">
                      {plans.map((plan) => (
                        <label
                          key={`${condominium.id}-${plan.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            name="planIds"
                            value={plan.id}
                            defaultChecked={condominium.plans.some(
                              (assignedPlan) => assignedPlan.id === plan.id,
                            )}
                          />
                          <span>{plan.name}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
                      >
                        Salvar condominio
                      </button>
                    </div>
                  </form>

                  <form action={deleteCondominiumAction} className="mt-3">
                    <input type="hidden" name="condominiumId" value={condominium.id} />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Excluir condominio
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">
              Planos cadastrados
            </h2>
            <div className="mt-6 space-y-5">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <form action={updatePlanAction} className="space-y-4">
                    <input type="hidden" name="planId" value={plan.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={plan.name}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <input
                        name="slug"
                        defaultValue={plan.slug}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <select
                        name="tier"
                        defaultValue={plan.tier}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      >
                        {Object.values(PlanTier).map((tier) => (
                          <option key={tier} value={tier}>
                            {tierLabels[tier]}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <input
                          name="isDefault"
                          type="checkbox"
                          defaultChecked={plan.isDefault}
                        />
                        Plano padrao
                      </label>
                      <input
                        name="monthlyBallAllowance"
                        type="number"
                        min={0}
                        defaultValue={plan.monthlyBallAllowance}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <input
                        name="monthlyPriceInCents"
                        type="number"
                        min={0}
                        defaultValue={plan.monthlyPriceInCents}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <input
                      name="overagePriceInCents"
                      type="number"
                      min={0}
                      defaultValue={plan.overagePriceInCents}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={plan.description}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                    <p className="text-sm text-slate-500">
                      {currencyFormatter.format(plan.monthlyPriceInCents / 100)} / mes
                      • {plan.condominiumCount} condominios • criado por{" "}
                      {plan.createdByName}
                    </p>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Salvar plano
                    </button>
                  </form>

                  <form action={deletePlanAction} className="mt-3">
                    <input type="hidden" name="planId" value={plan.id} />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Excluir plano
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
