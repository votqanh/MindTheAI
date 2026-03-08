/**
 * Formats water amount in mL or L.
 * If >= 1000 mL, returns "X.Y L" (or "X L" if whole number).
 * Otherwise returns "X mL".
 */
function formatWater(ml) {
  if (ml >= 1000) {
    const liters = ml / 1000;
    const formatted = liters % 1 === 0 ? liters.toString() : liters.toFixed(1);
    return `${formatted} L`;
  }
  return `${ml.toLocaleString()} mL`;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MindTheAI_Format = { formatWater };
}
