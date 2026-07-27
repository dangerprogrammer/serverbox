'use client';

import { useActionState, useState } from "react";

import { FormSubmitButton } from "@/app/_components/form-submit-button";
import {
  deleteTubeBrandAction,
  type DeleteTubeBrandActionState,
} from "@/app/gerenciar-condominios/actions";

type TubeBrandDeleteControlProps = {
  tubeBrandId: string;
  tubeBrandName: string;
  stockCondominiums: string[];
  courtCondominiums: string[];
};

const initialState: DeleteTubeBrandActionState = {
  success: false,
  message: null,
};

export function TubeBrandDeleteControl({
  tubeBrandId,
  tubeBrandName,
  stockCondominiums,
  courtCondominiums,
}: TubeBrandDeleteControlProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction] = useActionState(
    deleteTubeBrandAction,
    initialState,
  );

  const hasCourtUsage = courtCondominiums.length > 0;
  const stockSummary = stockCondominiums.length
    ? stockCondominiums.join(", ")
    : "nenhum condomínio";
  const courtSummary = courtCondominiums.length
    ? courtCondominiums.join(", ")
    : "nenhuma quadra";

  return (
    <div className="flex flex-col items-stretch gap-2">
      {!isConfirming ? (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="rounded-full border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50"
          aria-label={`Excluir marca ${tubeBrandName}`}
        >
          x
        </button>
      ) : (
        <div className="min-w-72 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-left shadow-sm">
          <p className="text-sm font-semibold text-rose-900">
            Confirmar exclusão de {tubeBrandName}?
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-800">
            Isso irá remover a marca do estoque dos condomínios: {stockSummary}.
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-800">
            Quadras ainda vinculadas: {courtSummary}.
          </p>
          {hasCourtUsage ? (
            <p className="mt-2 text-sm font-medium text-rose-900">
              Remova essa marca das quadras antes de continuar.
            </p>
          ) : null}
          {state.message ? (
            <p className="mt-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700">
              {state.message}
            </p>
          ) : null}
          <form action={formAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="tubeBrandId" value={tubeBrandId} />
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Cancelar
            </button>
            <FormSubmitButton
              idleLabel="Continuar"
              pendingLabel="Excluindo..."
              disabled={hasCourtUsage}
              disabledLabel="Remova das quadras primeiro"
              className="inline-flex h-9 items-center justify-center rounded-full border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-rose-50 disabled:text-rose-400"
            />
          </form>
        </div>
      )}
    </div>
  );
}