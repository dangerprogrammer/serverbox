import { getAuthenticatedAdminFromToken, getSessionTokenFromRequest } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import {
  CondominiumCourtEntity,
  type CondominiumCourt,
} from "@/lib/db/entities/condominium-court.entity";
import { TubeBrandEntity, type TubeBrand } from "@/lib/db/entities/tube-brand.entity";
import {
  getActiveTubeStockEntries,
  getTubeStockEntries,
  sumActiveTubeStockEntries,
  sumTubeStockEntries,
} from "@/lib/domain/tube-stock";

type CreateCondominiumPayload = {
  name?: string;
  city?: string;
  state?: string;
  courts?: number;
  courtDetails?: Array<{
    name?: string;
    tubeBrandId?: string;
    tubeBrandIds?: string[];
  }>;
  ballQuantity?: number;
  tubeStockByBrand?: Array<{
    tubeBrandId?: string;
    quantity?: number;
  }>;
  activeResidents?: number;
  adminEmail?: string;
  adminName?: string;
};

export async function GET(request: Request) {
  const administrator = await getAuthenticatedAdminFromToken(
    getSessionTokenFromRequest(request),
  );

  if (!administrator) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const brandRepository = dataSource.getRepository(TubeBrandEntity);

  const [condominiums, brands] = await Promise.all([
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        courtDetails: {
          tubeBrand: true,
          tubeBrands: true,
        },
      },
      order: {
        createdAt: "DESC",
      },
    }),
    brandRepository.find({
      order: {
        name: "ASC",
      },
    }),
  ]);
  const brandById = new Map<string, TubeBrand>(
    brands.map((brand: TubeBrand) => [brand.id, brand]),
  );

  return Response.json(
    condominiums.map((condominium: Condominium) => {
      const tubeStockByBrand = getActiveTubeStockEntries(
        condominium.tubeStockByBrand,
        condominium.courtDetails,
      )
        .map((entry) => {
          const tubeBrand = brandById.get(entry.tubeBrandId);

          return tubeBrand
            ? {
                ...entry,
                tubeBrandName: tubeBrand.name,
              }
            : null;
        })
        .filter((entry) => entry !== null);
      const ballQuantity = sumActiveTubeStockEntries(
        condominium.tubeStockByBrand,
        condominium.courtDetails,
        condominium.ballQuantity,
      );

      return {
        id: condominium.id,
        name: condominium.name,
        city: condominium.city,
        state: condominium.state,
        courts: condominium.courtDetails?.length || condominium.courts,
        courtDetails: [...(condominium.courtDetails ?? [])]
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((court) => {
          const tubeBrands =
            court.tubeBrands && court.tubeBrands.length > 0
              ? court.tubeBrands
              : [court.tubeBrand];

          return {
            id: court.id,
            name: court.name,
            tubeBrand: {
              id: court.tubeBrand.id,
              name: court.tubeBrand.name,
            },
            tubeBrands: tubeBrands.map((brand) => ({
              id: brand.id,
              name: brand.name,
            })),
          };
        }),
        ballQuantity,
        tubeStockByBrand,
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
      };
    }),
  );
}

export async function POST(request: Request) {
  const administrator = await getAuthenticatedAdminFromToken(
    getSessionTokenFromRequest(request),
  );

  if (!administrator) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
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
  const courtRepository = dataSource.getRepository(CondominiumCourtEntity);
  const brandRepository = dataSource.getRepository(TubeBrandEntity);

  let assignedAdministrator = payload.adminEmail
    ? await administratorRepository.findOneBy({
        email: payload.adminEmail.trim().toLowerCase(),
      })
    : await administratorRepository.findOne({
        where: {},
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
      { error: "Não foi possível resolver um administrador para o condomínio." },
      { status: 400 },
    );
  }

  const requestedCourtCount =
    payload.courtDetails && payload.courtDetails.length > 0
      ? payload.courtDetails.length
      : payload.courts && payload.courts > 0
        ? payload.courts
        : 1;

  const brands = await brandRepository.find({ order: { name: "ASC" } });
  const brandById = new Map<string, TubeBrand>(
    brands.map((brand: TubeBrand) => [brand.id, brand]),
  );
  const defaultBrand = brands[0];
  const tubeStockByBrand = getTubeStockEntries(
    payload.tubeStockByBrand?.map((entry) => ({
      tubeBrandId: String(entry.tubeBrandId ?? ""),
      quantity: Number(entry.quantity ?? 0),
    })),
  );
  const validTubeStockByBrand =
    tubeStockByBrand.length > 0
      ? tubeStockByBrand
      : defaultBrand
        ? [
            {
              tubeBrandId: defaultBrand.id,
              quantity:
                payload.ballQuantity !== undefined
                  ? Math.max(payload.ballQuantity, 0)
                  : payload.activeResidents && payload.activeResidents >= 0
                    ? payload.activeResidents
                    : 0,
            },
          ].filter((entry) => entry.quantity > 0)
        : [];

  if (
    validTubeStockByBrand.some((entry) => !brandById.has(entry.tubeBrandId))
  ) {
    return Response.json(
      { error: "tubeStockByBrand contem marca de tubos invalida." },
      { status: 400 },
    );
  }

  const courtDetails =
    payload.courtDetails && payload.courtDetails.length > 0
      ? payload.courtDetails
      : Array.from({ length: requestedCourtCount }, (_, index) => ({
          name: `Quadra ${index + 1}`,
          tubeBrandId: defaultBrand?.id,
          tubeBrandIds: defaultBrand ? [defaultBrand.id] : [],
        }));
  const activeBrandIds = new Set<string>();
  courtDetails.forEach((court) => {
    const selectedBrandIds =
      court.tubeBrandIds && court.tubeBrandIds.length > 0
        ? court.tubeBrandIds
        : [court.tubeBrandId].filter(Boolean);
    const selectedTubeBrands = selectedBrandIds
      .map((brandId) => brandById.get(String(brandId)))
      .filter(Boolean) as TubeBrand[];
    const resolvedTubeBrands =
      selectedTubeBrands.length > 0
        ? selectedTubeBrands
        : defaultBrand
          ? [defaultBrand]
          : [];

    resolvedTubeBrands.forEach((brand) => activeBrandIds.add(brand.id));
  });
  const activeTubeStockByBrand =
    activeBrandIds.size > 0
      ? validTubeStockByBrand.filter((entry) =>
          activeBrandIds.has(entry.tubeBrandId),
        )
      : validTubeStockByBrand;

  const savedCondominium = await condominiumRepository.save({
    name: payload.name.trim(),
    city: payload.city.trim(),
    state: payload.state.trim().toUpperCase().slice(0, 2),
    courts: requestedCourtCount,
    ballQuantity: sumTubeStockEntries(activeTubeStockByBrand),
    tubeStockByBrand: activeTubeStockByBrand,
    standalonePurchases: [],
    primaryAdmin: assignedAdministrator,
  });

  const savedCourts =
    courtDetails.length > 0
      ? await courtRepository.save(
          courtDetails.map((court, index) => {
            const selectedBrandIds =
              court.tubeBrandIds && court.tubeBrandIds.length > 0
                ? court.tubeBrandIds
                : [court.tubeBrandId].filter(Boolean);
            const tubeBrands = selectedBrandIds
              .map((brandId) => brandById.get(String(brandId)))
              .filter(Boolean) as TubeBrand[];
            const selectedTubeBrands =
              tubeBrands.length > 0 ? tubeBrands : defaultBrand ? [defaultBrand] : [];
            const tubeBrand = selectedTubeBrands[0];

            if (!tubeBrand) {
              throw new Error("Marca de tubos invalida para uma das quadras.");
            }

            return {
              name: court.name?.trim() || `Quadra ${index + 1}`,
              sortOrder: index,
              condominium: savedCondominium,
              tubeBrand: tubeBrand as TubeBrand,
              tubeBrands: selectedTubeBrands,
            };
          }),
        )
      : [];

  return Response.json(
    {
      id: savedCondominium.id,
      name: savedCondominium.name,
      city: savedCondominium.city,
      state: savedCondominium.state,
      courts: savedCourts.length || savedCondominium.courts,
      ballQuantity: savedCondominium.ballQuantity,
      tubeStockByBrand: activeTubeStockByBrand.map((entry) => {
        const tubeBrand = brandById.get(entry.tubeBrandId);

        return {
          ...entry,
          tubeBrandName: tubeBrand?.name ?? "Marca removida",
        };
      }),
      courtDetails: savedCourts.map((court: CondominiumCourt) => {
        const tubeBrands =
          court.tubeBrands && court.tubeBrands.length > 0
            ? court.tubeBrands
            : [court.tubeBrand];

        return {
          id: court.id,
          name: court.name,
          tubeBrand: {
            id: court.tubeBrand.id,
            name: court.tubeBrand.name,
          },
          tubeBrands: tubeBrands.map((brand: TubeBrand) => ({
            id: brand.id,
            name: brand.name,
          })),
        };
      }),
      administrator: {
        id: assignedAdministrator.id,
        name: assignedAdministrator.name,
        email: assignedAdministrator.email,
      },
    },
    { status: 201 },
  );
}
