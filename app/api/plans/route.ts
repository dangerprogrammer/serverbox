import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { requireAdminApiSession } from "@/lib/auth/session";
import { PlanEntity, PlanTier, type Plan } from "@/lib/db/entities/plan.entity";

type CreatePlanPayload = {
  name?: string;
  slug?: string;
  description?: string;
  monthlyBallAllowance?: number;
  monthlyPriceInCents?: number;
  overagePriceInCents?: number;
  tier?: string;
  adminEmail?: string;
  adminName?: string;
  isDefault?: boolean;
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const administrator = await requireAdminApiSession();

  if (administrator instanceof Response) {
    return administrator;
  }

  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);

  const plans = await planRepository.find({
    relations: {
      condominiumPlans: true,
      createdBy: true,
    },
    order: {
      monthlyPriceInCents: "ASC",
    },
  });

  return Response.json(
    plans.map((plan: Plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      tier: plan.tier,
      description: plan.description,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      overagePriceInCents: plan.overagePriceInCents,
      isDefault: plan.isDefault,
      condominiumCount: plan.condominiumPlans.length,
      createdBy: plan.createdBy
        ? {
            id: plan.createdBy.id,
            name: plan.createdBy.name,
            email: plan.createdBy.email,
          }
        : null,
    })),
  );
}

export async function POST(request: Request) {
  const authenticatedAdministrator = await requireAdminApiSession();

  if (authenticatedAdministrator instanceof Response) {
    return authenticatedAdministrator;
  }

  const payload = (await request.json()) as CreatePlanPayload;

  if (!payload.name || !payload.description) {
    return Response.json(
      { error: "name e description sao obrigatorios." },
      { status: 400 },
    );
  }

  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const slug = normalizeSlug(payload.slug ?? payload.name);

  const existingPlan = await planRepository.findOneBy({ slug });
  if (existingPlan) {
    return Response.json(
      { error: "Ja existe um plano com esse slug." },
      { status: 409 },
    );
  }

  let assignedAdministrator = null;
  const isDefault = Boolean(payload.isDefault);
  const tier = isDefault
    ? payload.tier === PlanTier.INTERMEDIATE || payload.tier === PlanTier.PREMIUM
      ? payload.tier
      : PlanTier.BASIC
    : PlanTier.CUSTOM;

  if (!isDefault) {
    if (!payload.adminEmail) {
      return Response.json(
        { error: "Planos personalizados exigem adminEmail." },
        { status: 400 },
      );
    }

    assignedAdministrator = await administratorRepository.findOneBy({
      email: payload.adminEmail.trim().toLowerCase(),
    });

    if (!assignedAdministrator) {
      assignedAdministrator = await administratorRepository.save({
        name: payload.adminName?.trim() || "Administrador",
        email: payload.adminEmail.trim().toLowerCase(),
      });
    }
  }

  const createdPlan = await planRepository.save({
    slug,
    name: payload.name.trim(),
    description: payload.description.trim(),
    tier,
    monthlyBallAllowance:
      payload.monthlyBallAllowance && payload.monthlyBallAllowance > 0
        ? payload.monthlyBallAllowance
        : 0,
    monthlyPriceInCents:
      payload.monthlyPriceInCents && payload.monthlyPriceInCents >= 0
        ? payload.monthlyPriceInCents
        : 0,
    overagePriceInCents:
      payload.overagePriceInCents && payload.overagePriceInCents >= 0
        ? payload.overagePriceInCents
        : 0,
    isDefault,
    isActive: true,
    createdBy: assignedAdministrator,
  });

  return Response.json(createdPlan, { status: 201 });
}
