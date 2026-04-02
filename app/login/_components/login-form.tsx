'use client';

import { useActionState } from "react";

import { FloatingInput } from "@/app/_components/floating-field";
import { loginAdmin } from "@/app/login/actions";

const initialState = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FloatingInput
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="admin@serverbox.local"
      />

      <FloatingInput
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha de admin"
      />

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
