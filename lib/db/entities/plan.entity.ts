import { EntitySchema } from "typeorm";

import type { Administrator } from "@/lib/db/entities/administrator.entity";
import type { CondominiumPlan } from "@/lib/db/entities/condominium-plan.entity";
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
  isDefault: boolean;
  isActive: boolean;
  createdBy: Administrator | null;
  condominiumPlans: CondominiumPlan[];
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
      unique: true,
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
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
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
    condominiumPlans: {
      type: "one-to-many",
      target: "CondominiumPlan",
      inverseSide: "plan",
    },
    payments: {
      type: "one-to-many",
      target: "CondominiumPayment",
      inverseSide: "plan",
    },
  },
});
