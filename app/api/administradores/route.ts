import { hashPassword } from "@/lib/auth/password";
import {
  getAuthenticatedAdminFromToken,
  getSessionTokenFromRequest,
} from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import {
  AdministratorEntity,
  type Administrator,
} from "@/lib/db/entities/administrator.entity";

type CreateAdministratorPayload = {
  name?: string;
  email?: string;
  password?: string;
};

export async function GET(request: Request) {
  const administrator = await getAuthenticatedAdminFromToken(
    getSessionTokenFromRequest(request),
  );

  if (!administrator) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);

  const administrators = await administratorRepository.find({
    relations: {
      condominiums: true,
    },
    order: {
      createdAt: "ASC",
    },
  });

  return Response.json(
    administrators.map((entry: Administrator) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      condominiumCount: entry.condominiums.length,
      createdPlanCount: entry.condominiums.reduce(
        (total, condominium) => total + condominium.plans.length,
        0,
      ),
    })),
  );
}

export async function POST(request: Request) {
  const authenticatedAdministrator = await getAuthenticatedAdminFromToken(
    getSessionTokenFromRequest(request),
  );

  if (!authenticatedAdministrator) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json()) as CreateAdministratorPayload;

  if (!payload.name || !payload.email) {
    return Response.json(
      { error: "name e email sao obrigatorios." },
      { status: 400 },
    );
  }

  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const normalizedEmail = payload.email.trim().toLowerCase();

  const existingAdministrator = await administratorRepository.findOneBy({
    email: normalizedEmail,
  });

  if (existingAdministrator) {
    return Response.json(
      { error: "Já existe um administrador com esse email." },
      { status: 409 },
    );
  }

  const administrator = await administratorRepository.save({
    name: payload.name.trim(),
    email: normalizedEmail,
    passwordHash: payload.password?.trim()
      ? hashPassword(payload.password.trim())
      : null,
  });

  return Response.json(administrator, { status: 201 });
}
