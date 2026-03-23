import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";
import type { Plan } from "@/lib/db/entities/plan.entity";

export enum PaymentMethod {
  PIX = "pix",
  CREDIT_CARD = "credit_card",
  BOLETO = "boleto",
  MANUAL = "manual",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export type CondominiumPayment = {
  id: string;
  reference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountInCents: number;
  ballQuantity: number;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  condominium: Condominium;
  plan: Plan;
};

export const CondominiumPaymentEntity = new EntitySchema<CondominiumPayment>({
  name: "CondominiumPayment",
  tableName: "condominium_payments",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    reference: {
      type: String,
      unique: true,
    },
    method: {
      type: String,
    },
    status: {
      type: String,
    },
    amountInCents: {
      type: Number,
    },
    ballQuantity: {
      type: Number,
    },
    paidAt: {
      type: Date,
      nullable: true,
    },
    createdAt: {
      type: Date,
      createDate: true,
    },
    updatedAt: {
      type: Date,
      updateDate: true,
    },
  },
  relations: {
    condominium: {
      type: "many-to-one",
      target: "Condominium",
      inverseSide: "payments",
      joinColumn: {
        name: "condominiumId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    plan: {
      type: "many-to-one",
      target: "Plan",
      inverseSide: "payments",
      joinColumn: {
        name: "planId",
      },
      eager: true,
      nullable: false,
      onDelete: "RESTRICT",
    },
  },
});
