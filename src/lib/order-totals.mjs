// Shared by checkout and order creation. Amounts are before VAT and shipping.
// Keep money in cents and allocate rounding differences across the order lines.
export function calculateDiscountedLines(amounts, discountRate = 0) {
  const rate = Number(discountRate);
  const validRate = Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0;
  const cents = amounts.map((amount) => {
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid line amount.");
    const value = Math.round((amount + Number.EPSILON) * 100);
    if (!Number.isSafeInteger(value)) throw new Error("Line amount exceeds supported range.");
    return value;
  });
  const subtotal = cents.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(subtotal)) throw new Error("Order amount exceeds supported range.");
  const discount = Math.round(subtotal * validRate / 100);
  const allocations = cents.map((value, index) => {
    const exact = value * validRate / 100;
    return { index, discount: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  const remaining = discount - allocations.reduce((sum, line) => sum + line.discount, 0);
  const ranked = [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) ranked[index].discount += 1;
  return {
    discountRate: validRate,
    subtotal: subtotal / 100,
    discount: discount / 100,
    total: (subtotal - discount) / 100,
    lines: cents.map((value, index) => ({
      subtotal: value / 100,
      total: (value - allocations[index].discount) / 100,
    })),
  };
}
