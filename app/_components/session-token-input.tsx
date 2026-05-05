"use client";

import { useEffect, useState } from "react";

import { ADMIN_SESSION_STORAGE_KEY } from "@/lib/auth/session-constants";

export function SessionTokenInput() {
  const [sessionToken, setSessionToken] = useState("");

  useEffect(() => {
    setSessionToken(localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "");
  }, []);

  if (!sessionToken) {
    return null;
  }

  return <input type="hidden" name="sessionToken" value={sessionToken} />;
}
