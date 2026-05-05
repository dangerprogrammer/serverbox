import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDataSource } from "@/lib/db/data-source";
import {
  AdministratorEntity,
  type Administrator,
} from "@/lib/db/entities/administrator.entity";
import { AdminSessionEntity, type AdminSession } from "@/lib/db/entities/admin-session.entity";

const SESSION_COOKIE_NAME = "serverbox_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  adminId: string;
  role: "admin";
  expiresAt: number;
};

function getSessionCookieDomain() {
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim();

  if (!domain) {
    return undefined;
  }

  return domain.replace(/^\.+/, "");
}

function getSessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    secure:
      process.env.SESSION_COOKIE_SECURE?.trim() === "false"
        ? false
        : process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
    domain: getSessionCookieDomain(),
  };
}

export async function createAdminSession(adminId: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const sessionId = randomUUID();

  const dataSource = await getDataSource();
  const sessionRepo = dataSource.getRepository(AdminSessionEntity);

  await sessionRepo.save({
    id: sessionId,
    adminId,
    expiresAt: new Date(expiresAt),
  } as AdminSession);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(expiresAt));
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    try {
      const dataSource = await getDataSource();
      const sessionRepo = dataSource.getRepository(AdminSessionEntity);

      await sessionRepo.delete({ id: sessionId });
    } catch {
      // ignore DB errors during cleanup
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(Date.now() - 1000),
    maxAge: 0,
  });
}

export async function readAdminSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const dataSource = await getDataSource();
    const sessionRepo = dataSource.getRepository(AdminSessionEntity);

    const entry = await sessionRepo.findOneBy({ id: sessionId });

    if (!entry) return null;

    if (entry.expiresAt.getTime() <= Date.now()) {
      // expired
      await sessionRepo.delete({ id: sessionId });
      return null;
    }

    return {
      adminId: entry.adminId,
      role: "admin",
      expiresAt: entry.expiresAt.getTime(),
    } as SessionPayload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedAdmin(): Promise<Administrator | null> {
  const session = await readAdminSession();

  if (!session?.adminId) {
    return null;
  }

  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);

  return administratorRepository.findOneBy({ id: session.adminId });
}

export async function requireAuthenticatedAdmin() {
  const administrator = await getAuthenticatedAdmin();

  if (!administrator) {
    redirect("/login");
  }

  return administrator;
}

export async function requireAdminApiSession() {
  const administrator = await getAuthenticatedAdmin();

  if (!administrator) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  return administrator;
}
