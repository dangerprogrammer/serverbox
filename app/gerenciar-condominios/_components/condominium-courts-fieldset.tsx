'use client';

import { useEffect, useMemo, useState } from "react";

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

type CondominiumCourtsFieldsetProps = {
  tubeBrands: TubeBrandOption[];
  initialCourts?: CourtValue[];
  initialStock?: { tubeBrandId: string; quantity: number }[];
  onDirtyChange?: (dirty: boolean) => void;
  onReadyChange?: (ready: boolean) => void;
};

function createCourt(index: number, tubeBrandId: string): CourtValue {
  return {
    id: crypto.randomUUID(),
    name: `Quadra ${index + 1}`,
    tubeBrandIds: tubeBrandId ? [tubeBrandId] : [],
  };
}

function getCourtBrandIds(court: CourtValue) {
  if (court.tubeBrandIds && court.tubeBrandIds.length > 0) {
    return court.tubeBrandIds;
  }

  return court.tubeBrandId ? [court.tubeBrandId] : [];
}

function serializeCourtState(courts: CourtValue[]) {
  return JSON.stringify(
    courts.map((court) => ({
      name: court.name.trim(),
      tubeBrandIds: getCourtBrandIds(court),
    })),
  );
}

function serializeStockState(
  tubeBrands: TubeBrandOption[],
  stockQuantities: Map<string, number>,
) {
  return JSON.stringify(
    tubeBrands.map((brand) => [brand.id, stockQuantities.get(brand.id) ?? 0]),
  );
}

export function CondominiumCourtsFieldset({
  tubeBrands,
  initialCourts = [],
  initialStock = [],
  onDirtyChange,
  onReadyChange,
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
  const [isOpen, setIsOpen] = useState(initialCourts.length <= 1);
  const initialStockQuantities = useMemo(
    () =>
      new Map(
        initialStock
          .filter((entry) => Number.isFinite(entry.quantity) && entry.quantity > 0)
          .map((entry) => [entry.tubeBrandId, entry.quantity]),
      ),
    [initialStock],
  );
  const [stockQuantities, setStockQuantities] = useState(() =>
    new Map(
      tubeBrands.map((brand) => [
        brand.id,
        initialStockQuantities.get(brand.id) ?? 0,
      ]),
    ),
  );
  const initialCourtState = useMemo(
    () => serializeCourtState(initialValues),
    [initialValues],
  );
  const initialStockState = useMemo(
    () => serializeStockState(tubeBrands, initialStockQuantities),
    [initialStockQuantities, tubeBrands],
  );
  const currentCourtState = useMemo(() => serializeCourtState(courts), [courts]);
  const currentStockState = useMemo(
    () => serializeStockState(tubeBrands, stockQuantities),
    [stockQuantities, tubeBrands],
  );
  const isReady = useMemo(() => {
    if (tubeBrands.length === 0 || courts.length === 0) {
      return false;
    }

    return courts.some((court) =>
      getCourtBrandIds(court).some(
        (brandId) => (stockQuantities.get(brandId) ?? 0) > 0,
      ),
    );
  }, [courts, stockQuantities, tubeBrands.length]);

  useEffect(() => {
    onDirtyChange?.(
      currentCourtState !== initialCourtState ||
        currentStockState !== initialStockState,
    );
  }, [
    currentCourtState,
    currentStockState,
    initialCourtState,
    initialStockState,
    onDirtyChange,
  ]);

  useEffect(() => {
    onReadyChange?.(isReady);
  }, [isReady, onReadyChange]);

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

  function toggleCourtBrand(courtId: string, tubeBrandId: string) {
    setCourts((currentCourts) =>
      currentCourts.map((court) => {
        if (court.id !== courtId) {
          return court;
        }

        const currentBrandIds = getCourtBrandIds(court);
        const hasBrand = currentBrandIds.includes(tubeBrandId);
        const nextBrandIds = hasBrand
          ? currentBrandIds.filter((brandId) => brandId !== tubeBrandId)
          : [...currentBrandIds, tubeBrandId];

        return {
          ...court,
          tubeBrandIds: nextBrandIds.length > 0 ? nextBrandIds : currentBrandIds,
        };
      }),
    );
  }

  function removeCourt(courtId: string) {
    setCourts((currentCourts) =>
      currentCourts.length <= 1
        ? currentCourts
        : currentCourts.filter((court) => court.id !== courtId),
    );
  }

  function updateStockQuantity(tubeBrandId: string, quantity: number) {
    setStockQuantities((currentQuantities) => {
      const nextQuantities = new Map(currentQuantities);
      nextQuantities.set(tubeBrandId, quantity);

      return nextQuantities;
    });
  }

  return (
    <fieldset className="space-y-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <legend className="sr-only">Quadras e marcas de tubos</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex min-h-10 items-center gap-3 text-left"
          aria-expanded={isOpen}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={`size-4 transition ${isOpen ? "rotate-180" : "rotate-0"}`}
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
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Quadras e marcas de tubos
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              {courts.length} {courts.length === 1 ? "quadra" : "quadras"}
            </span>
          </span>
        </button>
        {isOpen ? (
          <button
            type="button"
            onClick={addCourt}
            disabled={tubeBrands.length === 0}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar quadra
          </button>
        ) : null}
      </div>

      <div hidden={!isOpen}>
        {tubeBrands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-500">
            Cadastre uma marca de tubos antes de adicionar quadras.
          </div>
        ) : (
          <div>
            <div>
              {courts.map((court, index) => (
                <div
                  key={court.id}
                  className={`py-4 last:pb-0 ${index === 0 ? "pt-0" : "border-t"}`}
                  style={
                    index === 0
                      ? undefined
                      : {
                          borderColor:
                            "color-mix(in srgb, var(--border) 55%, transparent)",
                        }
                  }
                >
                  <div className="grid gap-3">
                    <input type="hidden" name="courtKey" value={court.id} />
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

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Marcas e estoque
                    </span>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-x-3 gap-y-2">
                      {tubeBrands.map((brand) => {
                        const isSelected = getCourtBrandIds(court).includes(brand.id);
                        const quantity = stockQuantities.get(brand.id) ?? 0;

                        return (
                          <div
                            key={brand.id}
                            className={`transition ${isSelected ? "opacity-100" : "opacity-55"}`}
                          >
                            <label className="group inline-flex min-h-8 min-w-0 cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                name={`tubeBrandIds:${court.id}`}
                                value={brand.id}
                                checked={isSelected}
                                onChange={() => toggleCourtBrand(court.id, brand.id)}
                                className="peer sr-only"
                              />
                              <span
                                aria-hidden="true"
                                className={`grid size-5 shrink-0 place-items-center rounded-md border text-[0.68rem] font-black leading-none transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-600 text-white peer-focus-visible:outline-emerald-600"
                                    : "border-slate-300 bg-white text-transparent group-hover:border-slate-900 peer-focus-visible:outline-slate-400"
                                }`}
                              >
                                ✓
                              </span>
                              <span className="truncate text-sm font-semibold text-slate-900">
                                {brand.name}
                              </span>
                            </label>

                            <label className="mt-2 block">
                              <span className="sr-only">
                                Estoque de {brand.name}
                              </span>
                              {isSelected ? (
                                <>
                                  <input
                                    type="hidden"
                                    name="stockBrandId"
                                    value={brand.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="stockQuantity"
                                    value={quantity}
                                  />
                                </>
                              ) : null}
                              <input
                                type="number"
                                min={0}
                                aria-label={`Estoque de ${brand.name}`}
                                value={quantity}
                                disabled={!isSelected}
                                onChange={(event) =>
                                  updateStockQuantity(
                                    brand.id,
                                    Number(event.target.value),
                                  )
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-transparent px-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-900 disabled:text-slate-400"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeCourt(court.id)}
                  disabled={courts.length <= 1}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Remover quadra
                </button>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </fieldset>
  );
}
