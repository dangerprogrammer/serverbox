'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/app/_components/app-sidebar";
import { ADMIN_SESSION_STORAGE_KEY } from "@/lib/auth/session-constants";

type AppShellProps = {
  children: React.ReactNode;
  condominiums: Array<{
    id: string;
    name: string;
  }>;
};

const hiddenSidebarPaths = ["/login"];

const publicPaths = ["/", "/login", "/sobre-nos"];

function shouldHideSidebar(pathname: string) {
  return (
    hiddenSidebarPaths.includes(pathname) || pathname.startsWith("/pagamentos")
  );
}

function isPublicPath(pathname: string) {
  return publicPaths.includes(pathname) || pathname.startsWith("/pagamentos");
}

export function AppShell({ children, condominiums }: AppShellProps) {
  const pathname = usePathname();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    const authenticated = Boolean(sessionToken);

    setIsAuthenticated(authenticated);
    setSessionChecked(true);

    if (!authenticated && !isPublicPath(pathname)) {
      window.location.replace("/login");
      return;
    }

    if (authenticated && pathname === "/login") {
      window.location.replace("/dashboard");
    }
  }, [pathname]);

  if (!sessionChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return isPublicPath(pathname) ? <>{children}</> : null;
  }

  if (shouldHideSidebar(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <AppSidebar condominiums={condominiums} />
      <div className="min-w-0 lg:pl-[21rem]">{children}</div>
    </div>
  );
}
