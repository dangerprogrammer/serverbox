import "server-only";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import { type CondominiumPlan } from "@/lib/domain/condominium-plan";

export async function getCondominiumManagementData() {
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

  return {
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      courts: condominium.courts,
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
