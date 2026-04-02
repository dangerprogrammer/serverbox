'use server';

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { PlanTier, type CondominiumPlan } from "@/lib/domain/condominium-plan";

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

function revalidateManagementViews() {
  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

function getAllowedTier(value: string) {
  const allowedTiers = new Set<string>(Object.values(PlanTier));

  return allowedTiers.has(value) ? (value as PlanTier) : PlanTier.CUSTOM;
}

function getPlansWithFallback(plans: CondominiumPlan[] | null | undefined) {
  return Array.isArray(plans) ? plans : [];
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

  await condominiumRepository.save({
    name,
    city,
    state,
    courts: parsePositiveNumber(formData.get("courts"), 1) || 1,
    activeResidents: parsePositiveNumber(formData.get("activeResidents"), 0),
    plans: [],
    primaryAdmin: administrator,
  });

  revalidateManagementViews();
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
  revalidateManagementViews();
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
  revalidateManagementViews();
}

export async function createPlanAction(formData: FormData) {
  const administrator = await requireAuthenticatedAdmin();
  const condominiumId = String(formData.get("condominiumId") ?? "").trim();
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tierInput = String(formData.get("tier") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!condominiumId) {
    throw new Error("Condominio e obrigatorio para criar o plano.");
  }

  if (!name || !description || !slug) {
    throw new Error("Nome, slug e descricao sao obrigatorios.");
  }

  const condominium = await condominiumRepository.findOneBy({ id: condominiumId });

  if (!condominium) {
    throw new Error("Condominio nao encontrado.");
  }

  const existingPlans = getPlansWithFallback(condominium.plans);
  const existing = existingPlans.find((plan) => plan.slug === slug);

  if (existing) {
    throw new Error("Ja existe um plano com esse slug nesse condominio.");
  }

  condominium.plans = [
    ...existingPlans,
    {
      id: randomUUID(),
      slug,
      name,
      description,
      tier: getAllowedTier(tierInput),
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
      isActive: true,
      createdByAdminId: administrator.id,
      createdByName: administrator.name,
    },
  ];

  await condominiumRepository.save(condominium);

  revalidateManagementViews();
}

export async function updatePlanAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano invalido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const condominiums = await condominiumRepository.find();
  const condominium = condominiums.find((entry) =>
    getPlansWithFallback(entry.plans).some((plan) => plan.id === planId),
  );

  if (!condominium) {
    throw new Error("Plano nao encontrado.");
  }

  const plans = getPlansWithFallback(condominium.plans);
  const existing = plans.find((plan) => plan.id === planId);

  if (!existing) {
    throw new Error("Plano nao encontrado.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!name || !description || !requestedSlug) {
    throw new Error("Nome, slug e descricao sao obrigatorios.");
  }

  const duplicate = plans.find((plan) => plan.slug === requestedSlug);

  if (duplicate && duplicate.id !== existing.id) {
    throw new Error("Ja existe um plano com esse slug nesse condominio.");
  }

  const tierInput = String(formData.get("tier") ?? existing.tier).trim();

  condominium.plans = plans.map((plan) =>
    plan.id === existing.id
      ? {
          ...plan,
          name,
          slug: requestedSlug,
          description,
          tier: getAllowedTier(tierInput),
          monthlyBallAllowance: parsePositiveNumber(
            formData.get("monthlyBallAllowance"),
            existing.monthlyBallAllowance,
          ),
          monthlyPriceInCents: parsePositiveNumber(
            formData.get("monthlyPriceInCents"),
            existing.monthlyPriceInCents,
          ),
          overagePriceInCents: parsePositiveNumber(
            formData.get("overagePriceInCents"),
            existing.overagePriceInCents,
          ),
        }
      : plan,
  );

  await condominiumRepository.save(condominium);
  revalidateManagementViews();
}

export async function deletePlanAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano invalido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const condominiums = await condominiumRepository.find();
  const condominium = condominiums.find((entry) =>
    getPlansWithFallback(entry.plans).some((plan) => plan.id === planId),
  );

  if (!condominium) {
    throw new Error("Plano nao encontrado.");
  }

  condominium.plans = getPlansWithFallback(condominium.plans).filter(
    (plan) => plan.id !== planId,
  );

  await condominiumRepository.save(condominium);
  revalidateManagementViews();
}
