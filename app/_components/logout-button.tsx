"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  clearStoredAdminSessionToken,
  getStoredAdminSessionToken,
} from "@/app/_components/admin-session-storage";

export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children?: import("react").ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    const sessionToken = getStoredAdminSessionToken();

    setPending(true);

    try {
      if (sessionToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionToken }),
        });
      }
    } finally {
      clearStoredAdminSessionToken();
      setPending(false);
      router.replace("/login");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={className}
    >
      {pending ? "Saindo..." : children ?? "Sair"}
    </button>
  );
}
