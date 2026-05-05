import "server-only";

import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      return Response.json(
        { error: "Informe email e senha para entrar." },
        { status: 400 },
      );
    }

    const dataSource = await getDataSource();
    const administratorRepository = dataSource.getRepository(AdministratorEntity);
    const administrator = await administratorRepository.findOneBy({ email });

    if (!administrator || !verifyPassword(password, administrator.passwordHash)) {
      return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const session = await createAdminSession(administrator.id);

    return Response.json({
      sessionToken: session.sessionToken,
      administrator: {
        id: administrator.id,
        name: administrator.name,
        email: administrator.email,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao entrar." },
      { status: 500 },
    );
  }
}
