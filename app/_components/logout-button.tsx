"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ADMIN_SESSION_STORAGE_KEY } from "@/lib/auth/session-constants";

function getSessionToken() {
  return localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "";
}

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
    const sessionToken = getSessionToken();

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
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
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
