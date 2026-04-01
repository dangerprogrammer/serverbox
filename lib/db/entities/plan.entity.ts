import { EntitySchema } from "typeorm";

import type { Administrator } from "@/lib/db/entities/administrator.entity";
import type { Condominium } from "@/lib/db/entities/condominium.entity";
import type { CondominiumPayment } from "@/lib/db/entities/condominium-payment.entity";

export enum PlanTier {
  BASIC = "basic",
  INTERMEDIATE = "intermediate",
  PREMIUM = "premium",
  CUSTOM = "custom",
}

export type Plan = {
  id: string;
  slug: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyBallAllowance: number;
  monthlyPriceInCents: number;
  overagePriceInCents: number;
  isActive: boolean;
  createdBy: Administrator | null;
  condominium: Condominium;
  payments: CondominiumPayment[];
};

export const PlanEntity = new EntitySchema<Plan>({
  name: "Plan",
  tableName: "plans",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    slug: {
      type: String,
    },
    name: {
      type: String,
    },
    tier: {
      type: String,
    },
    description: {
      type: "text",
    },
    monthlyBallAllowance: {
      type: Number,
    },
    monthlyPriceInCents: {
      type: Number,
    },
    overagePriceInCents: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  uniques: [
    {
      name: "UQ_plan_slug_per_condominium",
      columns: ["condominium", "slug"],
    },
  ],
  relations: {
    condominium: {
      type: "many-to-one",
      target: "Condominium",
      inverseSide: "plans",
      joinColumn: {
        name: "condominiumId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    createdBy: {
      type: "many-to-one",
      target: "Administrator",
      inverseSide: "plans",
      joinColumn: {
        name: "createdByAdminId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    payments: {
      type: "one-to-many",
      target: "CondominiumPayment",
      inverseSide: "plan",
    },
  },
});
