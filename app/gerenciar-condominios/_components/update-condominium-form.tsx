'use client';

import { useState } from "react";

import { FloatingInput } from "@/app/_components/floating-field";
import { FormSubmitButton } from "@/app/_components/form-submit-button";
import { SessionTokenInput } from "@/app/_components/session-token-input";
import { CondominiumCourtsFieldset } from "@/app/gerenciar-condominios/_components/condominium-courts-fieldset";
import { updateCondominiumAction } from "@/app/gerenciar-condominios/actions";

type TubeBrandOption = {
  id: string;
  name: string;
};

type CourtValue = {
  id: string;
  name: string;
  tubeBrandId?: string;
  tubeBrandIds?: string[];
};

type TubeStockValue = {
  tubeBrandId: string;
  quantity: number;
};

type UpdateCondominiumFormProps = {
  condominiumId: string;
  name: string;
  city: string;
  state: string;
  courtDetails: CourtValue[];
  tubeBrands: TubeBrandOption[];
  tubeStockByBrand: TubeStockValue[];
};

export function UpdateCondominiumForm({
  condominiumId,
  name: initialName,
  city: initialCity,
  state: initialState,
  courtDetails,
  tubeBrands,
  tubeStockByBrand,
}: UpdateCondominiumFormProps) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [isCourtsDirty, setIsCourtsDirty] = useState(false);

  const isOwnDirty =
    name !== initialName || city !== initialCity || state !== initialState;
  const hasChanges = isOwnDirty || isCourtsDirty;

  const handleSubmit = async (formData: FormData) => {
    await updateCondominiumAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="condominiumId" value={condominiumId} />
      <SessionTokenInput />
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput
          label="Nome do condomínio"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do condomínio"
          className="bg-white"
        />
        <FloatingInput
          label="Cidade"
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Cidade"
          className="bg-white"
        />
        <FloatingInput
          label="UF"
          name="state"
          maxLength={2}
          value={state}
          onChange={(event) => setState(event.target.value.toUpperCase())}
          placeholder="UF"
          className="bg-white uppercase"
        />
      </div>

      <CondominiumCourtsFieldset
        tubeBrands={tubeBrands}
        initialCourts={courtDetails}
        initialStock={tubeStockByBrand}
        onDirtyChange={setIsCourtsDirty}
      />

      <div className="flex flex-wrap gap-3">
        <FormSubmitButton
          idleLabel="Salvar condomínio"
          pendingLabel="Salvando condomínio..."
          disabled={!hasChanges}
          disabledLabel="Sem alterações"
          className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        />
      </div>
    </form>
  );
}
