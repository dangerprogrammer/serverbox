'use client';

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/app/_components/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

const hiddenSidebarPaths = ["/login"];

function shouldHideSidebar(pathname: string) {
  return (
    hiddenSidebarPaths.includes(pathname) || pathname.startsWith("/pagamentos")
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (shouldHideSidebar(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
