import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { CLIENT_SESSION_COOKIE_NAME } from "@/lib/auth/session-constants";
import { getDataSource } from "@/lib/db/data-source";
import { CondominiumClientAccessEntity } from "@/lib/db/entities/condominium-client-access.entity";
import {
  CondominiumClientSessionEntity,
  type CondominiumClientSession,
} from "@/lib/db/entities/condominium-client-session.entity";

const CLIENT_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

export function getClientSessionCookieOptions(expiresAt?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expiresAt ? { expires: new Date(expiresAt) } : {}),
  };
}

export async function createCondominiumClientSession(
  accessId: string,
  condominiumId: string,
) {
  const expiresAt = Date.now() + CLIENT_SESSION_DURATION_MS;
  const sessionToken = randomUUID();

  const dataSource = await getDataSource();
  const sessionRepository = dataSource.getRepository(
    CondominiumClientSessionEntity,
  );

  await sessionRepository.save({
    id: sessionToken,
    accessId,
    condominiumId,
    expiresAt: new Date(expiresAt),
  } as CondominiumClientSession);

  return {
    sessionToken,
    expiresAt,
  };
}

export async function deleteCondominiumClientSession(sessionToken: string) {
  if (!sessionToken) {
    return;
  }

  const dataSource = await getDataSource();
  const sessionRepository = dataSource.getRepository(
    CondominiumClientSessionEntity,
  );

  await sessionRepository.delete({ id: sessionToken });
}

export async function getCondominiumClientSessionTokenFromCookies() {
  const cookieStore = await cookies();

  return cookieStore.get(CLIENT_SESSION_COOKIE_NAME)?.value.trim() || null;
}

export async function clearCondominiumClientSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(CLIENT_SESSION_COOKIE_NAME);
}

export async function getAuthenticatedCondominiumClientFromToken(
  sessionToken: string | null | undefined,
) {
  if (!sessionToken) {
    return null;
  }

  const dataSource = await getDataSource();
  const sessionRepository = dataSource.getRepository(
    CondominiumClientSessionEntity,
  );
  const session = await sessionRepository.findOneBy({ id: sessionToken });

  if (!session) {
    return null;
  }

  if (isExpired(session.expiresAt)) {
    await sessionRepository.delete({ id: sessionToken });
    return null;
  }

  const accessRepository = dataSource.getRepository(
    CondominiumClientAccessEntity,
  );
  const access = await accessRepository.findOne({
    where: {
      id: session.accessId,
      isActive: true,
    },
    relations: {
      condominium: true,
    },
  });

  if (!access || access.condominium.id !== session.condominiumId) {
    await sessionRepository.delete({ id: sessionToken });
    return null;
  }

  return {
    accessId: access.id,
    username: access.username,
    displayName: access.displayName,
    condominiumId: access.condominium.id,
    condominiumName: access.condominium.name,
    expiresAt: session.expiresAt.getTime(),
  };
}

export async function getAuthenticatedCondominiumClientFromCookies() {
  return getAuthenticatedCondominiumClientFromToken(
    await getCondominiumClientSessionTokenFromCookies(),
  );
}
