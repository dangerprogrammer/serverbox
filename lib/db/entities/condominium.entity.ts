import { EntitySchema } from "typeorm";

import type { Administrator } from "@/lib/db/entities/administrator.entity";
import type { CondominiumPlan } from "@/lib/db/entities/condominium-plan.entity";

export type Condominium = {
  id: string;
  name: string;
  city: string;
  state: string;
  courts: number;
  activeResidents: number;
  createdAt: Date;
  updatedAt: Date;
  primaryAdmin: Administrator;
  planAssignments: CondominiumPlan[];
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
    activeResidents: {
      type: Number,
      default: 0,
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
    planAssignments: {
      type: "one-to-many",
      target: "CondominiumPlan",
      inverseSide: "condominium",
    },
  },
});
