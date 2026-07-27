'use client';

import { useState } from "react";

import { FloatingInput } from "@/app/_components/floating-field";
import { FormSubmitButton } from "@/app/_components/form-submit-button";
import { SessionTokenInput } from "@/app/_components/session-token-input";
import { CondominiumCourtsFieldset } from "@/app/gerenciar-condominios/_components/condominium-courts-fieldset";
import { createCondominiumAction } from "@/app/gerenciar-condominios/actions";

type TubeBrandOption = {
  id: string;
  name: string;
};

type CreateCondominiumFormProps = {
  tubeBrands: TubeBrandOption[];
};

export function CreateCondominiumForm({
  tubeBrands,
}: CreateCondominiumFormProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isCourtsReady, setIsCourtsReady] = useState(false);

  const hasRequiredFields =
    name.trim().length > 0 && city.trim().length > 0 && state.trim().length > 0;
  const canSubmit = hasRequiredFields && isCourtsReady;

  const handleSubmit = async (formData: FormData) => {
    await createCondominiumAction(formData);
  };

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
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
          value={state}
          onChange={(event) => setState(event.target.value.toUpperCase())}
          placeholder="UF"
          maxLength={2}
          className="bg-white uppercase"
        />
      </div>

      <CondominiumCourtsFieldset
        tubeBrands={tubeBrands}
        onReadyChange={setIsCourtsReady}
      />

      <FormSubmitButton
        idleLabel="Criar condomínio"
        pendingLabel="Criando condomínio..."
        disabled={!canSubmit}
        className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-60"
      />
    </form>
  );
}