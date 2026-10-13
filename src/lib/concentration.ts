export function calculateConcentration(massMg: number, volumeMl: number): number | null {
  if (!Number.isFinite(massMg) || !Number.isFinite(volumeMl) || massMg <= 0 || volumeMl <= 0) return null;
  const result = massMg / volumeMl;
  return Number.isFinite(result) && result > 0 ? result : null;
}
export function parseDecimal(value: string): number {
  if (!/^\d+(?:[.,]\d+)?$/.test(value.trim())) return NaN;
  return Number(value.trim().replace(',', '.'));
}
