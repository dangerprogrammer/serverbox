import "server-only";

import { getDataSource } from "@/lib/db/data-source";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
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
import {
  calculateRemainingBallStock,
  calculateStandalonePaymentCapacity,
  findOpenStandaloneBallPayment,
  isOpenPendingPayment,
  sumOpenPendingBallQuantity,
  sumPaidBallQuantity,
} from "@/lib/payments/stock";

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

function buildCondominiumStockSummary(condominium: Condominium) {
  const openStandalonePayment = findOpenStandaloneBallPayment(condominium.payments);

  return {
    stockLimit: condominium.ballQuantity,
    paidBalls: sumPaidBallQuantity(condominium.payments),
    pendingBalls: sumOpenPendingBallQuantity(condominium.payments),
    remainingBalls: calculateRemainingBallStock({
      stockQuantity: condominium.ballQuantity,
      payments: condominium.payments,
    }),
    openStandalonePayment,
    openStandalonePaymentCapacity: openStandalonePayment
      ? calculateStandalonePaymentCapacity({
          stockQuantity: condominium.ballQuantity,
          payments: condominium.payments,
          payment: openStandalonePayment,
        })
      : 0,
  };
}

export async function getAdminDashboardData() {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  const condominiums = await condominiumRepository.find({
    relations: {
      primaryAdmin: true,
      payments: true,
      ballMovements: { payment: true },
    },
    order: {
      createdAt: "ASC",
    },
  });

  const payments = await paymentRepository.find({
    relations: {
      condominium: true,
    },
    order: {
      createdAt: "DESC",
    },
  });

  const movements = await movementRepository.find({
    relations: {
      condominium: true,
      payment: true,
    },
    order: {
      createdAt: "DESC",
    },
  });

  const stockByCondominiumId = new Map(
    condominiums.map((condominium) => [
      condominium.id,
      buildCondominiumStockSummary(condominium),
    ]),
  );

  const allPlans = condominiums.flatMap((condominium) => {
    const stockSummary = stockByCondominiumId.get(condominium.id);
    const remainingBallStock = stockSummary?.remainingBalls ?? 0;

    return condominium.plans.map((plan: CondominiumPlan) => ({
      id: plan.id,
      name: plan.name,
      condominiumId: condominium.id,
      condominiumName: condominium.name,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
      remainingBallStock,
      availablePaymentCount:
        plan.monthlyBallAllowance > 0
          ? Math.floor(remainingBallStock / plan.monthlyBallAllowance)
          : 0,
    }));
  });

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
          total + (stockByCondominiumId.get(condominium.id)?.remainingBalls ?? 0),
        0,
      ),
      confirmedBalls: condominiums.reduce(
        (total, condominium) =>
          total + (stockByCondominiumId.get(condominium.id)?.paidBalls ?? 0),
        0,
      ),
      pendingBalls: condominiums.reduce(
        (total, condominium) =>
          total + (stockByCondominiumId.get(condominium.id)?.pendingBalls ?? 0),
        0,
      ),
      creditedBalls: movements
        .filter((movement) => movement.kind === BallMovementKind.CREDIT)
        .reduce((total, movement) => total + movement.quantity, 0),
      totalRevenueInCents: payments
        .filter((payment) => payment.status === PaymentStatus.PAID)
        .reduce((total, payment) => total + payment.amountInCents, 0),
      topCondominiumBySales,
    },
    plans: allPlans,
    condominiums: condominiums.map((condominium: Condominium) => {
      const stockSummary = stockByCondominiumId.get(condominium.id);
      const recentPayments = [...condominium.payments]
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .slice(0, 3);

      return {
        id: condominium.id,
        name: condominium.name,
        city: condominium.city,
        state: condominium.state,
        ballQuantity: condominium.ballQuantity,
        administratorName: condominium.primaryAdmin.name,
        availableBalls: stockSummary?.remainingBalls ?? 0,
        remainingBallStock: stockSummary?.remainingBalls ?? 0,
        committedBalls:
          (stockSummary?.paidBalls ?? 0) + (stockSummary?.pendingBalls ?? 0),
        pendingBalls: stockSummary?.pendingBalls ?? 0,
        paidBalls: stockSummary?.paidBalls ?? 0,
        plans: condominium.plans.map((plan: CondominiumPlan) => ({
          id: plan.id,
          name: plan.name,
        })),
        standalonePayment: stockSummary?.openStandalonePayment
          ? {
              id: stockSummary.openStandalonePayment.id,
              amountInCents: stockSummary.openStandalonePayment.amountInCents,
              ballQuantity: stockSummary.openStandalonePayment.ballQuantity,
              availablePaymentCount: stockSummary.openStandalonePaymentCapacity,
            }
          : null,
        recentPayments: recentPayments.map((payment) => ({
          id: payment.id,
          reference: payment.reference,
          status: payment.status,
          planName: payment.planName || "Plano antigo",
          ballQuantity: payment.ballQuantity,
          amountInCents: payment.amountInCents,
        })),
      };
    }),
    pendingPayments: payments
      .filter(isOpenPendingPayment)
      .map((payment: CondominiumPayment) => ({
        id: payment.id,
        reference: payment.reference,
        condominiumName: payment.condominium.name,
        planName: payment.planName || "Plano antigo",
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
}

export async function getAdminCondominiumDetails(condominiumId: string) {
  const dataSource = await getDataSource();
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);

  const condominium = await condominiumRepository.findOne({
    where: { id: condominiumId },
    relations: {
      primaryAdmin: true,
      payments: true,
      ballMovements: { payment: true },
    },
  });

  if (!condominium) {
    return null;
  }

  const sortedPayments = [...condominium.payments].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
  const stockSummary = buildCondominiumStockSummary(condominium);

  return {
    id: condominium.id,
    name: condominium.name,
    city: condominium.city,
    state: condominium.state,
    courts: condominium.courts,
    ballQuantity: condominium.ballQuantity,
    administratorName: condominium.primaryAdmin.name,
    availableBalls: stockSummary.remainingBalls,
    remainingBallStock: stockSummary.remainingBalls,
    committedBalls: stockSummary.paidBalls + stockSummary.pendingBalls,
    paidBalls: stockSummary.paidBalls,
    pendingBalls: stockSummary.pendingBalls,
    paidRevenueInCents: sumAmountByStatus(condominium.payments, PaymentStatus.PAID),
    pendingRevenueInCents: sumAmountByStatus(
      condominium.payments,
      PaymentStatus.PENDING,
    ),
    plans: condominium.plans.map((plan: CondominiumPlan) => ({
      id: plan.id,
      name: plan.name,
      monthlyBallAllowance: plan.monthlyBallAllowance,
      monthlyPriceInCents: plan.monthlyPriceInCents,
    })),
    payments: sortedPayments.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      status: payment.status,
      planName: payment.planName || "Plano antigo",
      amountInCents: payment.amountInCents,
      ballQuantity: payment.ballQuantity,
      createdAt: payment.createdAt,
    })),
  };
}
