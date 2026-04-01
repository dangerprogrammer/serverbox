import "server-only";

import { cache } from "react";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import { type Plan } from "@/lib/db/entities/plan.entity";

export const getCondominiumManagementData = cache(async () => {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
      plans: {
        createdBy: true,
      },
    },
    order: {
      createdAt: "ASC",
      plans: {
        monthlyPriceInCents: "ASC",
      },
    },
  });

  return {
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      courts: condominium.courts,
      activeResidents: condominium.activeResidents,
      administratorName: condominium.primaryAdmin.name,
      administratorEmail: condominium.primaryAdmin.email,
      plans: condominium.plans.map((plan: Plan) => ({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        tier: plan.tier,
        monthlyBallAllowance: plan.monthlyBallAllowance,
        monthlyPriceInCents: plan.monthlyPriceInCents,
        overagePriceInCents: plan.overagePriceInCents,
        createdByName: plan.createdBy?.name ?? condominium.primaryAdmin.name,
      })),
    })),
  };
});
