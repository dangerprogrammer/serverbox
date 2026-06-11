import Link from "next/link";
import { redirect } from "next/navigation";

import { ClientLoginForm } from "@/app/cliente/login/_components/client-login-form";
import { getAuthenticatedCondominiumClientFromCookies } from "@/lib/auth/client-session";

export const dynamic = "force-dynamic";

export default async function ClientLoginPage() {
  const client = await getAuthenticatedCondominiumClientFromCookies();

  if (client) {
    redirect("/cliente/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-10 lg:px-12">
      <section className="grid w-full gap-8 rounded-[1.5rem] border border-border bg-surface shadow-sm lg:grid-cols-[1.2fr_0.85fr]">
        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Área do cliente
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Dashboard do condomínio.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              Acompanhe saldo, planos, quadras e histórico de cobranças do seu
              condomínio.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center border-t border-border px-5 py-8 sm:px-10 sm:py-12 lg:border-l lg:border-t-0">
          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Entrar no painel
            </h2>
            <div className="mt-6">
              <ClientLoginForm />
            </div>
          </div>

          <Link
            href="/login"
            className="mt-6 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Entrar como administrador
          </Link>
        </div>
      </section>
    </main>
  );
}
