'use client';

import { useActionState, useEffect, useState } from "react";

import { SessionTokenInput } from "@/app/_components/session-token-input";
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

  useEffect(() => {
    if (state.success) {
      setIsConfirming(false);
    }
  }, [state.success]);

  const stockSummary = stockCondominiums.length
    ? stockCondominiums.join(", ")
    : "nenhum condomínio";
  const courtSummary = courtCondominiums.length
    ? courtCondominiums.join(", ")
    : "nenhuma quadra";
  const canDeleteDirectly =
    stockCondominiums.length === 0 && courtCondominiums.length === 0;

  if (canDeleteDirectly) {
    return (
      <form action={formAction} className="flex flex-col items-stretch gap-2">
        <SessionTokenInput />
        <input type="hidden" name="tubeBrandId" value={tubeBrandId} />
        <button
          type="submit"
          className="inline-flex size-8 items-center justify-center rounded-full text-rose-700 transition hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Excluir marca ${tubeBrandName}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M6 6L14 14M14 6L6 14"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {state.message ? (
          <p className="max-w-44 text-xs leading-5 text-rose-700">
            {state.message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      {!isConfirming ? (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="inline-flex size-8 items-center justify-center rounded-full text-rose-700 transition hover:bg-rose-50 hover:text-rose-800"
          aria-label={`Excluir marca ${tubeBrandName}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M6 6L14 14M14 6L6 14"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setIsConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-brand-title-${tubeBrandId}`}
            className="w-full max-w-lg rounded-[1.5rem] border border-rose-200 bg-white p-5 text-left shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  id={`delete-brand-title-${tubeBrandId}`}
                  className="text-lg font-semibold text-slate-900"
                >
                  Excluir {tubeBrandName}?
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Isso vai remover a marca do estoque dos condomínios e dos vínculos das quadras quando houver outra marca disponível.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Condomínios que usam esta marca no estoque: {stockSummary}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
                aria-label="Fechar confirmação"
              >
                ×
              </button>
            </div>

            {courtCondominiums.length > 0 ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Esta marca ainda aparece nas quadras dos condomínios: {courtSummary}. A exclusão vai tentar limpar esses vínculos automaticamente; se alguma quadra ficar sem marca, a ação será bloqueada.
              </p>
            ) : null}

            {state.message ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                {state.message}
              </p>
            ) : null}

            <form action={formAction} className="mt-5 flex flex-wrap gap-2">
              <SessionTokenInput />
              <input type="hidden" name="tubeBrandId" value={tubeBrandId} />
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Cancelar
              </button>
              <FormSubmitButton
                idleLabel="Excluir mesmo assim"
                pendingLabel="Excluindo..."
                className="inline-flex h-10 items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-rose-50 disabled:text-rose-400"
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}