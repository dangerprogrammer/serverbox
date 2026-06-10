export type TubeStockEntry = {
  tubeBrandId: string;
  quantity: number;
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

export function sumTubeStockEntries(entries: TubeStockEntry[] | null | undefined) {
  return getTubeStockEntries(entries).reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
}

