import { CurrencyInput } from "@/app/_components/currency-input";
import { SessionTokenInput } from "@/app/_components/session-token-input";
import {
  FloatingInput,
  FloatingTextarea,
} from "@/app/_components/floating-field";
import { UpdateCondominiumForm } from "@/app/gerenciar-condominios/_components/update-condominium-form";
import { UpdatePlanForm } from "@/app/gerenciar-condominios/_components/update-plan-form";
import {
  createCondominiumAction,
  createPlanAction,
  deleteCondominiumAction,
  deletePlanAction,
} from "@/app/gerenciar-condominios/actions";
import { getCondominiumManagementData } from "@/lib/data/admin-management";
import { PlanTier } from "@/lib/domain/condominium-plan";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const tierLabels: Record<string, string> = {
  [PlanTier.BASIC]: "Básico",
  [PlanTier.INTERMEDIATE]: "Intermediário",
  [PlanTier.PREMIUM]: "Premium",
  [PlanTier.CUSTOM]: "Customizado",
};

export const dynamic = "force-dynamic";

export default async function GerenciarCondominiosPage() {
  const { condominiums } = await getCondominiumManagementData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-10 lg:px-12">
      <section className="rounded-[1.5rem] border border-border bg-surface px-4 py-6 shadow-sm sm:px-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            Gestão administrativa
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Cada condomínio concentra seus próprios planos.
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600">
            O cadastro reflete a regra do negócio: plano e dado interno do
            condomínio, não um cadastro separado.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm xl:sticky xl:top-8">
          <h2 className="text-2xl font-semibold text-slate-900">
            Novo condomínio
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            O condomínio nasce vazio e os planos passam a fazer parte dele logo
            abaixo, no próprio card.
          </p>

          <form action={createCondominiumAction} className="mt-6 space-y-4">
            <SessionTokenInput />
            <div className="grid gap-4 md:grid-cols-2">
              <FloatingInput
                label="Nome do condomínio"
                name="name"
                placeholder="Nome do condomínio"
                className="bg-white"
              />
              <FloatingInput
                label="Cidade"
                name="city"
                placeholder="Cidade"
                className="bg-white"
              />
              <FloatingInput
                label="UF"
                name="state"
                placeholder="UF"
                maxLength={2}
                className="bg-white uppercase"
              />
              <FloatingInput
                label="Quadras"
                name="courts"
                type="number"
                min={1}
                defaultValue={1}
                placeholder="Quadras"
                className="bg-white"
              />
            </div>
            <FloatingInput
              label="Estoque real de tubos"
              name="ballQuantity"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="Estoque real de tubos"
              className="bg-white"
            />

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Criar condomínio
            </button>
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Condomínios cadastrados
          </h2>
          <div className="mt-6 space-y-5">
            {condominiums.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                Nenhum condomínio cadastrado ainda.
              </div>
            ) : (
              condominiums.map((condominium) => (
                <details
                  key={condominium.id}
                  className="group rounded-[1.25rem] border border-slate-200 bg-slate-50"
                >
                  <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:hidden md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {condominium.name}
                        </h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          {condominium.plans.length} planos
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {condominium.courts} quadras - estoque real de{" "}
                        {condominium.ballQuantity} tubos
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 sm:min-w-64">
                        <span className="rounded-xl bg-white px-3 py-2 text-center">
                          {condominium.courts} quadras
                        </span>
                        <span className="rounded-xl bg-white px-3 py-2 text-center">
                          {condominium.ballQuantity} em estoque
                        </span>
                      </div>
                      <span className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition group-open:rotate-180">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="size-5"
                        >
                          <path
                            d="M5 7.5 10 12.5 15 7.5"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </summary>

                  <div className="border-t border-slate-200 bg-white p-5">
                    <UpdateCondominiumForm
                      condominiumId={condominium.id}
                      name={condominium.name}
                      city={condominium.city}
                      state={condominium.state}
                      courts={condominium.courts}
                      ballQuantity={condominium.ballQuantity}
                    />

                    <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-lg font-semibold text-slate-900">
                          Planos deste condomínio
                        </h4>
                        <span className="text-sm text-slate-500">
                          {condominium.plans.length} cadastrados
                        </span>
                      </div>

                      <form
                        action={createPlanAction}
                        className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <input type="hidden" name="condominiumId" value={condominium.id} />
                        <SessionTokenInput />
                        <p className="text-sm font-medium text-slate-900">
                          Novo plano deste condomínio
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <FloatingInput
                            label="Nome do plano"
                            name="name"
                            placeholder="Nome do plano"
                            required
                            className="bg-white"
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
                          <FloatingInput
                            label="Tubos por mês"
                            name="monthlyBallAllowance"
                            type="number"
                            min={0}
                            placeholder="Tubos por mês"
                            className="bg-white"
                          />
                          <CurrencyInput
                            label="Preço mensal"
                            name="monthlyPriceInCents"
                            defaultValueInCents={0}
                            className="bg-white"
                          />
                        </div>
                        <FloatingTextarea
                          label="Descrição comercial do plano"
                          name="description"
                          rows={3}
                          placeholder="Descrição comercial do plano"
                          required
                          className="bg-white"
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
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-500">
                            Este condomínio ainda não possui planos.
                          </div>
                        ) : (
                          condominium.plans.map((plan) => (
                            <article
                              key={plan.id}
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <UpdatePlanForm
                                planId={plan.id}
                                name={plan.name}
                                tier={plan.tier}
                                monthlyBallAllowance={plan.monthlyBallAllowance}
                                monthlyPriceInCents={plan.monthlyPriceInCents}
                                description={plan.description}
                                tierLabels={tierLabels}
                              />

                              <p className="mt-4 text-sm text-slate-500">
                                {currencyFormatter.format(plan.monthlyPriceInCents / 100)}{" "}
                                / mês - criado por {plan.createdByName}
                              </p>

                              <form action={deletePlanAction} className="mt-3">
                                <input type="hidden" name="planId" value={plan.id} />
                                <SessionTokenInput />
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
                      <SessionTokenInput />
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Excluir condomínio
                      </button>
                    </form>
                  </div>
                </details>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

