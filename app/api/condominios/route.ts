import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import { CondominiumPlanEntity } from "@/lib/db/entities/condominium-plan.entity";
import type { Plan } from "@/lib/db/entities/plan.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";

type CreateCondominiumPayload = {
  name?: string;
  city?: string;
  state?: string;
  courts?: number;
  activeResidents?: number;
  adminEmail?: string;
  adminName?: string;
  customPlanIds?: string[];
  includeDefaultPlans?: boolean;
};

export async function GET() {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
      planAssignments: { plan: true },
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
      plans: condominium.planAssignments.map((assignment) => ({
        id: assignment.plan.id,
        slug: assignment.plan.slug,
        name: assignment.plan.name,
        tier: assignment.plan.tier,
        isDefault: assignment.plan.isDefault,
      })),
    })),
  );
}

export async function POST(request: Request) {
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
  const planRepository = dataSource.getRepository(PlanEntity);
  const condominiumPlanRepository =
    dataSource.getRepository(CondominiumPlanEntity);

  let administrator = payload.adminEmail
    ? await administratorRepository.findOneBy({
        email: payload.adminEmail.trim().toLowerCase(),
      })
    : await administratorRepository.findOne({
        order: { createdAt: "ASC" },
      });

  if (!administrator && payload.adminEmail) {
    administrator = await administratorRepository.save({
      name: payload.adminName?.trim() || "Administrador",
      email: payload.adminEmail.trim().toLowerCase(),
    });
  }

  if (!administrator) {
    return Response.json(
      { error: "Nao foi possivel resolver um administrador para o condominio." },
      { status: 400 },
    );
  }

  const condominium = condominiumRepository.create({
    name: payload.name.trim(),
    city: payload.city.trim(),
    state: payload.state.trim().toUpperCase().slice(0, 2),
    courts: payload.courts && payload.courts > 0 ? payload.courts : 1,
    activeResidents:
      payload.activeResidents && payload.activeResidents >= 0
        ? payload.activeResidents
        : 0,
    primaryAdmin: administrator,
  });

  const savedCondominium = await condominiumRepository.save(condominium);
  const defaultPlans =
    payload.includeDefaultPlans === false
      ? []
      : await planRepository.findBy({ isDefault: true });
  const customPlans =
    payload.customPlanIds && payload.customPlanIds.length > 0
      ? await planRepository.findByIds(payload.customPlanIds)
      : [];
  const uniquePlans = [...defaultPlans, ...customPlans].reduce<Plan[]>(
    (plans, currentPlan) =>
      plans.some((plan) => plan.id === currentPlan.id)
        ? plans
        : [...plans, currentPlan],
    [],
  );

  if (uniquePlans.length > 0) {
    await condominiumPlanRepository.save(
      uniquePlans.map((plan, index) => ({
        condominium: savedCondominium,
        plan,
        isFeatured: index === 0,
      })),
    );
  }

  return Response.json(
    {
      id: savedCondominium.id,
      name: savedCondominium.name,
      city: savedCondominium.city,
      state: savedCondominium.state,
      administrator: {
        id: administrator.id,
        name: administrator.name,
        email: administrator.email,
      },
      assignedPlanCount: uniquePlans.length,
    },
    { status: 201 },
  );
}
