import { getDataSource } from "@/lib/db/data-source";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import {
  CondominiumPaymentEntity,
  PaymentStatus,
} from "@/lib/db/entities/condominium-payment.entity";

export async function POST(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  const dataSource = await getDataSource();
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  const payment = await paymentRepository.findOne({
    where: { id: paymentId },
    relations: {
      condominium: true,
      plan: true,
    },
  });

  if (!payment) {
    return Response.json({ error: "Pagamento nao encontrado." }, { status: 404 });
  }

  if (payment.status === PaymentStatus.PAID) {
    return Response.json(payment);
  }

  payment.status = PaymentStatus.PAID;
  payment.paidAt = new Date();
  const savedPayment = await paymentRepository.save(payment);

  await movementRepository.save({
    condominium: payment.condominium,
    payment: savedPayment,
    kind: BallMovementKind.CREDIT,
    quantity: payment.ballQuantity,
    reason: `Credito liberado para o pagamento ${payment.reference}.`,
  });

  return Response.json(savedPayment);
}
