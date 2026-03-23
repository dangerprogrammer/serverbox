import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";
import type { CondominiumPayment } from "@/lib/db/entities/condominium-payment.entity";

export enum BallMovementKind {
  CREDIT = "credit",
  DEBIT = "debit",
}

export type BallInventoryMovement = {
  id: string;
  kind: BallMovementKind;
  quantity: number;
  reason: string;
  createdAt: Date;
  condominium: Condominium;
  payment: CondominiumPayment | null;
};

export const BallInventoryMovementEntity =
  new EntitySchema<BallInventoryMovement>({
    name: "BallInventoryMovement",
    tableName: "ball_inventory_movements",
    columns: {
      id: {
        type: "uuid",
        primary: true,
        generated: "uuid",
      },
      kind: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      reason: {
        type: String,
      },
      createdAt: {
        type: Date,
        createDate: true,
      },
    },
    relations: {
      condominium: {
        type: "many-to-one",
        target: "Condominium",
        inverseSide: "ballMovements",
        joinColumn: {
          name: "condominiumId",
        },
        nullable: false,
        onDelete: "CASCADE",
      },
      payment: {
        type: "many-to-one",
        target: "CondominiumPayment",
        joinColumn: {
          name: "paymentId",
        },
        nullable: true,
        onDelete: "SET NULL",
      },
    },
  });
