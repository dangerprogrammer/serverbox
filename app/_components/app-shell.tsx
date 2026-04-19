'use client';

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/app/_components/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
  logoutAction: () => Promise<void>;
  condominiums: Array<{
    id: string;
    name: string;
  }>;
  isAuthenticated: boolean;
};

const hiddenSidebarPaths = ["/login"];

function shouldHideSidebar(pathname: string) {
  return (
    hiddenSidebarPaths.includes(pathname) || pathname.startsWith("/pagamentos")
  );
}

export function AppShell({ children, logoutAction, condominiums, isAuthenticated }: AppShellProps) {
  const pathname = usePathname();

  if (!isAuthenticated || shouldHideSidebar(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <AppSidebar logoutAction={logoutAction} condominiums={condominiums} />
      <div className="min-w-0 lg:pl-[21rem]">{children}</div>
    </div>
  );
}
