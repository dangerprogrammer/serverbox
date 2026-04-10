'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  {
    href: "/gerenciar-condominios",
    label: "Condomínios",
    icon: BuildingsIcon,
  },
  { href: "/sobre-nos", label: "Sobre nós", icon: InfoIcon },
];

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M4.5 4.5h6v6h-6v-6Zm9 0h6v10h-6v-10Zm-9 9h6v6h-6v-6Zm9 4h6v2h-6v-2Z"
      />
    </svg>
  );
}

function BuildingsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M4.5 20.5V6.5l7-2v16m0 0h-7m7 0h8m-2-10v10m-7-10h7m-5 3h1m-1 3h1m-4-3h1m-1 3h1"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10.5v5m0-9v.01"
      />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:gap-6 lg:border-r lg:border-border lg:bg-white lg:px-5 lg:py-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            ServerBox
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Navegação
          </h2>
        </div>

        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-amber-200 bg-amber-100 text-amber-950"
                    : "border-border bg-surface text-slate-700 hover:border-slate-900 hover:text-slate-900"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:hidden sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-10">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-amber-200 bg-amber-100 text-amber-950"
                    : "border-border bg-white text-slate-700"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
