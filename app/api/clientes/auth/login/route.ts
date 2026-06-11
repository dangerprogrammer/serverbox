import "server-only";

import { NextResponse } from "next/server";

import {
  createCondominiumClientSession,
  getClientSessionCookieOptions,
} from "@/lib/auth/client-session";
import { verifyPassword } from "@/lib/auth/password";
import { CLIENT_SESSION_COOKIE_NAME } from "@/lib/auth/session-constants";
import { getDataSource } from "@/lib/db/data-source";
import { CondominiumClientAccessEntity } from "@/lib/db/entities/condominium-client-access.entity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!username || !password) {
      return Response.json(
        { error: "Informe usuario e senha para entrar." },
        { status: 400 },
      );
    }

    const dataSource = await getDataSource();
    const accessRepository = dataSource.getRepository(
      CondominiumClientAccessEntity,
    );
    const access = await accessRepository.findOne({
      where: {
        username,
        isActive: true,
      },
      relations: {
        condominium: true,
      },
    });

    if (!access || !verifyPassword(password, access.passwordHash)) {
      return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
    }

    const session = await createCondominiumClientSession(
      access.id,
      access.condominium.id,
    );
    const response = NextResponse.json({
      authenticated: true,
      redirectTo: "/cliente/dashboard",
      condominium: {
        id: access.condominium.id,
        name: access.condominium.name,
      },
    });

    response.cookies.set(
      CLIENT_SESSION_COOKIE_NAME,
      session.sessionToken,
      getClientSessionCookieOptions(session.expiresAt),
    );

    return response;
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao entrar." },
      { status: 500 },
    );
  }
}
