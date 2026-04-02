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
import {
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanTier, type CondominiumPlan } from "@/lib/domain/condominium-plan";

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
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const [administrators, condominiums] = await Promise.all([
    administratorRepository.find({
      relations: {
        condominiums: true,
      },
      order: {
        createdAt: "ASC",
      },
    }),
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        payments: true,
        ballMovements: true,
      },
      order: {
        createdAt: "ASC",
      },
    }),
  ]);

  const plans = condominiums.flatMap((condominium) =>
    condominium.plans.map((plan: CondominiumPlan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      tierLabel: tierLabels[plan.tier],
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      overagePriceInCents: plan.overagePriceInCents,
      condominiumName: condominium.name,
      createdByName: plan.createdByName ?? condominium.primaryAdmin.name,
    })),
  );

  return {
    summary: {
      activeCondominiums: condominiums.length,
      administrators: administrators.length,
      totalPlans: plans.length,
      availableBalls: condominiums.reduce(
        (total, condominium) =>
          total + computeAvailableBalls(condominium.ballMovements),
        0,
      ),
    },
    plans,
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      courts: condominium.courts,
      activeResidents: condominium.activeResidents,
      administratorName: condominium.primaryAdmin.name,
      availablePlanCount: condominium.plans.length,
      availableBalls: computeAvailableBalls(condominium.ballMovements),
      paidPayments: condominium.payments.filter(
        (payment: CondominiumPayment) => payment.status === PaymentStatus.PAID,
      ).length,
    })),
    administrators: administrators.map((administrator: Administrator) => ({
      id: administrator.id,
      name: administrator.name,
      email: administrator.email,
      condominiumCount: administrator.condominiums.length,
      createdPlanCount: administrator.condominiums.reduce(
        (total, condominium) => total + condominium.plans.length,
        0,
      ),
    })),
  };
});
