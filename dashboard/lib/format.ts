/**
 * Formats water amount in mL or L.
 * If >= 1000 mL, returns "X.Y L" (or "X L" if whole number).
 * Otherwise returns "X mL".
 */
export function formatWater(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    // Round to 1 decimal place if not a whole number
    const formatted = liters % 1 === 0 ? liters.toString() : liters.toFixed(1);
    return `${formatted} L`;
  }
  return `${ml.toLocaleString()} mL`;
}
