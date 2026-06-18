export type StandalonePurchaseOffer = {
  id: string;
  name: string;
  tubeBrandId: string;
  tubeBrandName: string | null;
  ballQuantity: number;
  amountInCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDateString(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

export function getStandalonePurchaseOffers(
  offers: StandalonePurchaseOffer[] | null | undefined,
) {
  if (!Array.isArray(offers)) {
    return [];
  }

  return offers
    .map((offer) => {
      const id = normalizeText(offer?.id);
      const tubeBrandId = normalizeText(offer?.tubeBrandId);
      const name = normalizeText(offer?.name);
      const ballQuantity = Number(offer?.ballQuantity);
      const amountInCents = Number(offer?.amountInCents);

      return {
        id,
        name: name || "Compra avulsa de tubos",
        tubeBrandId,
        tubeBrandName: normalizeText(offer?.tubeBrandName) || null,
        ballQuantity,
        amountInCents,
        isActive: offer?.isActive !== false,
        createdAt: normalizeDateString(offer?.createdAt),
        updatedAt: normalizeDateString(offer?.updatedAt),
      } satisfies StandalonePurchaseOffer;
    })
    .filter(
      (offer) =>
        offer.id &&
        offer.tubeBrandId &&
        Number.isFinite(offer.ballQuantity) &&
        offer.ballQuantity > 0 &&
        Number.isFinite(offer.amountInCents) &&
        offer.amountInCents > 0,
    );
}
