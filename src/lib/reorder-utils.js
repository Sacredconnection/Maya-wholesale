const normalizeCatalogText = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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
    const productById = products.find(
      (product) => sameStore(product) && Number(product.wcId) === productId
    );
    if (productById) return productById;
  }

  const sku = normalizeCatalogText(item?.sku);
  return sku
    ? products.find(
        (product) =>
          sameStore(product) &&
          (normalizeCatalogText(product.sku) === sku ||
            product.options?.some(
              (option) => normalizeCatalogText(option.sku) === sku
            ))
      )
    : null;
};

export const findOptionIndex = (product, item) => {
  const variationId = Number(item?.variationId);

  if (Number.isSafeInteger(variationId) && variationId > 0) {
    const optionById = product.options?.findIndex(
      (option) => Number(option.wcVariationId) === variationId
    );
    if (optionById >= 0) return optionById;
  }

  const sku = normalizeCatalogText(item?.sku);
  if (!sku) return -1;
  return (
    product.options?.findIndex(
      (option) => normalizeCatalogText(option.sku) === sku
    ) ?? -1
  );
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
