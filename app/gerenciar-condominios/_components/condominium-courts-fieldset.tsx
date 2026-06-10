'use client';

import { useMemo, useState } from "react";

type TubeBrandOption = {
  id: string;
  name: string;
};

type CourtValue = {
  id: string;
  name: string;
  tubeBrandId: string;
};

type CondominiumCourtsFieldsetProps = {
  tubeBrands: TubeBrandOption[];
  initialCourts?: CourtValue[];
};

function createCourt(index: number, tubeBrandId: string): CourtValue {
  return {
    id: crypto.randomUUID(),
    name: `Quadra ${index + 1}`,
    tubeBrandId,
  };
}

export function CondominiumCourtsFieldset({
  tubeBrands,
  initialCourts = [],
}: CondominiumCourtsFieldsetProps) {
  const defaultBrandId = tubeBrands[0]?.id ?? "";
  const initialValues = useMemo(
    () =>
      initialCourts.length > 0
        ? initialCourts
        : defaultBrandId
          ? [createCourt(0, defaultBrandId)]
          : [],
    [defaultBrandId, initialCourts],
  );
  const [courts, setCourts] = useState(initialValues);

  function addCourt() {
    setCourts((currentCourts) => [
      ...currentCourts,
      createCourt(currentCourts.length, defaultBrandId),
    ]);
  }

  function updateCourt(courtId: string, updates: Partial<CourtValue>) {
    setCourts((currentCourts) =>
      currentCourts.map((court) =>
        court.id === courtId ? { ...court, ...updates } : court,
      ),
    );
  }

  function removeCourt(courtId: string) {
    setCourts((currentCourts) =>
      currentCourts.length <= 1
        ? currentCourts
        : currentCourts.filter((court) => court.id !== courtId),
    );
  }

  return (
    <fieldset className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <legend className="text-sm font-semibold text-slate-900">
        Quadras e marcas de tubos
      </legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-500">
          {courts.length} {courts.length === 1 ? "quadra" : "quadras"}
        </span>
        <button
          type="button"
          onClick={addCourt}
          disabled={tubeBrands.length === 0}
          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Adicionar quadra
        </button>
      </div>

      {tubeBrands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-500">
          Cadastre uma marca de tubos antes de adicionar quadras.
        </div>
      ) : (
        <div className="space-y-3">
          {courts.map((court, index) => (
            <div
              key={court.id}
              className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Quadra {index + 1}
                </span>
                <input
                  type="text"
                  name="courtName"
                  value={court.name}
                  onChange={(event) =>
                    updateCourt(court.id, { name: event.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Marca de tubos
                </span>
                <select
                  name="tubeBrandId"
                  value={court.tubeBrandId}
                  onChange={(event) =>
                    updateCourt(court.id, { tubeBrandId: event.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                >
                  {tubeBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => removeCourt(court.id)}
                disabled={courts.length <= 1}
                className="inline-flex h-11 items-center justify-center self-end rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
