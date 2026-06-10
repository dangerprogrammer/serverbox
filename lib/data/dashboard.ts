import "server-only";

import { getDataSource } from "@/lib/db/data-source";
import {
  AdministratorEntity,
  type Administrator,
} from "@/lib/db/entities/administrator.entity";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import {
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanTier, type CondominiumPlan } from "@/lib/domain/condominium-plan";
import { calculateRemainingBallStock } from "@/lib/payments/stock";

const tierLabels: Record<PlanTier, string> = {
  [PlanTier.BASIC]: "Basico",
  [PlanTier.INTERMEDIATE]: "Intermediario",
  [PlanTier.PREMIUM]: "Premium",
  [PlanTier.CUSTOM]: "Personalizado",
};

export async function getDashboardData() {
  const dataSource = await getDataSource();
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const administrators = await administratorRepository.find({
    relations: {
      condominiums: true,
    },
    order: {
      createdAt: "ASC",
    },
  });

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
      courtDetails: { tubeBrand: true },
      payments: true,
    },
    order: {
      createdAt: "ASC",
    },
  });

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
          total +
          calculateRemainingBallStock({
            stockQuantity: condominium.ballQuantity,
            payments: condominium.payments,
          }),
        0,
      ),
    },
    plans,
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
          tubeBrandName: court.tubeBrand.name,
        })),
      ballQuantity: condominium.ballQuantity,
      administratorName: condominium.primaryAdmin.name,
      availablePlanCount: condominium.plans.length,
      availableBalls: calculateRemainingBallStock({
        stockQuantity: condominium.ballQuantity,
        payments: condominium.payments,
      }),
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
}
