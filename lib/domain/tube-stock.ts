export type TubeStockEntry = {
  tubeBrandId: string;
  quantity: number;
};

type TubeBrandReference = {
  id?: string | null;
};

type CourtTubeBrandSelection = {
  tubeBrand?: TubeBrandReference | null;
  tubeBrands?: Array<TubeBrandReference | null> | null;
};

export function getTubeStockEntries(
  entries: TubeStockEntry[] | null | undefined,
) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      tubeBrandId: String(entry.tubeBrandId ?? "").trim(),
      quantity: Number(entry.quantity),
    }))
    .filter(
      (entry) =>
        entry.tubeBrandId &&
        Number.isFinite(entry.quantity) &&
        entry.quantity > 0,
    );
}

export function getActiveTubeBrandIds(
  courts: CourtTubeBrandSelection[] | null | undefined,
) {
  const brandIds = new Set<string>();

  for (const court of courts ?? []) {
    const tubeBrands =
      court.tubeBrands && court.tubeBrands.length > 0
        ? court.tubeBrands
        : [court.tubeBrand];

    tubeBrands.forEach((brand) => {
      const brandId = String(brand?.id ?? "").trim();

      if (brandId) {
        brandIds.add(brandId);
      }
    });
  }

  return brandIds;
}

export function getActiveTubeStockEntries(
  entries: TubeStockEntry[] | null | undefined,
  courts: CourtTubeBrandSelection[] | null | undefined,
) {
  const stockEntries = getTubeStockEntries(entries);
  const activeBrandIds = getActiveTubeBrandIds(courts);

  if (activeBrandIds.size === 0) {
    return stockEntries;
  }

  return stockEntries.filter((entry) => activeBrandIds.has(entry.tubeBrandId));
}

export function sumTubeStockEntries(entries: TubeStockEntry[] | null | undefined) {
  return getTubeStockEntries(entries).reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
}

export function sumActiveTubeStockEntries(
  entries: TubeStockEntry[] | null | undefined,
  courts: CourtTubeBrandSelection[] | null | undefined,
  fallback = 0,
) {
  const stockEntries = getTubeStockEntries(entries);

  if (stockEntries.length === 0) {
    return fallback;
  }

  return getActiveTubeStockEntries(stockEntries, courts).reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
}
