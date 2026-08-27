import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre nós | ServeBox",
  description:
    "Conheça a ServeBox, uma operação de reposição e venda de tubos de tênis para condomínios.",
};

const principles = [
  {
    title: "Reposição sem ruído",
    text: "A rotina do condomínio já tem muitas frentes acontecendo ao mesmo tempo. A ServeBox entra para cuidar dos tubos de tênis com clareza, previsibilidade e menos trabalho manual para quem administra.",
  },
  {
    title: "Planos com contexto",
    text: "Cada condomínio tem seu próprio ritmo de uso das quadras. Por isso, os planos são pensados a partir da realidade de cada operação, em vez de seguir uma tabela genérica que ignora consumo, frequência e preferência dos moradores.",
  },
  {
    title: "Pagamento acompanhado",
    text: "A cobrança fica integrada ao fluxo de compra e o saldo só muda quando o pagamento é confirmado. Assim, a gestão comercial conversa com o estoque sem depender de conferências paralelas.",
  },
];

const workflow = [
  "Entendemos como o condomínio usa as quadras e quais marcas fazem sentido para aquele público.",
  "Organizamos planos e compras avulsas de uma forma simples para o administrador manter a oferta atualizada.",
  "Acompanhamos cobranças, confirmações e reposições para que a experiência nas quadras continue fluida.",
];

export default function SobreNosPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-8 sm:px-10 lg:px-12 lg:py-12">
      <section className="grid gap-10 py-4 lg:grid-cols-[1.15fr_0.85fr] lg:py-8">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-max rounded-full border border-border bg-surface-strong px-4 py-2 text-sm font-medium text-slate-700">
            Sobre nós
          </div>

          <div className="mt-8 max-w-3xl space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Tubos de tênis sempre à mão, sem transformar a gestão em planilha.
            </h1>
            <p className="text-base leading-8 text-slate-600 sm:text-lg">
              A ServeBox nasceu para aproximar a compra de tubos da rotina real
              dos condomínios. Em vez de tratar a operação como um painel cheio
              de números, cuidamos do que importa no dia a dia: disponibilidade,
              reposição, cobrança clara e uma experiência mais tranquila para
              administradores e moradores.
            </p>
            <p className="text-base leading-8 text-slate-600 sm:text-lg">
              Nosso trabalho combina serviço, organização e tecnologia. A parte
              técnica fica nos bastidores; para o condomínio, a sensação deve ser
              de simplicidade: saber o que está disponível, escolher o melhor
              plano e seguir com as quadras prontas para uso.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold !text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Entrar como admin
            </Link>
            <Link
              href="/sugestoes"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 sm:w-auto"
            >
              Enviar sugestão
            </Link>
          </div>
        </div>

        <aside className="self-start border-l-4 border-accent bg-surface p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            O que nos move
          </p>
          <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">
            <p>
              Um bom serviço para quadras não aparece apenas na hora da venda.
              Ele aparece quando o morador encontra tubos disponíveis, quando o
              administrador entende o que foi comprado e quando a reposição deixa
              de depender de mensagens soltas.
            </p>
            <p>
              Por isso, pensamos a ServeBox como uma operação próxima: prática o
              bastante para caber na rotina do condomínio e cuidadosa o bastante
              para não deixar o esporte virar mais uma pendência administrativa.
            </p>
          </div>
        </aside>
      </section>

      <section className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Como trabalhamos
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Uma operação pensada para a rotina de quem cuida das quadras.
          </h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-slate-700">
            {workflow.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-200 border-y border-border">
          {principles.map((principle) => (
            <article key={principle.title} className="py-6 first:pt-0 last:pb-0">
              <div className="grid gap-3 md:grid-cols-[0.45fr_1fr]">
                <h3 className="text-lg font-semibold text-slate-900">
                  {principle.title}
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  {principle.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-10">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Próximo passo
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Queremos que a compra de tubos pareça parte natural da vida do
            condomínio.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            A página de sugestões existe para manter essa construção aberta. Se
            algo pode ficar mais claro, mais simples ou mais útil para o seu
            condomínio, a equipe pode avaliar e transformar essa percepção em
            melhoria do serviço.
          </p>
          <div className="mt-7">
            <Link
              href="/sugestoes"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 sm:w-auto"
            >
              Compartilhar uma sugestão
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
