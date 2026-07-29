import { getCommerceStore, isCommerceStoreConfigured, PRIMARY_STORE_ID } from "@/lib/commerce-stores";

// Server-side WooCommerce REST API client.
// Credentials are read from env vars and never reach the browser — only import
// this module from Route Handlers (src/app/api/*) or Server Components.

if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/woocommerce.js is server-only. Client components must fetch /api/* routes instead."
  );
}

const API_VERSION = "wc/v3";
const STORE_API_VERSION = "wc/store/v1";

export const getWooCommerceCatalogCacheTag = (storeId = PRIMARY_STORE_ID) =>
  `woocommerce-catalog:${storeId}`;

export function getWooCommerceBaseUrl(storeId = PRIMARY_STORE_ID) {
  return getCommerceStore(storeId).baseUrl;
}

export function isWooCommerceConfigured(storeId = PRIMARY_STORE_ID) {
  return isCommerceStoreConfigured(storeId);
}

export function isWooCommerceStoreConfigured(storeId = PRIMARY_STORE_ID) {
  try {
    getWooCommerceBaseUrl(storeId);
    return true;
  } catch {
    return false;
  }
}

const requestTimeoutMs = () => {
  const n = Number(process.env.WC_REQUEST_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 1000 ? n : 15000;
};

const revalidateSeconds = () => {
  const n = Number(process.env.WC_REVALIDATE_SECONDS);
  return Number.isFinite(n) && n >= 0 ? n : 300;
};

export class WooCommerceApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "WooCommerceApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Low-level fetch against the WooCommerce REST API (Basic auth over HTTPS).
 * GET responses are cached in the Next.js data cache for WC_REVALIDATE_SECONDS.
 */
async function wcFetch(
  storeId,
  path,
  { params = {}, method = "GET", body, revalidate, tags = [] } = {}
) {
  if (!isWooCommerceConfigured(storeId)) {
    throw new WooCommerceApiError(
      `WooCommerce store ${storeId} is not configured.`,
      0
    );
  }

  const store = getCommerceStore(storeId);
  const url = new URL(`${store.baseUrl}/wp-json/${API_VERSION}/${path.replace(/^\/+/, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const auth = Buffer.from(
    `${store.consumerKey}:${store.consumerSecret}`
  ).toString("base64");
  const effectiveRevalidate = revalidate ?? revalidateSeconds();

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(requestTimeoutMs()),
    ...(method === "GET"
      ? effectiveRevalidate === 0
        ? { cache: "no-store" }
        : { next: { revalidate: effectiveRevalidate, tags } }
      : { cache: "no-store" }),
  });

  if (!res.ok) {
    let details;
    try {
      details = await res.json();
    } catch {
      // non-JSON error body
    }
    throw new WooCommerceApiError(
      `WooCommerce API ${method} ${path} failed with status ${res.status}`,
      res.status,
      details
    );
  }

  return { data: await res.json(), headers: res.headers };
}

async function storeFetch(storeId, path, { params = {}, revalidate, tags = [] } = {}) {
  if (!isWooCommerceStoreConfigured(storeId)) {
    throw new WooCommerceApiError(`WooCommerce store ${storeId} URL is not configured.`, 0);
  }

  const url = new URL(
    `${getWooCommerceBaseUrl(storeId)}/wp-json/${STORE_API_VERSION}/${path.replace(/^\/+/, "")}`
  );
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const effectiveRevalidate = revalidate ?? revalidateSeconds();
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(requestTimeoutMs()),
    ...(effectiveRevalidate === 0
      ? { cache: "no-store" }
      : { next: { revalidate: effectiveRevalidate, tags } }),
  });

  if (!res.ok) {
    let details;
    try {
      details = await res.json();
    } catch {
      // non-JSON error body
    }
    throw new WooCommerceApiError(
      `WooCommerce Store API GET ${path} failed with status ${res.status}`,
      res.status,
      details
    );
  }

  return { data: await res.json(), headers: res.headers };
}

async function getAllStoreProducts(storeId, { revalidate } = {}) {
  const { catalogLanguage } = getCommerceStore(storeId);
  const tags = [getWooCommerceCatalogCacheTag(storeId)];
  const products = [];
  let page = 1;
  for (;;) {
    const { data, headers } = await storeFetch(storeId, "products", {
      revalidate,
      tags,
      params: {
        per_page: 100,
        page,
        ...(catalogLanguage ? { lang: catalogLanguage } : {}),
      },
    });
    products.push(...data);
    const totalPages = Number(headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) break;
    page += 1;
  }
  return products;
}

async function getStoreCategories(storeId, { revalidate } = {}) {
  const { catalogLanguage } = getCommerceStore(storeId);
  const tags = [getWooCommerceCatalogCacheTag(storeId)];
  const categories = [];
  let page = 1;
  for (;;) {
    const { data, headers } = await storeFetch(
      storeId,
      "products/categories",
      {
        revalidate,
        tags,
        params: {
          per_page: 100,
          page,
          ...(catalogLanguage ? { lang: catalogLanguage } : {}),
        },
      }
    );
    categories.push(...data);
    const totalPages = Number(headers.get("x-wp-totalpages") || page);
    if (page >= totalPages || data.length < 100) break;
    page += 1;
  }
  return categories;
}

async function getStoreVariations(storeId, variationIds, { revalidate } = {}) {
  const uniqueIds = [...new Set(variationIds.filter(Boolean))];
  const tags = [getWooCommerceCatalogCacheTag(storeId)];
  const batches = [];
  for (let start = 0; start < uniqueIds.length; start += 100) {
    batches.push(uniqueIds.slice(start, start + 100));
  }

  const responses = await Promise.all(
    batches.map((ids) =>
      storeFetch(storeId, "products", {
        revalidate,
        tags,
        params: {
          type: "variation",
          include: ids.join(","),
          per_page: 100,
          orderby: "include",
        },
      })
    )
  );
  return responses.flatMap(({ data }) => data);
}

export async function getPublicStoreCatalog(storeId = PRIMARY_STORE_ID, { revalidate } = {}) {
  const [products, categories] = await Promise.all([
    getAllStoreProducts(storeId, { revalidate }),
    getStoreCategories(storeId, { revalidate }),
  ]);
  const variationReferences = products.flatMap((product) => product.variations || []);
  const referencesById = new Map(
    variationReferences.map((variation) => [variation.id, variation])
  );
  const variations = await getStoreVariations(
    storeId,
    [...referencesById.keys()],
    { revalidate }
  );

  return {
    products,
    categories,
    variations: variations.map((variation) => ({
      ...variation,
      attributes:
        variation.attributes?.length > 0
          ? variation.attributes
          : referencesById.get(variation.id)?.attributes || [],
    })),
  };
}

// ── Catalog ─────────────────────────────────────────────────────────

export async function getAllProducts(storeId = PRIMARY_STORE_ID, { revalidate } = {}) {
  const { catalogLanguage } = getCommerceStore(storeId);
  const tags = [getWooCommerceCatalogCacheTag(storeId)];
  const productParams = {
    per_page: 100,
    status: "publish",
    ...(catalogLanguage ? { lang: catalogLanguage } : {}),
    _fields: "id,slug,name,sku,type,price,weight,images,short_description,description,featured,tags,categories,attributes,meta_data,catalog_visibility,stock_status,stock_quantity",
  };
  const { data: firstPage, headers } = await wcFetch(storeId, "products", {
    revalidate,
    tags,
    params: { ...productParams, page: 1 },
  });
  const totalPages = Number(headers.get("x-wp-totalpages") || 1);
  if (totalPages <= 1) {
    return firstPage.filter((product) => product.catalog_visibility !== "hidden");
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map(async (page) => {
      const { data } = await wcFetch(storeId, "products", {
        revalidate,
        tags,
        params: { ...productParams, page },
      });
      return data;
    })
  );

  return [firstPage, ...remainingPages]
    .flat()
    .filter((product) => product.catalog_visibility !== "hidden");
}

export async function getProductBySlug(slug, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "products", { params: { slug, status: "publish" } });
  return data[0] || null;
}

export async function getProductVariations(
  productId,
  storeId = PRIMARY_STORE_ID,
  { revalidate } = {}
) {
  const tags = [getWooCommerceCatalogCacheTag(storeId)];
  const variationParams = {
    per_page: 100,
    _fields: "id,name,sku,price,weight,purchasable,attributes,meta_data,stock_status,stock_quantity",
  };
  const { data: firstPage, headers } = await wcFetch(
    storeId,
    `products/${productId}/variations`,
    {
      revalidate,
      tags,
      params: { ...variationParams, page: 1 },
    }
  );
  const totalPages = Number(headers.get("x-wp-totalpages") || 1);
  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map(
      async (page) => {
        const { data } = await wcFetch(
          storeId,
          `products/${productId}/variations`,
          {
            revalidate,
            tags,
            params: { ...variationParams, page },
          }
        );
        return data;
      }
    )
  );
  return [firstPage, ...remainingPages].flat();
}

// SKU lookup matches both products and variations (variations come back with
// type "variation" and a parent_id). Uncached — used while creating orders.
export async function findProductBySku(sku, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "products", { params: { sku }, revalidate: 0 });
  return data[0] || null;
}

export async function getProductById(productId, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `products/${productId}`, { revalidate: 0 });
  return data;
}

export async function getVariationById(productId, variationId, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `products/${productId}/variations/${variationId}`, {
    revalidate: 0,
  });
  return data;
}

export async function getCategories(storeId = PRIMARY_STORE_ID, { revalidate } = {}) {
  const { catalogLanguage } = getCommerceStore(storeId);
  const tags = [getWooCommerceCatalogCacheTag(storeId)];
  const categoryParams = {
    per_page: 100,
    hide_empty: true,
    ...(catalogLanguage ? { lang: catalogLanguage } : {}),
    _fields: "id,name,parent",
  };
  const { data: firstPage, headers } = await wcFetch(
    storeId,
    "products/categories",
    {
      revalidate,
      tags,
      params: { ...categoryParams, page: 1 },
    }
  );
  const totalPages = Number(headers.get("x-wp-totalpages") || 1);
  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map(
      async (page) => {
        const { data } = await wcFetch(storeId, "products/categories", {
          revalidate,
          tags,
          params: { ...categoryParams, page },
        });
        return data;
      }
    )
  );
  return [firstPage, ...remainingPages].flat();
}

// ── Customers ───────────────────────────────────────────────────────

export async function createCustomer(customer, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "customers", { method: "POST", body: customer });
  return data;
}

export async function getCustomerByEmail(email, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "customers", {
    params: { email, role: "all", per_page: 10 },
    revalidate: 0,
  });
  return (
    data.find((c) => (c.email || "").toLowerCase() === email.toLowerCase()) || null
  );
}

export async function getCustomerById(customerId, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `customers/${customerId}`, { revalidate: 0 });
  return data;
}

export async function updateCustomer(customerId, updates, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `customers/${customerId}`, {
    method: "PUT",
    body: updates,
  });
  return data;
}

export async function updateCustomerMeta(customer, values, storeId = PRIMARY_STORE_ID) {
  const entries = customer.meta_data || [];
  const metaData = Object.entries(values).map(([key, value]) => {
    const existing = [...entries].reverse().find((entry) => entry.key === key);
    return existing?.id ? { id: existing.id, key, value } : { key, value };
  });
  return updateCustomer(customer.id, { meta_data: metaData }, storeId);
}

// ── Orders ──────────────────────────────────────────────────────────

export async function createOrder(order, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "orders", { method: "POST", body: order });
  return data;
}

// WC core has no billing-email filter, so search by the email and then keep
// only exact billing matches. Uncached so new orders show up immediately.
export async function getOrdersByEmail(email, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "orders", {
    params: { search: email, per_page: 50, orderby: "date", order: "desc" },
    revalidate: 0,
  });
  return data.filter(
    (order) => (order.billing?.email || "").toLowerCase() === email.toLowerCase()
  );
}
