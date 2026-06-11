import Link from "next/link";

import { FloatingInput } from "@/app/_components/floating-field";
import { SessionTokenInput } from "@/app/_components/session-token-input";
import {
  createClientAccessAction,
  deleteClientAccessAction,
} from "@/app/gerenciar-condominios/actions";

type ClientAccess = {
  id: string;
  username: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: Date;
};

type ClientAccessesPanelProps = {
  condominiumId: string;
  clientAccesses: ClientAccess[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});

export function ClientAccessesPanel({
  condominiumId,
  clientAccesses,
}: ClientAccessesPanelProps) {
  return (
    <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">
            Acessos de cliente
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cliente/login"
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Abrir login do cliente
          </Link>
          <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
            {clientAccesses.length} acesso(s)
          </span>
        </div>
      </div>

      <form
        action={createClientAccessAction}
        className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <input type="hidden" name="condominiumId" value={condominiumId} />
        <SessionTokenInput />
        <p className="text-sm font-medium text-slate-900">
          Novo acesso para cliente
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <FloatingInput
            label="Nome do contato"
            name="displayName"
            placeholder="Ex.: Síndico"
            className="bg-white"
          />
          <FloatingInput
            label="Usuário"
            name="username"
            placeholder="cliente.condominio"
            required
            className="bg-white"
          />
          <FloatingInput
            label="Senha"
            name="password"
            type="password"
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            required
            className="bg-white"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Criar acesso
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {clientAccesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-500">
            Nenhum acesso de cliente criado para este condomínio.
          </div>
        ) : (
          clientAccesses.map((access) => (
            <article
              key={access.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {access.displayName || access.username}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {access.isActive ? "ativo" : "inativo"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Usuário: {access.username}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  Criado em {dateFormatter.format(access.createdAt)}
                </p>
              </div>

              <form action={deleteClientAccessAction}>
                <input type="hidden" name="accessId" value={access.id} />
                <SessionTokenInput />
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-full border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 sm:w-auto"
                >
                  Revogar acesso
                </button>
              </form>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
