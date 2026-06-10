import { getAuthenticatedAdminFromToken, getSessionTokenFromRequest } from "@/lib/auth/session";
import { getDataSource } from "@/lib/db/data-source";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import { CondominiumCourtEntity } from "@/lib/db/entities/condominium-court.entity";
import { TubeBrandEntity, type TubeBrand } from "@/lib/db/entities/tube-brand.entity";

type CreateCondominiumPayload = {
  name?: string;
  city?: string;
  state?: string;
  courts?: number;
  courtDetails?: Array<{
    name?: string;
    tubeBrandId?: string;
  }>;
  ballQuantity?: number;
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

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
      courtDetails: {
        tubeBrand: true,
      },
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
      courts: condominium.courtDetails?.length || condominium.courts,
      courtDetails: [...(condominium.courtDetails ?? [])]
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((court) => ({
          id: court.id,
          name: court.name,
          tubeBrand: {
            id: court.tubeBrand.id,
            name: court.tubeBrand.name,
          },
        })),
      ballQuantity: condominium.ballQuantity,
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

  const savedCondominium = await condominiumRepository.save({
    name: payload.name.trim(),
    city: payload.city.trim(),
    state: payload.state.trim().toUpperCase().slice(0, 2),
    courts: requestedCourtCount,
    ballQuantity:
      payload.ballQuantity !== undefined
        ? payload.ballQuantity >= 0
          ? payload.ballQuantity
          : 0
        : payload.activeResidents && payload.activeResidents >= 0
          ? payload.activeResidents
          : 0,
    primaryAdmin: assignedAdministrator,
  });

  const brands = await brandRepository.find({ order: { name: "ASC" } });
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const defaultBrand = brands[0];
  const courtDetails =
    payload.courtDetails && payload.courtDetails.length > 0
      ? payload.courtDetails
      : Array.from({ length: requestedCourtCount }, (_, index) => ({
          name: `Quadra ${index + 1}`,
          tubeBrandId: defaultBrand?.id,
        }));

  const savedCourts =
    courtDetails.length > 0
      ? await courtRepository.save(
          courtDetails.map((court, index) => {
            const tubeBrand = court.tubeBrandId
              ? brandById.get(court.tubeBrandId)
              : defaultBrand;

            if (!tubeBrand) {
              throw new Error("Marca de tubos invalida para uma das quadras.");
            }

            return {
              name: court.name?.trim() || `Quadra ${index + 1}`,
              sortOrder: index,
              condominium: savedCondominium,
              tubeBrand: tubeBrand as TubeBrand,
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
      courtDetails: savedCourts.map((court) => ({
        id: court.id,
        name: court.name,
        tubeBrand: {
          id: court.tubeBrand.id,
          name: court.tubeBrand.name,
        },
      })),
      administrator: {
        id: assignedAdministrator.id,
        name: assignedAdministrator.name,
        email: assignedAdministrator.email,
      },
    },
    { status: 201 },
  );
}
