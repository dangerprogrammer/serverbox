'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearStoredAdminSessionToken,
  getStoredAdminSessionToken,
  useStoredAdminSessionToken,
} from "@/app/_components/admin-session-storage";
import { AppSidebar } from "@/app/_components/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
  condominiums: Array<{
    id: string;
    name: string;
  }>;
};

const hiddenSidebarPaths = ["/login"];

const publicPaths = ["/", "/login", "/sobre-nos"];

type SessionState = "checking" | "authenticated" | "public";

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
  const sessionToken = useStoredAdminSessionToken();
  const [sessionState, setSessionState] = useState<SessionState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function clearSessionAndRedirect(message: string) {
      const currentSessionToken = getStoredAdminSessionToken();

      if (currentSessionToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionToken: currentSessionToken }),
        }).catch(() => undefined);
      }

      clearStoredAdminSessionToken();

      if (!cancelled) {
        window.alert(message);
      }

      window.location.replace("/login");
    }

    async function validateSession() {
      if (isPublicPath(pathname) && pathname !== "/login") {
        setSessionState("public");
        return;
      }

      if (!sessionToken) {
        if (pathname === "/login") {
          setSessionState("public");
          return;
        }

        await clearSessionAndRedirect(
          "Sua sessao administrativa nao foi encontrada. Faca login novamente.",
        );
        return;
      }

      setSessionState("checking");

      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        headers: {
          "x-serverbox-session-token": sessionToken,
        },
      }).catch(() => null);

      if (!response?.ok) {
        await clearSessionAndRedirect(
          "Sua sessao administrativa expirou ou nao e mais valida. Faca login novamente.",
        );
        return;
      }

      if (cancelled) {
        return;
      }

      if (pathname === "/login") {
        window.location.replace("/dashboard");
        return;
      }

      setSessionState("authenticated");
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, sessionToken]);

  if (sessionState === "checking") {
    return null;
  }

  if (sessionState === "public") {
    return <>{children}</>;
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
