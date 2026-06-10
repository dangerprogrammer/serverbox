'use client';

import { useMemo, useState } from "react";

type TubeBrandOption = {
  id: string;
  name: string;
};

type TubeStockValue = {
  id: string;
  tubeBrandId: string;
  quantity: number;
};

type InitialTubeStockValue = {
  tubeBrandId: string;
  quantity: number;
};

type CondominiumBrandStockFieldsetProps = {
  tubeBrands: TubeBrandOption[];
  initialStock?: InitialTubeStockValue[];
};

function createStockRow(tubeBrandId: string, quantity = 0): TubeStockValue {
  return {
    id: crypto.randomUUID(),
    tubeBrandId,
    quantity,
  };
}

function getNextBrandId(rows: TubeStockValue[], tubeBrands: TubeBrandOption[]) {
  const usedBrandIds = new Set(rows.map((row) => row.tubeBrandId));

  return tubeBrands.find((brand) => !usedBrandIds.has(brand.id))?.id ?? "";
}

export function CondominiumBrandStockFieldset({
  tubeBrands,
  initialStock = [],
}: CondominiumBrandStockFieldsetProps) {
  const initialRows = useMemo(() => {
    const validInitialStock = initialStock.filter(
      (entry) =>
        tubeBrands.some((brand) => brand.id === entry.tubeBrandId) &&
        Number.isFinite(entry.quantity) &&
        entry.quantity > 0,
    );

    if (validInitialStock.length > 0) {
      return validInitialStock.map((entry) =>
        createStockRow(entry.tubeBrandId, entry.quantity),
      );
    }

    return tubeBrands[0] ? [createStockRow(tubeBrands[0].id, 0)] : [];
  }, [initialStock, tubeBrands]);
  const [rows, setRows] = useState(initialRows);
  const canAddRow = rows.length < tubeBrands.length;

  function addRow() {
    setRows((currentRows) => {
      const nextBrandId = getNextBrandId(currentRows, tubeBrands);

      return nextBrandId
        ? [...currentRows, createStockRow(nextBrandId, 0)]
        : currentRows;
    });
  }

  function updateRow(rowId: string, updates: Partial<TubeStockValue>) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
    );
  }

  function removeRow(rowId: string) {
    setRows((currentRows) =>
      currentRows.length <= 1
        ? currentRows
        : currentRows.filter((row) => row.id !== rowId),
    );
  }

  return (
    <fieldset className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <legend className="text-sm font-semibold text-slate-900">
        Estoque de tubos por marca
      </legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-500">
          {rows.length} {rows.length === 1 ? "marca" : "marcas"} com estoque
        </span>
        <button
          type="button"
          onClick={addRow}
          disabled={!canAddRow}
          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Adicionar marca
        </button>
      </div>

      {tubeBrands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-500">
          Cadastre uma marca de tubos antes de informar o estoque.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const selectedBrandIds = new Set(
              rows
                .filter((entry) => entry.id !== row.id)
                .map((entry) => entry.tubeBrandId),
            );

            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_minmax(8rem,0.45fr)_auto]"
              >
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Marca</span>
                  <select
                    name="stockBrandId"
                    value={row.tubeBrandId}
                    onChange={(event) =>
                      updateRow(row.id, { tubeBrandId: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                  >
                    {tubeBrands.map((brand) => (
                      <option
                        key={brand.id}
                        value={brand.id}
                        disabled={selectedBrandIds.has(brand.id)}
                      >
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Tubos</span>
                  <input
                    type="number"
                    name="stockQuantity"
                    min={0}
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.id, {
                        quantity: Number(event.target.value),
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="inline-flex h-11 items-center justify-center self-end rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

