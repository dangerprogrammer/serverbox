export enum PlanTier {
  BASIC = "basic",
  INTERMEDIATE = "intermediate",
  PREMIUM = "premium",
  CUSTOM = "custom",
}

export type CondominiumPlan = {
  id: string;
  slug: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyBallAllowance: number;
  monthlyPriceInCents: number;
  overagePriceInCents: number;
  isActive: boolean;
  createdByAdminId: string | null;
  createdByName: string | null;
};
