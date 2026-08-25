export function productImageForOption(product, option) {
  const weightGrams = Number(option?.weightGrams);
  const primaryImage = product?.image || null;

  if (!Number.isFinite(weightGrams) || weightGrams === 1000) return primaryImage;

  const variationImage = option?.image;
  if (variationImage && variationImage !== primaryImage) return variationImage;

  return (product?.images || []).find((image) => image && image !== primaryImage) || primaryImage;
}
