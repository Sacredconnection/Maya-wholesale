const POUCH_WEIGHTS_GRAMS = new Set([100, 250]);

export function productImageForOption(product, option) {
  const weightGrams = Number(option?.weightGrams);

  if (POUCH_WEIGHTS_GRAMS.has(weightGrams) && option?.image) {
    return option.image;
  }

  return product?.image || null;
}
