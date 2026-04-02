import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { requireAdminApiSession } from "@/lib/auth/session";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";

type CreateCondominiumPayload = {
  name?: string;
  city?: string;
  state?: string;
  courts?: number;
  activeResidents?: number;
  adminEmail?: string;
  adminName?: string;
};

export async function GET() {
  const administrator = await requireAdminApiSession();

  if (administrator instanceof Response) {
    return administrator;
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
    },
    order: {
      createdAt: "DESC",
    },
  });

  return Response.json(
    condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      courts: condominium.courts,
      activeResidents: condominium.activeResidents,
      createdAt: condominium.createdAt,
      administrator: {
        id: condominium.primaryAdmin.id,
        name: condominium.primaryAdmin.name,
        email: condominium.primaryAdmin.email,
      },
      plans: condominium.plans.map((plan) => ({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        tier: plan.tier,
      })),
    })),
  );
}

export async function POST(request: Request) {
  const administrator = await requireAdminApiSession();

  if (administrator instanceof Response) {
    return administrator;
  }

  const payload = (await request.json()) as CreateCondominiumPayload;

  if (!payload.name || !payload.city || !payload.state) {
    return Response.json(
      { error: "name, city e state sao obrigatorios." },
      { status: 400 },
    );
  }

  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  let assignedAdministrator = payload.adminEmail
    ? await administratorRepository.findOneBy({
        email: payload.adminEmail.trim().toLowerCase(),
      })
    : await administratorRepository.findOne({
        order: { createdAt: "ASC" },
      });

  if (!assignedAdministrator && payload.adminEmail) {
    assignedAdministrator = await administratorRepository.save({
      name: payload.adminName?.trim() || "Administrador",
      email: payload.adminEmail.trim().toLowerCase(),
    });
  }

  if (!assignedAdministrator) {
    return Response.json(
      { error: "Nao foi possivel resolver um administrador para o condominio." },
      { status: 400 },
    );
  }

  const savedCondominium = await condominiumRepository.save({
    name: payload.name.trim(),
    city: payload.city.trim(),
    state: payload.state.trim().toUpperCase().slice(0, 2),
    courts: payload.courts && payload.courts > 0 ? payload.courts : 1,
    activeResidents:
      payload.activeResidents && payload.activeResidents >= 0
        ? payload.activeResidents
        : 0,
    primaryAdmin: assignedAdministrator,
  });

  return Response.json(
    {
      id: savedCondominium.id,
      name: savedCondominium.name,
      city: savedCondominium.city,
      state: savedCondominium.state,
      administrator: {
        id: assignedAdministrator.id,
        name: assignedAdministrator.name,
        email: assignedAdministrator.email,
      },
    },
    { status: 201 },
  );
}
