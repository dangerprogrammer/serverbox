'use client';

import { useState } from "react";

import { FloatingInput } from "@/app/_components/floating-field";
import { SessionTokenInput } from "@/app/_components/session-token-input";
import { CondominiumBrandStockFieldset } from "@/app/gerenciar-condominios/_components/condominium-brand-stock-fieldset";
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
      />
      <CondominiumBrandStockFieldset
        tubeBrands={tubeBrands}
        initialStock={tubeStockByBrand}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Salvar condomínio
        </button>
      </div>
    </form>
  );
}
