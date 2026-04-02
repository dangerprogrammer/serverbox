import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDataSource } from "@/lib/db/data-source";
import {
  AdministratorEntity,
  type Administrator,
} from "@/lib/db/entities/administrator.entity";

const SESSION_COOKIE_NAME = "serverbox_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  adminId: string;
  role: "admin";
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || null;
}

function requireSessionSecret() {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SESSION_SECRET nao configurado.");
  }

  return secret;
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", requireSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function decodePayload(encodedPayload: string) {
  try {
    return JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createAdminSession(adminId: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = encodePayload({
    adminId,
    role: "admin",
    expiresAt,
  });
  const signature = signPayload(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readAdminSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getAdminSessionFromRaw(rawSession);
}

export function getAdminSessionFromRaw(rawSession: string | undefined) {
  if (!rawSession) {
    return null;
  }

  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const [encodedPayload, signature] = rawSession.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(encodedPayload)
      .digest("base64url");
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length) {
      return null;
    }

    if (!timingSafeEqual(provided, expected)) {
      return null;
    }
  } catch {
    return null;
  }

  const payload = decodePayload(encodedPayload);

  if (!payload || payload.role !== "admin" || payload.expiresAt <= Date.now()) {
    return null;
  }

  return payload;
}

export const getAuthenticatedAdmin = cache(async (): Promise<Administrator | null> => {
  const session = await readAdminSession();

  if (!session?.adminId) {
    return null;
  }

  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);

  return administratorRepository.findOneBy({ id: session.adminId });
});

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
    return Response.json({ error: "Nao autenticado." }, { status: 401 });
  }

  return administrator;
}
