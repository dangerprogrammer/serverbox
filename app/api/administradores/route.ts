import { getDataSource } from "@/lib/db/data-source";
import { requireAdminApiSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import {
  AdministratorEntity,
  type Administrator,
} from "@/lib/db/entities/administrator.entity";

type CreateAdministratorPayload = {
  name?: string;
  email?: string;
  password?: string;
};

export async function GET() {
  const administrator = await requireAdminApiSession();

  if (administrator instanceof Response) {
    return administrator;
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
    administrators.map((administrator: Administrator) => ({
      id: administrator.id,
      name: administrator.name,
      email: administrator.email,
      condominiumCount: administrator.condominiums.length,
      createdPlanCount: administrator.condominiums.reduce(
        (total, condominium) => total + condominium.plans.length,
        0,
      ),
    })),
  );
}

export async function POST(request: Request) {
  const authenticatedAdministrator = await requireAdminApiSession();

  if (authenticatedAdministrator instanceof Response) {
    return authenticatedAdministrator;
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
      { error: "Ja existe um administrador com esse email." },
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
