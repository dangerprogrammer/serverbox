import "server-only";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import { TubeBrandEntity } from "@/lib/db/entities/tube-brand.entity";
import { type CondominiumPlan } from "@/lib/domain/condominium-plan";

export async function getCondominiumManagementData() {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const brandRepository = dataSource.getRepository(TubeBrandEntity);

  const [condominiums, tubeBrands] = await Promise.all([
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        courtDetails: {
          tubeBrand: true,
        },
      },
      order: {
        createdAt: "ASC",
      },
    }),
    brandRepository.find({
      order: {
        name: "ASC",
      },
    }),
  ]);

  return {
    tubeBrands: tubeBrands.map((brand) => ({
      id: brand.id,
      name: brand.name,
    })),
    condominiums: condominiums.map((condominium: Condominium) => ({
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
          sortOrder: court.sortOrder,
          tubeBrandId: court.tubeBrand.id,
          tubeBrandName: court.tubeBrand.name,
        })),
      ballQuantity: condominium.ballQuantity,
      administratorName: condominium.primaryAdmin.name,
      administratorEmail: condominium.primaryAdmin.email,
      plans: [...condominium.plans]
        .sort((left, right) => left.monthlyPriceInCents - right.monthlyPriceInCents)
        .map((plan: CondominiumPlan) => ({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        tier: plan.tier,
        monthlyBallAllowance: plan.monthlyBallAllowance,
        monthlyPriceInCents: plan.monthlyPriceInCents,
        overagePriceInCents: plan.overagePriceInCents,
        createdByName: plan.createdByName ?? condominium.primaryAdmin.name,
      })),
    })),
  };
}
