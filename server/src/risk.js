export function calculateRisk(listing) {
  const quantity = Number(listing.quantity);
  const original = Number(listing.original_price);
  const discount = Number(listing.discount_price);

  const start = new Date(listing.pickup_start).getTime();
  const end = new Date(listing.pickup_end).getTime();
  const now = Date.now();

  const totalWindow = Math.max(end - start, 1);
  const remainingTime = Math.max(end - now, 0);
  const timePressure = Math.min(1, 1 - remainingTime / totalWindow);

  // A small normalized inventory pressure measure.
  // 10+ remaining items represents high inventory pressure.
  const inventoryPressure = Math.min(1, quantity / 10);

  const discountPercent = original > 0
    ? Math.round((1 - discount / original) * 100)
    : 0;

  const score = inventoryPressure * 0.4 + timePressure * 0.6;

  let risk = "LOW";
  if (score >= 0.65) risk = "HIGH";
  else if (score >= 0.35) risk = "MEDIUM";

  let suggestedDiscount = Math.max(discountPercent, 30);
  if (risk === "MEDIUM") suggestedDiscount = Math.max(suggestedDiscount, 45);
  if (risk === "HIGH") suggestedDiscount = Math.max(suggestedDiscount, 65);

  suggestedDiscount = Math.min(suggestedDiscount, 80);

  const suggestedPrice = Number(
    (original * (1 - suggestedDiscount / 100)).toFixed(2)
  );

  let reason = "Inventory and pickup time are currently manageable.";
  if (risk === "MEDIUM") {
    reason = "Inventory is meaningful and the pickup window is progressing.";
  }
  if (risk === "HIGH") {
    reason = "Pickup time is running short while meaningful inventory remains.";
  }

  return {
    risk,
    score: Number(score.toFixed(2)),
    discountPercent,
    suggestedDiscount,
    suggestedPrice,
    reason
  };
}
