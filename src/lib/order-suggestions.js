export const SUGGESTED_ORDER_RECIPES = [
  {
    id: "maya-essentials",
    title: "Maya Essentials",
    eyebrow: "Balanced assortment",
    description:
      "A varied starter selection built from currently available Maya Herbs products.",
    terms: [],
    preferredWeight: 100,
  },
  {
    id: "traditional-rapeh",
    title: "Traditional Rapeh Selection",
    eyebrow: "Heritage assortment",
    description:
      "A focused selection of products explicitly identified with the traditional Rapeh range.",
    terms: ["rape", "rapeh", "rapé"],
    preferredWeight: 50,
    strict: true,
  },
  {
    id: "botanical-exploration",
    title: "Botanical Exploration",
    eyebrow: "Plant-focused assortment",
    description:
      "A broad botanical selection assembled from live category and product information.",
    terms: ["botanical", "herb", "plant", "extract"],
    preferredWeight: 100,
  },
  {
    id: "ceremonial-aromatics",
    title: "Ceremonial Aromatics",
    eyebrow: "Aromatic assortment",
    description:
      "A curated mix of incense, resins, and aromatic products when currently available.",
    terms: ["incense", "resin", "aromatic", "ceremonial"],
    preferredWeight: 100,
    strict: true,
  },
  {
    id: "tobacco-free",
    title: "Tobacco-Free Discovery",
    eyebrow: "Alternative assortment",
    description:
      "Only products explicitly classified as tobacco-free in the live catalog.",
    terms: ["tobacco free", "tobacco-free", "tobaccofree"],
    preferredWeight: 100,
    strict: true,
  },
];

export const normalizeSuggestionText = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const productSearchText = (product) =>
  normalizeSuggestionText(
    [
      product?.name,
      product?.category,
      product?.tribe,
      ...(product?.attributes || []).flatMap((attribute) => [
        attribute.name,
        ...(attribute.values || []),
      ]),
    ]
      .filter(Boolean)
      .join(" ")
  );

export const recipeScore = (product, recipe) => {
  if (!recipe.terms.length) return product?.isNew ? 2 : 1;
  const haystack = productSearchText(product);
  return recipe.terms.reduce(
    (score, term) =>
      score + (haystack.includes(normalizeSuggestionText(term)) ? 3 : 0),
    0
  );
};

export const isStockedOption = (option, quantity = 1) =>
  Boolean(
    option &&
      option.inStock !== false &&
      (!option.stockStatus || option.stockStatus === "instock") &&
      (option.stockQuantity == null ||
        Number(option.stockQuantity) >= Math.max(1, Number(quantity) || 1))
  );

export const findCatalogProduct = (products, item, storeId) => {
  const sameStore = (product) =>
    (product.storeId || "maya-herbs") === (storeId || "maya-herbs");
  const productId = Number(item?.productId);
  if (Number.isSafeInteger(productId) && productId > 0) {
    const byId = products.find(
      (product) => sameStore(product) && Number(product.wcId) === productId
    );
    if (byId) return byId;
  }

  const sku = normalizeSuggestionText(item?.sku);
  return sku
    ? products.find(
        (product) =>
          sameStore(product) &&
          (normalizeSuggestionText(product.sku) === sku ||
            product.options?.some(
              (option) => normalizeSuggestionText(option.sku) === sku
            ))
      )
    : null;
};

export const findOptionIndex = (product, item) => {
  const variationId = Number(item?.variationId);
  if (Number.isSafeInteger(variationId) && variationId > 0) {
    const byId = product.options?.findIndex(
      (option) => Number(option.wcVariationId) === variationId
    );
    if (byId >= 0) return byId;
  }

  const sku = normalizeSuggestionText(item?.sku);
  if (!sku) return -1;
  return product.options?.findIndex(
    (option) => normalizeSuggestionText(option.sku) === sku
  ) ?? -1;
};

export const preferredStockedOptionIndex = (product, preferredWeight = 100) => {
  const candidates = (product.options || [])
    .map((option, optionIndex) => ({ option, optionIndex }))
    .filter(({ option }) => isStockedOption(option))
    .sort((left, right) => {
      const leftDistance = Math.abs(
        Number(left.option.weightGrams || preferredWeight) - preferredWeight
      );
      const rightDistance = Math.abs(
        Number(right.option.weightGrams || preferredWeight) - preferredWeight
      );
      return leftDistance - rightDistance;
    });
  return candidates[0]?.optionIndex ?? -1;
};

export const rankHistoricalItems = (orders) => {
  const stats = new Map();
  (orders || []).slice(0, 12).forEach((order, orderIndex) => {
    const recencyWeight = Math.max(1, 12 - orderIndex);
    (order.items || []).forEach((item) => {
      const key =
        `${order.storeId || "maya-herbs"}:` +
        `${item.variationId || item.productId || normalizeSuggestionText(item.sku)}`;
      const current = stats.get(key) || {
        ...item,
        storeId: order.storeId,
        score: 0,
        occurrences: 0,
        totalQuantity: 0,
      };
      const quantity = Math.max(1, Number(item.quantity) || 1);
      current.score += recencyWeight * quantity;
      current.occurrences += 1;
      current.totalQuantity += quantity;
      stats.set(key, current);
    });
  });

  return [...stats.values()]
    .sort((left, right) => right.score - left.score)
    .map((item) => ({
      ...item,
      suggestedQuantity: Math.max(
        1,
        Math.round(item.totalQuantity / item.occurrences)
      ),
    }));
};

export async function mapWithClientConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), items.length) },
      () => worker()
    )
  );
  return results;
}
