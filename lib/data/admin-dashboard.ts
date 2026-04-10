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
import { type CondominiumPlan } from "@/lib/domain/condominium-plan";

function computeAvailableBalls(movements: BallInventoryMovement[]) {
  return movements.reduce((total, movement) => {
    return movement.kind === BallMovementKind.CREDIT
      ? total + movement.quantity
      : total - movement.quantity;
  }, 0);
}

function sumBallsByStatus(
  payments: CondominiumPayment[],
  status: PaymentStatus,
) {
  return payments
    .filter((payment) => payment.status === status)
    .reduce((total, payment) => total + payment.ballQuantity, 0);
}

function sumAmountByStatus(
  payments: CondominiumPayment[],
  status: PaymentStatus,
) {
  return payments
    .filter((payment) => payment.status === status)
    .reduce((total, payment) => total + payment.amountInCents, 0);
}

export const getAdminDashboardData = cache(async () => {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  const [condominiums, payments, movements] = await Promise.all([
    condominiumRepository.find({
      relations: {
        primaryAdmin: true,
        payments: true,
        ballMovements: { payment: true },
      },
      order: {
        createdAt: "ASC",
      },
    }),
    paymentRepository.find({
      relations: {
        condominium: true,
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

  const allPlans = condominiums.flatMap((condominium) =>
    condominium.plans.map((plan: CondominiumPlan) => ({
      id: plan.id,
      name: plan.name,
      condominiumId: condominium.id,
      condominiumName: condominium.name,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
    })),
  );

  const condominiumPerformance = condominiums.map((condominium) => ({
    id: condominium.id,
    name: condominium.name,
    paidBalls: sumBallsByStatus(condominium.payments, PaymentStatus.PAID),
    paidRevenueInCents: sumAmountByStatus(
      condominium.payments,
      PaymentStatus.PAID,
    ),
  }));

  const topCondominiumBySales = condominiumPerformance.reduce(
    (top, current) => {
      if (!top) {
        return current;
      }

      if (current.paidBalls > top.paidBalls) {
        return current;
      }

      if (
        current.paidBalls === top.paidBalls &&
        current.paidRevenueInCents > top.paidRevenueInCents
      ) {
        return current;
      }

      return top;
    },
    null as
      | (typeof condominiumPerformance)[number]
      | null,
  );

  return {
    summary: {
      totalAvailableBalls: condominiums.reduce(
        (total, condominium) =>
          total + computeAvailableBalls(condominium.ballMovements),
        0,
      ),
      confirmedBalls: payments
        .filter((payment) => payment.status === PaymentStatus.PAID)
        .reduce((total, payment) => total + payment.ballQuantity, 0),
      pendingBalls: payments
        .filter((payment) => payment.status === PaymentStatus.PENDING)
        .reduce((total, payment) => total + payment.ballQuantity, 0),
      creditedBalls: movements
        .filter((movement) => movement.kind === BallMovementKind.CREDIT)
        .reduce((total, movement) => total + movement.quantity, 0),
      totalRevenueInCents: payments
        .filter((payment) => payment.status === PaymentStatus.PAID)
        .reduce((total, payment) => total + payment.amountInCents, 0),
      topCondominiumBySales,
    },
    plans: allPlans,
    condominiums: condominiums.map((condominium: Condominium) => ({
      id: condominium.id,
      name: condominium.name,
      city: condominium.city,
      state: condominium.state,
      ballQuantity: condominium.ballQuantity,
      administratorName: condominium.primaryAdmin.name,
      availableBalls: computeAvailableBalls(condominium.ballMovements),
      pendingBalls: sumBallsByStatus(
        condominium.payments,
        PaymentStatus.PENDING,
      ),
      paidBalls: sumBallsByStatus(condominium.payments, PaymentStatus.PAID),
      plans: condominium.plans.map((plan: CondominiumPlan) => ({
        id: plan.id,
        name: plan.name,
      })),
      recentPayments: condominium.payments.slice(0, 3).map((payment) => ({
        id: payment.id,
        reference: payment.reference,
        status: payment.status,
        planName: payment.planName,
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
        planName: payment.planName,
        amountInCents: payment.amountInCents,
        ballQuantity: payment.ballQuantity,
        method: payment.method,
        provider: payment.provider,
        providerPaymentId: payment.providerPaymentId,
        pixExpiresAt: payment.pixExpiresAt,
        verifiedAt: payment.verifiedAt,
        providerDevMode: payment.providerDevMode,
      })),
  };
});
