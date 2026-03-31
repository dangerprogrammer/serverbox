'use server';

import { revalidatePath } from "next/cache";

import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPlanEntity } from "@/lib/db/entities/condominium-plan.entity";
import { PlanEntity, PlanTier } from "@/lib/db/entities/plan.entity";

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePositiveNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePlanIds(formData: FormData) {
  return formData
    .getAll("planIds")
    .map((value) => String(value))
    .filter(Boolean);
}

async function syncCondominiumPlans(condominiumId: string, planIds: string[]) {
  const dataSource = await getDataSource();
  const condominiumPlanRepository =
    dataSource.getRepository(CondominiumPlanEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const condominium = await condominiumRepository.findOneBy({ id: condominiumId });

  if (!condominium) {
    throw new Error("Condominio nao encontrado.");
  }

  await condominiumPlanRepository
    .createQueryBuilder()
    .delete()
    .from("condominium_plans")
    .where("condominiumId = :condominiumId", { condominiumId })
    .execute();

  if (planIds.length === 0) {
    return;
  }

  const plans = await planRepository.findByIds(planIds);

  await condominiumPlanRepository.save(
    plans.map((plan, index) => ({
      condominium,
      plan,
      isFeatured: index === 0,
    })),
  );
}

export async function createCondominiumAction(formData: FormData) {
  const administrator = await requireAuthenticatedAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);

  if (!name || !city || !state) {
    throw new Error("Nome, cidade e UF sao obrigatorios.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planIds = parsePlanIds(formData);

  const condominium = await condominiumRepository.save({
    name,
    city,
    state,
    courts: parsePositiveNumber(formData.get("courts"), 1) || 1,
    activeResidents: parsePositiveNumber(formData.get("activeResidents"), 0),
    primaryAdmin: administrator,
  });

  await syncCondominiumPlans(condominium.id, planIds);
  revalidatePath("/gerenciar-condominios");
}

export async function updateCondominiumAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const condominiumId = String(formData.get("condominiumId") ?? "");

  if (!condominiumId) {
    throw new Error("Condominio invalido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const existing = await condominiumRepository.findOneBy({ id: condominiumId });

  if (!existing) {
    throw new Error("Condominio nao encontrado.");
  }

  existing.name = String(formData.get("name") ?? "").trim();
  existing.city = String(formData.get("city") ?? "").trim();
  existing.state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  existing.courts = parsePositiveNumber(formData.get("courts"), 1) || 1;
  existing.activeResidents = parsePositiveNumber(
    formData.get("activeResidents"),
    0,
  );

  await condominiumRepository.save(existing);
  await syncCondominiumPlans(condominiumId, parsePlanIds(formData));
  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function deleteCondominiumAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const condominiumId = String(formData.get("condominiumId") ?? "");

  if (!condominiumId) {
    throw new Error("Condominio invalido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  await condominiumRepository.delete({ id: condominiumId });
  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function createPlanAction(formData: FormData) {
  const administrator = await requireAuthenticatedAdmin();
  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tierInput = String(formData.get("tier") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!name || !description || !slug) {
    throw new Error("Nome, slug e descricao sao obrigatorios.");
  }

  const existing = await planRepository.findOneBy({ slug });

  if (existing) {
    throw new Error("Ja existe um plano com esse slug.");
  }

  const allowedTiers = new Set<string>(Object.values(PlanTier));

  await planRepository.save({
    slug,
    name,
    description,
    tier: allowedTiers.has(tierInput)
      ? (tierInput as PlanTier)
      : PlanTier.CUSTOM,
    monthlyBallAllowance: parsePositiveNumber(
      formData.get("monthlyBallAllowance"),
      0,
    ),
    monthlyPriceInCents: parsePositiveNumber(
      formData.get("monthlyPriceInCents"),
      0,
    ),
    overagePriceInCents: parsePositiveNumber(
      formData.get("overagePriceInCents"),
      0,
    ),
    isDefault: formData.get("isDefault") === "on",
    isActive: true,
    createdBy: administrator,
  });

  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function updatePlanAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano invalido.");
  }

  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);
  const existing = await planRepository.findOneBy({ id: planId });

  if (!existing) {
    throw new Error("Plano nao encontrado.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!name || !description || !requestedSlug) {
    throw new Error("Nome, slug e descricao sao obrigatorios.");
  }

  const duplicate = await planRepository.findOneBy({ slug: requestedSlug });

  if (duplicate && duplicate.id !== existing.id) {
    throw new Error("Ja existe um plano com esse slug.");
  }

  const tierInput = String(formData.get("tier") ?? existing.tier).trim();
  const allowedTiers = new Set<string>(Object.values(PlanTier));

  existing.name = name;
  existing.slug = requestedSlug;
  existing.description = description;
  existing.tier = allowedTiers.has(tierInput)
    ? (tierInput as PlanTier)
    : PlanTier.CUSTOM;
  existing.monthlyBallAllowance = parsePositiveNumber(
    formData.get("monthlyBallAllowance"),
    existing.monthlyBallAllowance,
  );
  existing.monthlyPriceInCents = parsePositiveNumber(
    formData.get("monthlyPriceInCents"),
    existing.monthlyPriceInCents,
  );
  existing.overagePriceInCents = parsePositiveNumber(
    formData.get("overagePriceInCents"),
    existing.overagePriceInCents,
  );
  existing.isDefault = formData.get("isDefault") === "on";

  await planRepository.save(existing);
  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function deletePlanAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano invalido.");
  }

  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);

  await planRepository.delete({ id: planId });
  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
}
