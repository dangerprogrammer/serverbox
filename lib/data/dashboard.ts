import "server-only";

import { cache } from "react";

import { getDataSource } from "@/lib/db/data-source";
import {
  AdministratorEntity,
  type Administrator,
} from "@/lib/db/entities/administrator.entity";
import {
  BallMovementKind,
  type BallInventoryMovement,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import type { CondominiumPlan } from "@/lib/db/entities/condominium-plan.entity";
import {
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity, PlanTier, type Plan } from "@/lib/db/entities/plan.entity";

const tierLabels: Record<PlanTier, string> = {
  [PlanTier.BASIC]: "Basico",
  [PlanTier.INTERMEDIATE]: "Intermediario",
  [PlanTier.PREMIUM]: "Premium",
  [PlanTier.CUSTOM]: "Personalizado",
};

function computeAvailableBalls(movements: BallInventoryMovement[]) {
  return movements.reduce((total, movement) => {
    return movement.kind === BallMovementKind.CREDIT
      ? total + movement.quantity
      : total - movement.quantity;
  }, 0);
}

export const getDashboardData = cache(async () => {
  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const [administrators, plans, condominiums] = await Promise.all([
    administratorRepository.find({
      relations: {
        condominiums: true,
        plans: true,
      },
      order: {
        createdAt: "ASC",
      },
    }),
    planRepository.find({
      relations: {
        condominiumPlans: true,
        createdBy: true,
      },
      order: {
        monthlyPriceInCents: "ASC",
      },
    }),
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        planAssignments: { plan: true },
        payments: true,
        ballMovements: true,
      },
      order: {
        createdAt: "ASC",
      },
    }),
  ]);

  return {
    summary: {
      activeCondominiums: condominiums.length,
      administrators: administrators.length,
      totalPlans: plans.length,
      customPlans: plans.filter((plan: Plan) => !plan.isDefault).length,
      availableBalls: condominiums.reduce(
        (total, condominium) =>
          total + computeAvailableBalls(condominium.ballMovements),
        0,
      ),
    },
    plans: plans.map((plan: Plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      tierLabel: tierLabels[plan.tier],
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      overagePriceInCents: plan.overagePriceInCents,
      isDefault: plan.isDefault,
      condominiumCount: plan.condominiumPlans.length,
      createdByName: plan.createdBy?.name ?? "Catalogo padrao",
    })),
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      courts: condominium.courts,
      activeResidents: condominium.activeResidents,
      administratorName: condominium.primaryAdmin.name,
      availablePlanCount: condominium.planAssignments.length,
      availableBalls: computeAvailableBalls(condominium.ballMovements),
      paidPayments: condominium.payments.filter(
        (payment: CondominiumPayment) => payment.status === PaymentStatus.PAID,
      ).length,
      planNames: condominium.planAssignments.map(
        (assignment: CondominiumPlan) => assignment.plan.name,
      ),
    })),
    administrators: administrators.map((administrator: Administrator) => ({
      id: administrator.id,
      name: administrator.name,
      email: administrator.email,
      condominiumCount: administrator.condominiums.length,
      createdPlanCount: administrator.plans.length,
    })),
  };
});
