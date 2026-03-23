import "server-only";

import { cache } from "react";

import { getDataSource } from "@/lib/db/data-source";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
  type BallInventoryMovement,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import {
  CondominiumEntity,
  type Condominium,
} from "@/lib/db/entities/condominium.entity";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";
import type { CondominiumPlan } from "@/lib/db/entities/condominium-plan.entity";
import { PlanEntity, type Plan } from "@/lib/db/entities/plan.entity";

function computeAvailableBalls(movements: BallInventoryMovement[]) {
  return movements.reduce((total, movement) => {
    return movement.kind === BallMovementKind.CREDIT
      ? total + movement.quantity
      : total - movement.quantity;
  }, 0);
}

export const getAdminDashboardData = cache(async () => {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  const [condominiums, plans, payments, movements] = await Promise.all([
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        planAssignments: { plan: true },
        payments: { plan: true },
        ballMovements: { payment: true },
      },
      order: {
        createdAt: "ASC",
      },
    }),
    planRepository.find({
      order: {
        monthlyPriceInCents: "ASC",
      },
    }),
    paymentRepository.find({
      relations: {
        condominium: true,
        plan: true,
      },
      order: {
        createdAt: "DESC",
      },
    }),
    movementRepository.find({
      relations: {
        condominium: true,
        payment: true,
      },
      order: {
        createdAt: "DESC",
      },
    }),
  ]);

  return {
    summary: {
      totalAvailableBalls: condominiums.reduce(
        (total, condominium) =>
          total + computeAvailableBalls(condominium.ballMovements),
        0,
      ),
      paidPayments: payments.filter(
        (payment) => payment.status === PaymentStatus.PAID,
      ).length,
      pendingPayments: payments.filter(
        (payment) => payment.status === PaymentStatus.PENDING,
      ).length,
      creditedBalls: movements
        .filter((movement) => movement.kind === BallMovementKind.CREDIT)
        .reduce((total, movement) => total + movement.quantity, 0),
    },
    plans: plans.map((plan: Plan) => ({
      id: plan.id,
      name: plan.name,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
    })),
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      administratorName: condominium.primaryAdmin.name,
      availableBalls: computeAvailableBalls(condominium.ballMovements),
      pendingPayments: condominium.payments.filter(
        (payment: CondominiumPayment) => payment.status === PaymentStatus.PENDING,
      ).length,
      paidPayments: condominium.payments.filter(
        (payment: CondominiumPayment) => payment.status === PaymentStatus.PAID,
      ).length,
      plans: condominium.planAssignments.map((assignment: CondominiumPlan) => ({
        id: assignment.plan.id,
        name: assignment.plan.name,
      })),
      recentPayments: condominium.payments.slice(0, 3).map((payment) => ({
        id: payment.id,
        reference: payment.reference,
        status: payment.status,
        planName: payment.plan.name,
        ballQuantity: payment.ballQuantity,
        amountInCents: payment.amountInCents,
      })),
    })),
    pendingPayments: payments
      .filter((payment: CondominiumPayment) => payment.status === PaymentStatus.PENDING)
      .map((payment: CondominiumPayment) => ({
        id: payment.id,
        reference: payment.reference,
        condominiumName: payment.condominium.name,
        planName: payment.plan.name,
        amountInCents: payment.amountInCents,
        ballQuantity: payment.ballQuantity,
        method: payment.method,
      })),
  };
});
