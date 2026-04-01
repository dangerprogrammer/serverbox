'use server';

import { revalidatePath } from "next/cache";

import { requireAuthenticatedAdmin } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
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

function revalidateManagementViews() {
  revalidatePath("/gerenciar-condominios");
  revalidatePath("/dashboard");
  revalidatePath("/");
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
  const planRepository = dataSource.getRepository(PlanEntity);
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

  const existing = await planRepository.findOne({
    where: {
      condominium: { id: condominiumId },
      slug,
    },
    relations: {
      condominium: true,
    },
  });

  if (existing) {
    throw new Error("Ja existe um plano com esse slug nesse condominio.");
  }

  const allowedTiers = new Set<string>(Object.values(PlanTier));

  await planRepository.save({
    condominium,
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
    isActive: true,
    createdBy: administrator,
  });

  revalidateManagementViews();
}

export async function updatePlanAction(formData: FormData) {
  await requireAuthenticatedAdmin();

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano invalido.");
  }

  const dataSource = await getDataSource();
  const planRepository = dataSource.getRepository(PlanEntity);
  const existing = await planRepository.findOne({
    where: { id: planId },
    relations: {
      condominium: true,
    },
  });

  if (!existing) {
    throw new Error("Plano nao encontrado.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!name || !description || !requestedSlug) {
    throw new Error("Nome, slug e descricao sao obrigatorios.");
  }

  const duplicate = await planRepository.findOne({
    where: {
      condominium: { id: existing.condominium.id },
      slug: requestedSlug,
    },
    relations: {
      condominium: true,
    },
  });

  if (duplicate && duplicate.id !== existing.id) {
    throw new Error("Ja existe um plano com esse slug nesse condominio.");
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

  await planRepository.save(existing);
  revalidateManagementViews();
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
  revalidateManagementViews();
}
