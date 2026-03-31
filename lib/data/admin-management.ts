import "server-only";

import { cache } from "react";

import { getDataSource } from "@/lib/db/data-source";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import type { CondominiumPlan } from "@/lib/db/entities/condominium-plan.entity";
import { PlanEntity, type Plan } from "@/lib/db/entities/plan.entity";

export const getCondominiumManagementData = cache(async () => {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planRepository = dataSource.getRepository(PlanEntity);

  const [condominiums, plans] = await Promise.all([
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        planAssignments: { plan: true },
      },
      order: {
        createdAt: "ASC",
      },
    }),
    planRepository.find({
      relations: {
        createdBy: true,
        condominiumPlans: true,
      },
      order: {
        monthlyPriceInCents: "ASC",
      },
    }),
  ]);

  return {
    plans: plans.map((plan: Plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      tier: plan.tier,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      overagePriceInCents: plan.overagePriceInCents,
      isDefault: plan.isDefault,
      condominiumCount: plan.condominiumPlans.length,
      createdByName: plan.createdBy?.name ?? "Sistema",
    })),
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      courts: condominium.courts,
      activeResidents: condominium.activeResidents,
      administratorName: condominium.primaryAdmin.name,
      administratorEmail: condominium.primaryAdmin.email,
      plans: condominium.planAssignments.map((assignment: CondominiumPlan) => ({
        id: assignment.plan.id,
        name: assignment.plan.name,
      })),
    })),
  };
});
