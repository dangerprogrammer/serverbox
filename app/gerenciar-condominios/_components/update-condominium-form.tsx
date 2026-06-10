'use client';

import { useState } from "react";

import { FloatingInput } from "@/app/_components/floating-field";
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
  tubeBrandId: string;
};

type UpdateCondominiumFormProps = {
  condominiumId: string;
  name: string;
  city: string;
  state: string;
  courtDetails: CourtValue[];
  tubeBrands: TubeBrandOption[];
  ballQuantity: number;
};

export function UpdateCondominiumForm({
  condominiumId,
  name: initialName,
  city: initialCity,
  state: initialState,
  courtDetails,
  tubeBrands,
  ballQuantity: initialBallQuantity,
}: UpdateCondominiumFormProps) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [ballQuantity, setBallQuantity] = useState(String(initialBallQuantity));

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
        <FloatingInput
          label="Estoque real de tubos"
          name="ballQuantity"
          type="number"
          min={0}
          value={ballQuantity}
          onChange={(event) => setBallQuantity(event.target.value)}
          placeholder="Estoque real de tubos"
          className="bg-white"
        />
      </div>

      <CondominiumCourtsFieldset
        tubeBrands={tubeBrands}
        initialCourts={courtDetails}
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
