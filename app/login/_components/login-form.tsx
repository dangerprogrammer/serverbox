'use client';

import { useActionState } from "react";

import { loginAdmin } from "@/app/login/actions";

const initialState = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          placeholder="admin@serverbox.local"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          placeholder="Sua senha de admin"
        />
      </label>

      {state?.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar como admin"}
      </button>
    </form>
  );
}
