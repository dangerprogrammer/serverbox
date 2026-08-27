'use server';

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedAdminFromFormData } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { getDataSource } from "@/lib/db/data-source";
import { CondominiumClientAccessEntity } from "@/lib/db/entities/condominium-client-access.entity";
import { CondominiumClientSessionEntity } from "@/lib/db/entities/condominium-client-session.entity";
import { CondominiumCourtEntity } from "@/lib/db/entities/condominium-court.entity";
import type { CondominiumCourt } from "@/lib/db/entities/condominium-court.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { TubeBrandEntity, type TubeBrand } from "@/lib/db/entities/tube-brand.entity";
import { PlanTier, type CondominiumPlan } from "@/lib/domain/condominium-plan";
import {
  getActiveTubeStockEntries,
  getTubeStockEntries,
  sumTubeStockEntries,
  type TubeStockEntry,
} from "@/lib/domain/tube-stock";
import { In, type DataSource } from "typeorm";

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function parsePositiveNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseCurrencyToCents(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string") {
    return fallback;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return fallback;
  }

  const parsed = Number(digits);

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

function validateClientAccessUsername(username: string) {
  if (username.length < 3) {
    throw new Error("Usuario deve ter pelo menos 3 caracteres.");
  }

  if (!/^[a-z0-9._@-]+$/.test(username)) {
    throw new Error(
      "Usuario deve usar apenas letras, numeros, ponto, hifen, underline ou @.",
    );
  }
}

type CourtEntry = {
  name: string;
  sortOrder: number;
  tubeBrand: TubeBrand;
  tubeBrands: TubeBrand[];
};

function parseCourtRequests(formData: FormData) {
  const courtKeys = formData.getAll("courtKey").map((value) => String(value));
  const courtNames = formData.getAll("courtName");

  if (courtKeys.length > 0) {
    return courtKeys
      .map((courtKey, index) => ({
        name: String(courtNames[index] ?? "").trim() || `Quadra ${index + 1}`,
        tubeBrandIds: formData
          .getAll(`tubeBrandIds:${courtKey}`)
          .map((value) => String(value).trim())
          .filter(Boolean),
        sortOrder: index,
      }))
      .filter((court) => court.tubeBrandIds.length > 0);
  }

  const tubeBrandIds = formData.getAll("tubeBrandId");

  return courtNames
    .map((courtName, index) => ({
      name: String(courtName ?? "").trim() || `Quadra ${index + 1}`,
      tubeBrandIds: [String(tubeBrandIds[index] ?? "").trim()].filter(Boolean),
      sortOrder: index,
    }))
    .filter((court) => court.tubeBrandIds.length > 0);
}

async function parseCourtEntries(dataSource: DataSource, formData: FormData) {
  const requestedCourts = parseCourtRequests(formData);

  if (requestedCourts.length === 0) {
    throw new Error("Adicione ao menos uma quadra com marca de tubos.");
  }

  const requestedBrandIds = Array.from(
    new Set(requestedCourts.flatMap((court) => court.tubeBrandIds)),
  );
  const brandRepository = dataSource.getRepository(TubeBrandEntity);
  const brands = await brandRepository.find({
    where: {
      id: In(requestedBrandIds),
    },
  });
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));

  return requestedCourts.map((court) => {
    const tubeBrands = court.tubeBrandIds.map((brandId) => brandById.get(brandId));

    if (tubeBrands.some((tubeBrand) => !tubeBrand)) {
      throw new Error("Marca de tubos invalida para uma das quadras.");
    }

    const selectedTubeBrands = tubeBrands as TubeBrand[];

    return {
      name: court.name,
      sortOrder: court.sortOrder,
      tubeBrand: selectedTubeBrands[0],
      tubeBrands: selectedTubeBrands,
    } satisfies CourtEntry;
  });
}

async function parseTubeStockEntries(dataSource: DataSource, formData: FormData) {
  const stockBrandIds = formData
    .getAll("stockBrandId")
    .map((value) => String(value ?? "").trim());
  const stockQuantities = formData.getAll("stockQuantity");
  const requestedStockByBrandId = new Map<string, number>();

  stockBrandIds.forEach((tubeBrandId, index) => {
    const quantity = parsePositiveNumber(stockQuantities[index], 0);

    if (!tubeBrandId || quantity <= 0) {
      return;
    }

    requestedStockByBrandId.set(tubeBrandId, quantity);
  });

  if (requestedStockByBrandId.size === 0) {
    throw new Error("Adicione ao menos uma marca com quantidade de tubos.");
  }

  const brandRepository = dataSource.getRepository(TubeBrandEntity);
  const requestedBrandIds = Array.from(requestedStockByBrandId.keys());
  const brands = await brandRepository.find({
    where: {
      id: In(requestedBrandIds),
    },
  });
  const validBrandIds = new Set(brands.map((brand) => brand.id));

  if (requestedBrandIds.some((brandId) => !validBrandIds.has(brandId))) {
    throw new Error("Marca de tubos invalida para o estoque.");
  }

  return requestedBrandIds.map(
    (tubeBrandId) =>
      ({
        tubeBrandId,
        quantity: requestedStockByBrandId.get(tubeBrandId) ?? 0,
      }) satisfies TubeStockEntry,
  );
}

function getActiveCourtTubeStockEntries(
  stockEntries: TubeStockEntry[],
  courtEntries: CourtEntry[],
) {
  const activeStockEntries = getActiveTubeStockEntries(stockEntries, courtEntries);

  if (activeStockEntries.length === 0) {
    throw new Error("Adicione ao menos uma marca ativa com quantidade de tubos.");
  }

  return activeStockEntries;
}

async function replaceCondominiumCourts(
  dataSource: DataSource,
  condominium: { id: string },
  courts: CourtEntry[],
) {
  const courtRepository = dataSource.getRepository(CondominiumCourtEntity);

  await dataSource
    .createQueryBuilder()
    .delete()
    .from("condominium_court_tube_brands")
    .where(
      '"courtId" IN (SELECT id FROM condominium_courts WHERE "condominiumId" = :condominiumId)',
      { condominiumId: condominium.id },
    )
    .execute();

  await courtRepository
    .createQueryBuilder()
    .delete()
    .from("condominium_courts")
    .where("condominiumId = :condominiumId", { condominiumId: condominium.id })
    .execute();

  await courtRepository.save(
    courts.map((court) => ({
      name: court.name,
      sortOrder: court.sortOrder,
      condominium,
      tubeBrand: court.tubeBrand,
      tubeBrands: court.tubeBrands,
    })),
  );
}

export async function createTubeBrandAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Nome da marca e obrigatorio.");
  }

  const dataSource = await getDataSource();
  const brandRepository = dataSource.getRepository(TubeBrandEntity);
  const existingBrands = await brandRepository.find();
  const normalizedName = name.toLocaleLowerCase("pt-BR");
  const duplicate = existingBrands.find(
    (brand) => brand.name.toLocaleLowerCase("pt-BR") === normalizedName,
  );

  if (duplicate) {
    throw new Error("Esta marca ja esta cadastrada.");
  }

  await brandRepository.save({ name });
  revalidateManagementViews();
}

export type DeleteTubeBrandActionState = {
  success: boolean;
  message: string | null;
};

export async function deleteTubeBrandAction(
  _previousState: DeleteTubeBrandActionState,
  formData: FormData,
): Promise<DeleteTubeBrandActionState> {
  await requireAuthenticatedAdminFromFormData(formData);

  const tubeBrandId = String(formData.get("tubeBrandId") ?? "").trim();

  if (!tubeBrandId) {
    return {
      success: false,
      message: "Marca de tubos invalida.",
    };
  }

  const dataSource = await getDataSource();
  const brandRepository = dataSource.getRepository(TubeBrandEntity);
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const brand = await brandRepository.findOneBy({ id: tubeBrandId });

  if (!brand) {
    return {
      success: false,
      message: "Marca de tubos nao encontrada.",
    };
  }

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
      courtDetails: {
        tubeBrand: true,
        tubeBrands: true,
      },
    },
  });

  const blockedCourts: Array<{
    condominiumName: string;
    courtName: string;
  }> = [];
  const condominiumsToUpdate = new Set<string>();
  const courtsToUpdate: CondominiumCourt[] = [];

  condominiums.forEach((condominium) => {
    const currentStock = getTubeStockEntries(condominium.tubeStockByBrand);
    const nextStock = currentStock.filter(
      (entry) => entry.tubeBrandId !== tubeBrandId,
    );

    if (nextStock.length !== currentStock.length) {
      condominium.tubeStockByBrand = nextStock;
      condominiumsToUpdate.add(condominium.id);
    }

    condominium.courtDetails?.forEach((court) => {
      const currentBrands =
        court.tubeBrands && court.tubeBrands.length > 0
          ? court.tubeBrands
          : [court.tubeBrand];
      const remainingBrands = currentBrands.filter(
        (brandEntry) => brandEntry.id !== tubeBrandId,
      );

      if (remainingBrands.length === currentBrands.length) {
        return;
      }

      if (court.tubeBrand.id === tubeBrandId && remainingBrands.length === 0) {
        blockedCourts.push({
          condominiumName: condominium.name,
          courtName: court.name,
        });
        return;
      }

      if (court.tubeBrand.id === tubeBrandId) {
        court.tubeBrand = remainingBrands[0];
      }

      court.tubeBrands = remainingBrands;
      courtsToUpdate.push(court);
      condominiumsToUpdate.add(condominium.id);
    });
  });

  if (blockedCourts.length > 0) {
    const blockedSummary = blockedCourts
      .slice(0, 3)
      .map(({ condominiumName, courtName }) => `${condominiumName} / ${courtName}`)
      .join(", ");
    const remainingBlocked = blockedCourts.length - 3;

    return {
      success: false,
      message:
        `Não foi possível excluir automaticamente porque estas quadras ficariam sem marca: ${blockedSummary}${remainingBlocked > 0 ? ` e mais ${remainingBlocked}` : ""}. ` +
        "Adicione outra marca a essas quadras e tente novamente.",
    };
  }

  await dataSource.transaction(async (manager) => {
    if (condominiumsToUpdate.size > 0) {
      const condominiumsToSave = condominiums.filter((condominium) =>
        condominiumsToUpdate.has(condominium.id),
      );

      await manager.getRepository(CondominiumEntity).save(condominiumsToSave);
    }

    if (courtsToUpdate.length > 0) {
      await manager.getRepository(CondominiumCourtEntity).save(courtsToUpdate);
    }

    await manager.getRepository(TubeBrandEntity).delete({ id: tubeBrandId });
  });

  revalidateManagementViews();

  return {
    success: true,
    message: null,
  };
}

export async function createCondominiumAction(formData: FormData) {
  const administrator = await requireAuthenticatedAdminFromFormData(formData);

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);

  if (!name || !city || !state) {
    throw new Error("Nome, cidade e UF são obrigatórios.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const courtEntries = await parseCourtEntries(dataSource, formData);
  const tubeStockByBrand = getActiveCourtTubeStockEntries(
    await parseTubeStockEntries(dataSource, formData),
    courtEntries,
  );

  const condominium = await condominiumRepository.save({
    name,
    city,
    state,
    courts: courtEntries.length,
    ballQuantity: sumTubeStockEntries(tubeStockByBrand),
    tubeStockByBrand,
    plans: [],
    standalonePurchases: [],
    primaryAdmin: administrator,
  });

  await replaceCondominiumCourts(dataSource, condominium, courtEntries);
  revalidateManagementViews();
}

export async function updateCondominiumAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const condominiumId = String(formData.get("condominiumId") ?? "");

  if (!condominiumId) {
    throw new Error("Condomínio inválido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const courtEntries = await parseCourtEntries(dataSource, formData);
  const tubeStockByBrand = getActiveCourtTubeStockEntries(
    await parseTubeStockEntries(dataSource, formData),
    courtEntries,
  );
  const existing = await condominiumRepository.findOneBy({ id: condominiumId });

  if (!existing) {
    throw new Error("Condomínio não encontrado.");
  }

  existing.name = String(formData.get("name") ?? "").trim();
  existing.city = String(formData.get("city") ?? "").trim();
  existing.state = String(formData.get("state") ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  existing.courts = courtEntries.length;
  existing.ballQuantity = sumTubeStockEntries(tubeStockByBrand);
  existing.tubeStockByBrand = tubeStockByBrand;

  const condominium = await condominiumRepository.save(existing);
  await replaceCondominiumCourts(dataSource, condominium, courtEntries);
  revalidateManagementViews();
}

export async function deleteCondominiumAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const condominiumId = String(formData.get("condominiumId") ?? "");

  if (!condominiumId) {
    throw new Error("Condomínio inválido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  await condominiumRepository.delete({ id: condominiumId });
  revalidateManagementViews();
}

export async function createClientAccessAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const condominiumId = String(formData.get("condominiumId") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!condominiumId) {
    throw new Error("Condominio invalido.");
  }

  validateClientAccessUsername(username);

  if (password.length < 6) {
    throw new Error("Senha deve ter pelo menos 6 caracteres.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const accessRepository = dataSource.getRepository(
    CondominiumClientAccessEntity,
  );

  const condominium = await condominiumRepository.findOneBy({ id: condominiumId });

  if (!condominium) {
    throw new Error("Condominio nao encontrado.");
  }

  const existingAccess = await accessRepository.findOneBy({ username });

  if (existingAccess) {
    throw new Error("Este usuario ja esta em uso.");
  }

  await accessRepository.save({
    username,
    displayName: displayName || null,
    passwordHash: hashPassword(password),
    isActive: true,
    condominium,
  });

  revalidateManagementViews();
}

export async function deleteClientAccessAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const accessId = String(formData.get("accessId") ?? "").trim();

  if (!accessId) {
    throw new Error("Acesso de cliente invalido.");
  }

  const dataSource = await getDataSource();
  const accessRepository = dataSource.getRepository(
    CondominiumClientAccessEntity,
  );
  const sessionRepository = dataSource.getRepository(
    CondominiumClientSessionEntity,
  );

  const existingAccess = await accessRepository.findOneBy({ id: accessId });

  if (!existingAccess) {
    throw new Error("Acesso de cliente nao encontrado.");
  }

  await sessionRepository.delete({ accessId });
  await accessRepository.delete({ id: accessId });
  revalidateManagementViews();
}

export async function createPlanAction(formData: FormData) {
  const administrator = await requireAuthenticatedAdminFromFormData(formData);
  const condominiumId = String(formData.get("condominiumId") ?? "").trim();
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tierInput = String(formData.get("tier") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!condominiumId) {
    throw new Error("Condomínio é obrigatório para criar o plano.");
  }

  if (!name || !description || !slug) {
    throw new Error("Nome e descrição são obrigatórios.");
  }

  const condominium = await condominiumRepository.findOneBy({ id: condominiumId });

  if (!condominium) {
    throw new Error("Condomínio não encontrado.");
  }

  const existingPlans = getPlansWithFallback(condominium.plans);
  const existing = existingPlans.find((plan) => plan.slug === slug);

  if (existing) {
    throw new Error("Já existe um plano com esse slug nesse condomínio.");
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
      monthlyPriceInCents: parseCurrencyToCents(
        formData.get("monthlyPriceInCents"),
        0,
      ),
      overagePriceInCents: 0,
      isActive: true,
      createdByAdminId: administrator.id,
      createdByName: administrator.name,
    },
  ];

  await condominiumRepository.save(condominium);

  revalidateManagementViews();
}

export async function updatePlanAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano inválido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const condominiums = await condominiumRepository.find();
  const condominium = condominiums.find((entry) =>
    getPlansWithFallback(entry.plans).some((plan) => plan.id === planId),
  );

  if (!condominium) {
    throw new Error("Plano não encontrado.");
  }

  const plans = getPlansWithFallback(condominium.plans);
  const existing = plans.find((plan) => plan.id === planId);

  if (!existing) {
    throw new Error("Plano não encontrado.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? name));

  if (!name || !description || !requestedSlug) {
    throw new Error("Nome e descrição são obrigatórios.");
  }

  const duplicate = plans.find((plan) => plan.slug === requestedSlug);

  if (duplicate && duplicate.id !== existing.id) {
    throw new Error("Já existe um plano com esse slug nesse condomínio.");
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
          monthlyPriceInCents: parseCurrencyToCents(
            formData.get("monthlyPriceInCents"),
            existing.monthlyPriceInCents,
          ),
          overagePriceInCents: 0,
        }
      : plan,
  );

  await condominiumRepository.save(condominium);
  revalidateManagementViews();
}

export async function deletePlanAction(formData: FormData) {
  await requireAuthenticatedAdminFromFormData(formData);

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Plano inválido.");
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const condominiums = await condominiumRepository.find();
  const condominium = condominiums.find((entry) =>
    getPlansWithFallback(entry.plans).some((plan) => plan.id === planId),
  );

  if (!condominium) {
    throw new Error("Plano não encontrado.");
  }

  condominium.plans = getPlansWithFallback(condominium.plans).filter(
    (plan) => plan.id !== planId,
  );

  await condominiumRepository.save(condominium);
  revalidateManagementViews();
}
