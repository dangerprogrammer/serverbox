import {
  PaymentStatus,
  type CondominiumPayment,
} from "@/lib/db/entities/condominium-payment.entity";

export const STANDALONE_BALL_PURCHASE_PLAN_NAME = "Compra avulsa de tubos";

type StockPayment = Pick<
  CondominiumPayment,
  | "id"
  | "planId"
  | "planName"
  | "status"
  | "amountInCents"
  | "ballQuantity"
  | "pixExpiresAt"
  | "createdAt"
>;

export function isStandaloneBallPayment(
  payment: Pick<CondominiumPayment, "planId" | "planName">,
) {
  return (
    payment.planId?.startsWith("standalone-") ||
    payment.planName === STANDALONE_BALL_PURCHASE_PLAN_NAME
  );
}

export function hasPendingPaymentExpired(payment: Pick<StockPayment, "status" | "pixExpiresAt">) {
  return (
    payment.status === PaymentStatus.PENDING &&
    payment.pixExpiresAt !== null &&
    payment.pixExpiresAt.getTime() <= Date.now()
  );
}

export function isOpenPendingPayment(payment: Pick<StockPayment, "status" | "pixExpiresAt">) {
  return payment.status === PaymentStatus.PENDING && !hasPendingPaymentExpired(payment);
}

export function isStockCommitment(payment: Pick<StockPayment, "status" | "pixExpiresAt">) {
  return payment.status === PaymentStatus.PAID || isOpenPendingPayment(payment);
}

export function sumCommittedBallQuantity(
  payments: StockPayment[],
  options: { exceptPaymentId?: string } = {},
) {
  return payments
    .filter((payment) => payment.id !== options.exceptPaymentId)
    .filter(isStockCommitment)
    .reduce((total, payment) => total + payment.ballQuantity, 0);
}

export function sumPaidBallQuantity(payments: StockPayment[]) {
  return payments
    .filter((payment) => payment.status === PaymentStatus.PAID)
    .reduce((total, payment) => total + payment.ballQuantity, 0);
}

export function sumOpenPendingBallQuantity(payments: StockPayment[]) {
  return payments
    .filter(isOpenPendingPayment)
    .reduce((total, payment) => total + payment.ballQuantity, 0);
}

export function calculateRemainingBallStock({
  stockQuantity,
  payments,
  exceptPaymentId,
}: {
  stockQuantity: number;
  payments: StockPayment[];
  exceptPaymentId?: string;
}) {
  const normalizedStock = Number.isFinite(stockQuantity)
    ? Math.max(0, stockQuantity)
    : 0;

  return Math.max(
    normalizedStock - sumCommittedBallQuantity(payments, { exceptPaymentId }),
    0,
  );
}

export function calculateStandalonePaymentCapacity({
  stockQuantity,
  payments,
  payment,
}: {
  stockQuantity: number;
  payments: StockPayment[];
  payment: StockPayment;
}) {
  if (!Number.isFinite(payment.ballQuantity) || payment.ballQuantity <= 0) {
    return 0;
  }

  const stockAvailableForThisPayment = calculateRemainingBallStock({
    stockQuantity,
    payments,
    exceptPaymentId: payment.id,
  });

  return Math.floor(stockAvailableForThisPayment / payment.ballQuantity);
}

export function findOpenStandaloneBallPayment(payments: StockPayment[]) {
  return payments
    .filter(isStandaloneBallPayment)
    .filter(isOpenPendingPayment)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
}
