import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import {
  BallInventoryMovementEntity,
  BallMovementKind,
} from "@/lib/db/entities/ball-inventory-movement.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPlanEntity } from "@/lib/db/entities/condominium-plan.entity";
import {
  CondominiumPaymentEntity,
  PaymentMethod,
  PaymentStatus,
  PaymentVerificationSource,
} from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity, PlanTier } from "@/lib/db/entities/plan.entity";
import { buildPixCharge } from "@/lib/payments/pix";
import type { DataSource } from "typeorm";

const administratorSeed = {
  name: "Operacao ServerBox",
  email: "admin@serverbox.local",
};

const planSeeds = [
  {
    slug: "basico",
    name: "Basico",
    tier: PlanTier.BASIC,
    description: "Para condominios com uso leve e foco em previsibilidade.",
    monthlyBallAllowance: 48,
    monthlyPriceInCents: 14900,
    overagePriceInCents: 1390,
    isDefault: true,
  },
  {
    slug: "intermediario",
    name: "Intermediario",
    tier: PlanTier.INTERMEDIATE,
    description:
      "Equilibrio entre custo e reposicao para quadras com uso frequente.",
    monthlyBallAllowance: 96,
    monthlyPriceInCents: 25900,
    overagePriceInCents: 1290,
    isDefault: true,
  },
  {
    slug: "premium",
    name: "Premium",
    tier: PlanTier.PREMIUM,
    description:
      "Reposicao intensa para condominios com agenda esportiva mais ativa.",
    monthlyBallAllowance: 160,
    monthlyPriceInCents: 38900,
    overagePriceInCents: 1190,
    isDefault: true,
  },
  {
    slug: "quadra-intensiva",
    name: "Quadra Intensiva",
    tier: PlanTier.CUSTOM,
    description:
      "Plano personalizado para condominios com uso competitivo ou aulas recorrentes.",
    monthlyBallAllowance: 220,
    monthlyPriceInCents: 46900,
    overagePriceInCents: 1090,
    isDefault: false,
  },
];

const condominiumSeeds = [
  {
    name: "Condominio Parque das Laranjeiras",
    city: "Sao Paulo",
    state: "SP",
    courts: 2,
    activeResidents: 180,
    customPlanSlugs: [],
    paidPlanSlug: "intermediario",
  },
  {
    name: "Residencial Costa Serena",
    city: "Santos",
    state: "SP",
    courts: 1,
    activeResidents: 96,
    customPlanSlugs: [],
    paidPlanSlug: "basico",
  },
  {
    name: "Jardins do Lago Clube",
    city: "Campinas",
    state: "SP",
    courts: 3,
    activeResidents: 260,
    customPlanSlugs: ["quadra-intensiva"],
    paidPlanSlug: "quadra-intensiva",
  },
];

function buildPaymentReference(index: number) {
  return `seed-payment-${String(index + 1).padStart(3, "0")}`;
}

export async function seedDatabase(dataSource: DataSource) {
  const administratorRepository = dataSource.getRepository(AdministratorEntity);
  const planRepository = dataSource.getRepository(PlanEntity);
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const condominiumPlanRepository =
    dataSource.getRepository(CondominiumPlanEntity);
  const paymentRepository = dataSource.getRepository(CondominiumPaymentEntity);
  const movementRepository = dataSource.getRepository(BallInventoryMovementEntity);

  let administrator = await administratorRepository.findOneBy({
    email: administratorSeed.email,
  });

  if (!administrator) {
    administrator = await administratorRepository.save(administratorSeed);
  }

  const hasAnyPlans = await planRepository.exists();
  if (!hasAnyPlans) {
    await planRepository.save(
      planSeeds.map((planSeed) => ({
        ...planSeed,
        isActive: true,
        createdBy: planSeed.isDefault ? null : administrator,
      })),
    );
  }

  const hasCondominiums = await condominiumRepository.exists();
  if (hasCondominiums) {
    return;
  }

  const plans = await planRepository.find();
  const planMap = new Map(plans.map((plan) => [plan.slug, plan]));
  const defaultPlans = plans.filter((plan) => plan.isDefault);

  for (const [index, condominiumSeed] of condominiumSeeds.entries()) {
    const condominium = condominiumRepository.create({
      name: condominiumSeed.name,
      city: condominiumSeed.city,
      state: condominiumSeed.state,
      courts: condominiumSeed.courts,
      activeResidents: condominiumSeed.activeResidents,
      primaryAdmin: administrator,
    });

    const savedCondominium = await condominiumRepository.save(condominium);
    const plansForCondominium = [
      ...defaultPlans,
      ...condominiumSeed.customPlanSlugs
        .map((slug) => planMap.get(slug))
        .filter((plan) => Boolean(plan)),
    ];

    await condominiumPlanRepository.save(
      plansForCondominium.map((plan, planIndex) => ({
        condominium: savedCondominium,
        plan,
        isFeatured: planIndex === 0,
      })),
    );

    const selectedPlan = planMap.get(condominiumSeed.paidPlanSlug);

    if (!selectedPlan) {
      continue;
    }

    const reference = buildPaymentReference(index);
    const pixCharge = buildPixCharge({
      amountInCents: selectedPlan.monthlyPriceInCents,
      condominiumName: savedCondominium.name,
      reference,
    });

    const payment = await paymentRepository.save({
      condominium: savedCondominium,
      plan: selectedPlan,
      reference,
      method: PaymentMethod.PIX,
      status: PaymentStatus.PAID,
      amountInCents: selectedPlan.monthlyPriceInCents,
      ballQuantity: selectedPlan.monthlyBallAllowance,
      pixTransactionId: pixCharge.pixTransactionId,
      pixQrCode: pixCharge.pixQrCode,
      pixCopyPasteCode: pixCharge.pixCopyPasteCode,
      pixExpiresAt: pixCharge.pixExpiresAt,
      paidAt: new Date(),
      verifiedAt: new Date(),
      verificationSource: PaymentVerificationSource.WEBHOOK,
    });

    await movementRepository.save({
      condominium: savedCondominium,
      payment,
      kind: BallMovementKind.CREDIT,
      quantity: selectedPlan.monthlyBallAllowance,
      reason: `Credito liberado pelo pagamento do plano ${selectedPlan.name}.`,
    });
  }
}
