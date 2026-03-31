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
      <section className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_90px_rgba(166,61,20,0.12)] lg:grid-cols-[1.2fr_0.85fr]">
        <div className="card-grid relative overflow-hidden px-8 py-10 sm:px-10 sm:py-12">
          <div className="absolute right-0 top-0 h-44 w-44 translate-x-10 -translate-y-10 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-8 translate-y-8 rounded-full bg-[#0f766e]/10 blur-3xl" />
          <div className="relative max-w-2xl space-y-6">
            <p className="text-sm uppercase tracking-[0.22em] text-accent-strong/80">
              Area administrativa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Login de admin para liberar dashboard e gestao de condominios.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              O dashboard de cobrancas e a pagina de gerenciamento agora ficam
              reservados para administradores autenticados.
            </p>
            <div className="rounded-[1.5rem] border border-slate-900/10 bg-slate-950 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-200/70">
                Ambiente inicial
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Use o administrador seeded no banco. A senha padrao vem de{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                  ADMIN_DEFAULT_PASSWORD
                </code>{" "}
                e a sessao usa{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                  SESSION_SECRET
                </code>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-8 py-10 sm:px-10 sm:py-12">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Acesso exclusivo para quem administra condominios, planos e
              cobrancas.
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
