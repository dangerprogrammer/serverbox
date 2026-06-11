'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FloatingInput } from "@/app/_components/floating-field";

export function ClientLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/clientes/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as {
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.redirectTo) {
        setError(payload.error ?? "Credenciais invalidas.");
        return;
      }

      router.replace(payload.redirectTo);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <FloatingInput
        label="Usuário"
        name="username"
        autoComplete="username"
        placeholder="usuario.do.condominio"
      />

      <FloatingInput
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha de cliente"
      />

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Entrando..." : "Entrar como cliente"}
      </button>
    </form>
  );
}
