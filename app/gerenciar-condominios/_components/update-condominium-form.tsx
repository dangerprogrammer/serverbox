'use client';

import { useState } from 'react';
import { FloatingInput } from '@/app/_components/floating-field';
import { SessionTokenInput } from '@/app/_components/session-token-input';
import { updateCondominiumAction } from '@/app/gerenciar-condominios/actions';

type UpdateCondominiumFormProps = {
  condominiumId: string;
  name: string;
  city: string;
  state: string;
  courts: number;
  ballQuantity: number;
};

export function UpdateCondominiumForm({
  condominiumId,
  name: initialName,
  city: initialCity,
  state: initialState,
  courts: initialCourts,
  ballQuantity: initialBallQuantity,
}: UpdateCondominiumFormProps) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [courts, setCourts] = useState(String(initialCourts));
  const [ballQuantity, setBallQuantity] = useState(String(initialBallQuantity));

  const hasChanges =
    name !== initialName ||
    city !== initialCity ||
    state !== initialState ||
    courts !== String(initialCourts) ||
    ballQuantity !== String(initialBallQuantity);

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
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do condomínio"
          className="bg-white"
        />
        <FloatingInput
          label="Cidade"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cidade"
          className="bg-white"
        />
        <FloatingInput
          label="UF"
          name="state"
          maxLength={2}
          value={state}
          onChange={(e) => setState(e.target.value.toUpperCase())}
          placeholder="UF"
          className="bg-white uppercase"
        />
        <FloatingInput
          label="Quadras"
          name="courts"
          type="number"
          min={1}
          value={courts}
          onChange={(e) => setCourts(e.target.value)}
          placeholder="Quadras"
          className="bg-white"
        />
      </div>
      <FloatingInput
        label="Estoque real de tubos"
        name="ballQuantity"
        type="number"
        min={0}
        value={ballQuantity}
        onChange={(e) => setBallQuantity(e.target.value)}
        placeholder="Estoque real de tubos"
        className="bg-white"
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!hasChanges}
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar condomínio
        </button>
      </div>
    </form>
  );
}

