import { getDataSource } from "@/lib/db/data-source";
import { requireAdminApiSession } from "@/lib/auth/session";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { PlanTier } from "@/lib/domain/condominium-plan";

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
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
    },
    order: {
      createdAt: "ASC",
    },
  });

  return Response.json(
    condominiums
      .flatMap((condominium) =>
        condominium.plans.map((plan) => ({
          id: plan.id,
          condominiumId: condominium.id,
          condominiumName: condominium.name,
          slug: plan.slug,
          name: plan.name,
          tier: plan.tier,
          description: plan.description,
          monthlyBallAllowance: plan.monthlyBallAllowance,
          monthlyPriceInCents: plan.monthlyPriceInCents,
          overagePriceInCents: plan.overagePriceInCents,
          createdBy: plan.createdByAdminId
            ? {
                id: plan.createdByAdminId,
                name: plan.createdByName ?? condominium.primaryAdmin.name,
                email: condominium.primaryAdmin.email,
              }
            : null,
        })),
      )
      .sort((left, right) => left.monthlyPriceInCents - right.monthlyPriceInCents),
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
  const slug = normalizeSlug(payload.slug ?? payload.name);
  const condominium = await condominiumRepository.findOneBy({
    id: payload.condominiumId,
  });

  if (!condominium) {
    return Response.json({ error: "Condominio nao encontrado." }, { status: 404 });
  }

  const existingPlan = condominium.plans.find((plan) => plan.slug === slug);

  if (existingPlan) {
    return Response.json(
      { error: "Ja existe um plano com esse slug nesse condominio." },
      { status: 409 },
    );
  }

  const allowedTiers = new Set<string>(Object.values(PlanTier));

  const createdPlan = {
    id: crypto.randomUUID(),
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
    createdByAdminId: authenticatedAdministrator.id,
    createdByName: authenticatedAdministrator.name,
  };

  condominium.plans = [...condominium.plans, createdPlan];
  await condominiumRepository.save(condominium);

  return Response.json(createdPlan, { status: 201 });
}
