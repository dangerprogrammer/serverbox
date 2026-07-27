'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/app/_components/currency-input';
import { FormSubmitButton } from '@/app/_components/form-submit-button';
import { SessionTokenInput } from '@/app/_components/session-token-input';
import { PlanTier } from '@/lib/domain/condominium-plan';
import { updatePlanAction } from '@/app/gerenciar-condominios/actions';

type UpdatePlanFormProps = {
  planId: string;
  name: string;
  tier: PlanTier;
  monthlyBallAllowance: number;
  monthlyPriceInCents: number;
  description: string;
  tierLabels: Record<string, string>;
};

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number.isFinite(value) ? value : 0) / 100);
}

export function UpdatePlanForm({
  planId,
  name: initialName,
  tier: initialTier,
  monthlyBallAllowance: initialBallAllowance,
  monthlyPriceInCents: initialPriceInCents,
  description: initialDescription,
  tierLabels,
}: UpdatePlanFormProps) {
  const [name, setName] = useState(initialName);
  const [tier, setTier] = useState(initialTier);
  const [monthlyBallAllowance, setMonthlyBallAllowance] = useState(String(initialBallAllowance));
  const [monthlyPriceInCents, setMonthlyPriceInCents] = useState(initialPriceInCents);
  const [monthlyPriceCentsDisplay, setMonthlyPriceCentsDisplay] = useState(
    formatCurrencyFromCents(initialPriceInCents)
  );
  const [description, setDescription] = useState(initialDescription);

  const hasChanges =
    name !== initialName ||
    tier !== initialTier ||
    monthlyBallAllowance !== String(initialBallAllowance) ||
    monthlyPriceInCents !== initialPriceInCents ||
    description !== initialDescription;

  const handleSubmit = async (formData: FormData) => {
    await updatePlanAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="planId" value={planId} />
      <SessionTokenInput />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
        />
        <select
          name="tier"
          value={tier}
          onChange={(e) => setTier(e.target.value as PlanTier)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
        >
          {Object.values(PlanTier).map((tierValue) => (
            <option key={tierValue} value={tierValue}>
              {tierLabels[tierValue]}
            </option>
          ))}
        </select>
        <input
          name="monthlyBallAllowance"
          type="number"
          min={0}
          value={monthlyBallAllowance}
          onChange={(e) => setMonthlyBallAllowance(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
        />
        <CurrencyInput
          label="Preço mensal"
          name="monthlyPriceInCents"
          value={monthlyPriceCentsDisplay}
          onChange={(cents) => {
            setMonthlyPriceInCents(cents);
            setMonthlyPriceCentsDisplay(formatCurrencyFromCents(cents));
          }}
          className="bg-white"
        />
      </div>
      <textarea
        name="description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
      />
      <div className="flex flex-wrap gap-3">
        <FormSubmitButton
          idleLabel="Salvar plano"
          pendingLabel="Salvando plano..."
          disabled={!hasChanges}
          disabledLabel="Sem alterações"
          className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        />
      </div>
    </form>
  );
}
