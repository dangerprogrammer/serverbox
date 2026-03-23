import { EntitySchema } from "typeorm";

import type { Condominium } from "@/lib/db/entities/condominium.entity";
import type { Plan } from "@/lib/db/entities/plan.entity";

export type CondominiumPlan = {
  id: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  condominium: Condominium;
  plan: Plan;
};

export const CondominiumPlanEntity = new EntitySchema<CondominiumPlan>({
  name: "CondominiumPlan",
  tableName: "condominium_plans",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    isFeatured: {
      type: Boolean,
      default: false,
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
  uniques: [
    {
      name: "UQ_condominium_plan_pair",
      columns: ["condominium", "plan"],
    },
  ],
  relations: {
    condominium: {
      type: "many-to-one",
      target: "Condominium",
      inverseSide: "planAssignments",
      joinColumn: {
        name: "condominiumId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    plan: {
      type: "many-to-one",
      target: "Plan",
      inverseSide: "condominiumPlans",
      joinColumn: {
        name: "planId",
      },
      eager: true,
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
