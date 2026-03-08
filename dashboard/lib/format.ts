/**
 * Formats water amount in mL or L.
 * If >= 1000 mL, returns "X.Y L" (or "X L" if whole number).
 * Otherwise returns "X mL".
 */
export function formatWater(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    const formatted = liters % 1 === 0 ? liters.toString() : liters.toFixed(1);
    return `${formatted} L`;
  }
  return `${ml.toLocaleString()} mL`;
}

export function formatCups(ml: number): string {
  const cups = ml / 250;
  return cups.toFixed(1);
}

export function formatWaterWithCups(ml: number): string {
  const water = formatWater(ml);
  const cups = formatCups(ml);
  return `${water} (${cups} cups)`;
}
