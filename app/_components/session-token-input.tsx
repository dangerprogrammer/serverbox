"use client";

import { useStoredAdminSessionToken } from "@/app/_components/admin-session-storage";

export function SessionTokenInput() {
  const sessionToken = useStoredAdminSessionToken();

  if (!sessionToken) {
    return null;
  }

  return <input type="hidden" name="sessionToken" value={sessionToken} />;
}
