import { EntitySchema } from "typeorm";

import type { Administrator } from "@/lib/db/entities/administrator.entity";
import type { BallInventoryMovement } from "@/lib/db/entities/ball-inventory-movement.entity";
import type { CondominiumCourt } from "@/lib/db/entities/condominium-court.entity";
import type { CondominiumPayment } from "@/lib/db/entities/condominium-payment.entity";
import type { CondominiumPlan } from "@/lib/domain/condominium-plan";
import type { TubeStockEntry } from "@/lib/domain/tube-stock";

export type Condominium = {
  id: string;
  name: string;
  city: string;
  state: string;
  courts: number;
  ballQuantity: number;
  tubeStockByBrand: TubeStockEntry[];
  createdAt: Date;
  updatedAt: Date;
  primaryAdmin: Administrator;
  plans: CondominiumPlan[];
  courtDetails: CondominiumCourt[];
  payments: CondominiumPayment[];
  ballMovements: BallInventoryMovement[];
};

export const CondominiumEntity = new EntitySchema<Condominium>({
  name: "Condominium",
  tableName: "condominiums",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
      length: 2,
    },
    courts: {
      type: Number,
      default: 1,
    },
    ballQuantity: {
      name: "activeResidents",
      type: Number,
      default: 0,
    },
    tubeStockByBrand: {
      type: "simple-json",
      default: "[]",
    },
    plans: {
      type: "simple-json",
      default: "[]",
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
    primaryAdmin: {
      type: "many-to-one",
      target: "Administrator",
      inverseSide: "condominiums",
      joinColumn: {
        name: "primaryAdminId",
      },
      nullable: false,
      onDelete: "RESTRICT",
    },
    payments: {
      type: "one-to-many",
      target: "CondominiumPayment",
      inverseSide: "condominium",
    },
    courtDetails: {
      type: "one-to-many",
      target: "CondominiumCourt",
      inverseSide: "condominium",
    },
    ballMovements: {
      type: "one-to-many",
      target: "BallInventoryMovement",
      inverseSide: "condominium",
    },
  },
});
