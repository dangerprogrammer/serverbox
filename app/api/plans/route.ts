import { getDataSource } from "@/lib/db/data-source";
import { requireAdminApiSession } from "@/lib/auth/session";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { PlanEntity, PlanTier, type Plan } from "@/lib/db/entities/plan.entity";

type CreatePlanPayload = {
  condominiumId?: string;
  name?: string;
  slug?: string;
  description?: string;
  monthlyBallAllowance?: number;
  monthlyPriceInCents?: number;
  overagePriceInCents?: number;
  tier?: string;
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
      condominium: true,
      createdBy: true,
    },
    order: {
      monthlyPriceInCents: "ASC",
    },
  });

  return Response.json(
    plans.map((plan: Plan) => ({
      id: plan.id,
      condominiumId: plan.condominium.id,
      condominiumName: plan.condominium.name,
      slug: plan.slug,
      name: plan.name,
      tier: plan.tier,
      description: plan.description,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      overagePriceInCents: plan.overagePriceInCents,
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

  if (!payload.condominiumId || !payload.name || !payload.description) {
    return Response.json(
      { error: "condominiumId, name e description sao obrigatorios." },
      { status: 400 },
    );
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const slug = normalizeSlug(payload.slug ?? payload.name);
  const condominium = await condominiumRepository.findOneBy({
    id: payload.condominiumId,
  });

  if (!condominium) {
    return Response.json({ error: "Condominio nao encontrado." }, { status: 404 });
  }

  const existingPlan = await planRepository.findOne({
    where: {
      condominium: { id: payload.condominiumId },
      slug,
    },
    relations: {
      condominium: true,
    },
  });

  if (existingPlan) {
    return Response.json(
      { error: "Ja existe um plano com esse slug nesse condominio." },
      { status: 409 },
    );
  }

  const allowedTiers = new Set<string>(Object.values(PlanTier));

  const createdPlan = await planRepository.save({
    condominium,
    slug,
    name: payload.name.trim(),
    description: payload.description.trim(),
    tier: allowedTiers.has(String(payload.tier ?? "").trim())
      ? (String(payload.tier) as PlanTier)
      : PlanTier.CUSTOM,
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
    isActive: true,
    createdBy: authenticatedAdministrator,
  });

  return Response.json(createdPlan, { status: 201 });
}
