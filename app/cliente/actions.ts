'use server';

import { redirect } from "next/navigation";

import {
  clearCondominiumClientSessionCookie,
  deleteCondominiumClientSession,
  getCondominiumClientSessionTokenFromCookies,
} from "@/lib/auth/client-session";

export async function logoutCondominiumClientAction() {
  const sessionToken = await getCondominiumClientSessionTokenFromCookies();

  if (sessionToken) {
    await deleteCondominiumClientSession(sessionToken);
  }

  await clearCondominiumClientSessionCookie();
  redirect("/cliente/login");
}
