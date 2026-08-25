const DEFAULT_RETAIL_URL = "https://mayaherbs.com";

const retailBaseUrl = () => {
  const rawUrl = (process.env.RETAIL_WOOCOMMERCE_URL || DEFAULT_RETAIL_URL).replace(/\/+$/, "");
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("RETAIL_WOOCOMMERCE_URL must use HTTPS.");
  return url.origin;
};

const imageIdentity = (source) => {
  try {
    return decodeURIComponent(new URL(source).pathname)
      .split("/")
      .pop()
      .toLowerCase()
      .replace(/\.webp$/, "")
      .replace(/\.(?:jpe?g|png)$/, "")
      .replace(/-\d+x\d+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } catch {
    return String(source || "").trim().toLowerCase();
  }
};

export async function getRetailGalleryBySku(sku) {
  const normalizedSku = String(sku || "").trim();
  if (!normalizedSku) return [];

  const url = new URL("/wp-json/wc/store/v1/products", retailBaseUrl());
  url.searchParams.set("sku", normalizedSku);
  url.searchParams.set("lang", "en");
  url.searchParams.set("per_page", "10");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
    next: { revalidate: 300, tags: ["retail-product-galleries"] },
  });
  if (!response.ok) return [];

  const products = await response.json();
  const product = Array.isArray(products)
    ? products.find((entry) => String(entry.sku || "").trim() === normalizedSku)
    : null;

  return (product?.images || []).map((image) => image?.src).filter(Boolean);
}

export function mergeProductGallery(currentImages = [], retailImages = []) {
  const merged = [];
  const identities = new Set();

  for (const source of [...currentImages, ...retailImages]) {
    if (!source) continue;
    const identity = imageIdentity(source);
    if (identities.has(identity)) continue;
    identities.add(identity);
    merged.push(source);
  }

  return merged;
}
