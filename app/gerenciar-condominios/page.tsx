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
import { PlanTier } from "@/lib/domain/condominium-plan";

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
  const { condominiums } = await getCondominiumManagementData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Gestao administrativa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Cada condominio concentra seus proprios planos.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              O cadastro reflete a regra do negocio: plano e dado interno do
              condominio, nao um cadastro separado.
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
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Novo condominio
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            O condominio nasce vazio e os planos passam a fazer parte dele logo
            abaixo, no proprio card.
          </p>

          <form action={createCondominiumAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="name"
                placeholder="Nome do condominio"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              />
              <input
                name="city"
                placeholder="Cidade"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              />
              <input
                name="state"
                placeholder="UF"
                maxLength={2}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none"
              />
              <input
                name="courts"
                type="number"
                min={1}
                defaultValue={1}
                placeholder="Quadras"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
              />
            </div>
            <input
              name="activeResidents"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="Moradores ativos"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            />

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Criar condominio
            </button>
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Condominios cadastrados
          </h2>
          <div className="mt-6 space-y-5">
            {condominiums.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                Nenhum condominio cadastrado ainda.
              </div>
            ) : (
              condominiums.map((condominium) => (
                <article
                  key={condominium.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <form action={updateCondominiumAction} className="space-y-4">
                    <input type="hidden" name="condominiumId" value={condominium.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={condominium.name}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <input
                        name="city"
                        defaultValue={condominium.city}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <input
                        name="state"
                        maxLength={2}
                        defaultValue={condominium.state}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none"
                      />
                      <input
                        name="courts"
                        type="number"
                        min={1}
                        defaultValue={condominium.courts}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <input
                      name="activeResidents"
                      type="number"
                      min={0}
                      defaultValue={condominium.activeResidents}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                    />
                    <p className="text-sm text-slate-500">
                      Admin responsavel: {condominium.administratorName} -{" "}
                      {condominium.administratorEmail}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Salvar condominio
                      </button>
                    </div>
                  </form>

                  <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Planos deste condominio
                      </h3>
                      <span className="text-sm text-slate-500">
                        {condominium.plans.length} cadastrados
                      </span>
                    </div>

                    <form action={createPlanAction} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <input type="hidden" name="condominiumId" value={condominium.id} />
                      <p className="text-sm font-medium text-slate-900">
                        Novo plano deste condominio
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          name="name"
                          placeholder="Nome do plano"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                        <input
                          name="slug"
                          placeholder="slug-do-plano"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                        <select
                          name="tier"
                          defaultValue={PlanTier.CUSTOM}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                          {Object.values(PlanTier).map((tier) => (
                            <option key={tier} value={tier}>
                              {tierLabels[tier]}
                            </option>
                          ))}
                        </select>
                        <input
                          name="monthlyBallAllowance"
                          type="number"
                          min={0}
                          placeholder="Bolinhas por mes"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                        <input
                          name="monthlyPriceInCents"
                          type="number"
                          min={0}
                          placeholder="Preco mensal em centavos"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                        <input
                          name="overagePriceInCents"
                          type="number"
                          min={0}
                          placeholder="Preco excedente em centavos"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <textarea
                        name="description"
                        rows={3}
                        placeholder="Descricao comercial do plano"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Criar plano
                      </button>
                    </form>

                    <div className="mt-4 space-y-4">
                      {condominium.plans.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
                          Este condominio ainda nao possui planos.
                        </div>
                      ) : (
                        condominium.plans.map((plan) => (
                          <article
                            key={plan.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <form action={updatePlanAction} className="space-y-4">
                              <input type="hidden" name="planId" value={plan.id} />
                              <div className="grid gap-3 md:grid-cols-2">
                                <input
                                  name="name"
                                  defaultValue={plan.name}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                />
                                <input
                                  name="slug"
                                  defaultValue={plan.slug}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                />
                                <select
                                  name="tier"
                                  defaultValue={plan.tier}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                >
                                  {Object.values(PlanTier).map((tier) => (
                                    <option key={tier} value={tier}>
                                      {tierLabels[tier]}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  name="monthlyBallAllowance"
                                  type="number"
                                  min={0}
                                  defaultValue={plan.monthlyBallAllowance}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                />
                                <input
                                  name="monthlyPriceInCents"
                                  type="number"
                                  min={0}
                                  defaultValue={plan.monthlyPriceInCents}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                />
                                <input
                                  name="overagePriceInCents"
                                  type="number"
                                  min={0}
                                  defaultValue={plan.overagePriceInCents}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                                />
                              </div>
                              <textarea
                                name="description"
                                rows={3}
                                defaultValue={plan.description}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                              />
                              <p className="text-sm text-slate-500">
                                {currencyFormatter.format(plan.monthlyPriceInCents / 100)}{" "}
                                / mes - criado por {plan.createdByName}
                              </p>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="submit"
                                  className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                  Salvar plano
                                </button>
                              </div>
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
                        ))
                      )}
                    </div>
                  </div>

                  <form action={deleteCondominiumAction} className="mt-4">
                    <input type="hidden" name="condominiumId" value={condominium.id} />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Excluir condominio
                    </button>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
