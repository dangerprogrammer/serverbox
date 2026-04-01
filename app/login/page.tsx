import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/_components/login-form";
import { getAuthenticatedAdmin } from "@/lib/auth/session";

export default async function LoginPage() {
  const administrator = await getAuthenticatedAdmin();

  if (administrator) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid w-full gap-8 rounded-[1.5rem] border border-border bg-surface shadow-sm lg:grid-cols-[1.2fr_0.85fr]">
        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Area administrativa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Login para acessar a operacao administrativa.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              O dashboard de cobrancas e a gestao de condominios ficam
              disponiveis apenas para administradores autenticados.
            </p>
            <div className="rounded-[1.25rem] border border-border bg-surface-strong p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                Ambiente inicial
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Use o administrador seeded no banco. A senha padrao vem de{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs">
                  ADMIN_DEFAULT_PASSWORD
                </code>{" "}
                e a sessao usa{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs">
                  SESSION_SECRET
                </code>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center border-t border-border px-8 py-10 sm:px-10 sm:py-12 lg:border-l lg:border-t-0">
          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Acesso restrito a administradores.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>

          <Link
            href="/"
            className="mt-6 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Voltar para a home
          </Link>
        </div>
      </section>
    </main>
  );
}
