import { readFile } from "node:fs/promises";
import {
  getAllProducts,
  getCategories,
  getCustomerByEmail,
  getPublicStoreCatalog,
  getProductVariations,
  isWooCommerceConfigured,
  isWooCommerceStoreConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import {
  buildCategoryContext,
  isApprovedWholesaleCustomer,
  mapProductForRole,
  mapStoreProduct,
} from "@/lib/wc-mappers";
import { optionPriceForUser } from "@/lib/pricing";
import { getSession } from "@/lib/session";
import {
  getRequiredCommerceStores,
  isCommerceStoreConfigured,
  PRIMARY_STORE_ID,
} from "@/lib/commerce-stores";

const PAGE_SIZE = 30;
const VARIATION_FETCH_CONCURRENCY = 8;

export const runtime = "nodejs";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const queryText = (params, key, maxLength = 100) =>
  (params.get(key) || "").trim().slice(0, maxLength);

const positiveNumber = (value) => {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const pageNumber = (value) => {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const attributeSelections = (params) => {
  const selections = {};
  params.getAll("attribute").forEach((entry) => {
    const separator = entry.indexOf(":");
    if (separator <= 0) return;
    const key = entry.slice(0, separator).trim().slice(0, 80);
    const value = entry.slice(separator + 1).trim().slice(0, 120);
    if (key && value) selections[key] = value;
  });
  return selections;
};

const productHasAttribute = (product, key, value) =>
  (product.attributes || []).some(
    (attribute) =>
      attribute.key === key &&
      (attribute.values || []).some(
        (attributeValue) => normalize(attributeValue) === normalize(value)
      )
  );

async function mapWithConcurrency(items, concurrency, mapper) {
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
      { length: Math.min(concurrency, items.length) },
      () => worker()
    )
  );
  return results;
}

async function resolveCustomer() {
  const session = await getSession();
  if (!session) return null;

  const customer = await getCustomerByEmail(session.email);
  if (
    !isApprovedWholesaleCustomer(customer) ||
    customer.id !== session.customerId
  ) {
    return null;
  }

  return customer;
}

async function loadRestStoreCatalog(store, customer, catalogFetchOptions) {
  const [wcProducts, categories] = await Promise.all([
    getAllProducts(store.id, catalogFetchOptions),
    getCategories(store.id, catalogFetchOptions),
  ]);
  const categoryContext = buildCategoryContext(categories);
  const user = customer ? { role: customer.role } : null;

  return mapWithConcurrency(
    wcProducts,
    VARIATION_FETCH_CONCURRENCY,
    async (product) => {
      const fetchedVariations =
        product.type === "variable"
          ? await getProductVariations(
              product.id,
              store.id,
              catalogFetchOptions
            )
          : [];
      const variations = fetchedVariations;

      const mapped = mapProductForRole(
        product,
        variations,
        categoryContext,
        customer?.role || null,
        store
      );
      const catalogProduct = mapped;
      const prices = catalogProduct.options
        .map((option) => optionPriceForUser(option, user, mapped.category))
        .filter(Number.isFinite);

      return {
        ...catalogProduct,
        priceMin: prices.length ? Math.min(...prices) : 0,
        priceMax: prices.length ? Math.max(...prices) : 0,
        productUrl: `/product/${encodeURIComponent(catalogProduct.id)}`,
      };
    }
  ).then((products) => products.filter(Boolean));
}

async function loadLocalCatalogSnapshot() {
  const snapshotPath = process.env.CATALOG_SNAPSHOT_PATH;
  if (process.env.NODE_ENV === "production" || !snapshotPath) return null;

  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  if (!Array.isArray(snapshot.products)) {
    throw new Error("The local catalog snapshot must contain a products array.");
  }

  return snapshot.products
    .filter(
      (product) =>
        !product.storeId || product.storeId === PRIMARY_STORE_ID
    )
    .map((product) => {
      const options = Array.isArray(product.options)
        ? product.options.map((option) => ({
            ...option,
            price: Number(option.price) || 0,
            inStock: null,
            stockQuantity: null,
          }))
        : [];
      const prices = options
        .map((option) => option.price)
        .filter(Number.isFinite);

      return {
        ...product,
        attributes: Array.isArray(product.attributes) ? product.attributes : [],
        options,
        inStock: null,
        stockKnown: false,
        stockQuantity: null,
        priceMin: prices.length ? Math.min(...prices) : 0,
        priceMax: prices.length ? Math.max(...prices) : 0,
        productUrl: `/product/${product.id}`,
      };
    });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = queryText(searchParams, "q");
  const category = queryText(searchParams, "category");
  const tribe = queryText(searchParams, "tribe");
  const selectedAttributes = attributeSelections(searchParams);
  const minPrice = positiveNumber(searchParams.get("minPrice"));
  const maxPrice = positiveNumber(searchParams.get("maxPrice"));
  const onlyInStock = searchParams.get("inStock") === "true";
  const exportAll = searchParams.get("export") === "true";
  const requestedPage = pageNumber(searchParams.get("page"));
  const catalogFetchOptions = { revalidate: exportAll ? 0 : undefined };

  try {
    let customer = null;
    let products = null;
    let source = "snapshot";

    if (isWooCommerceConfigured()) {
      source = "woocommerce-rest";
      customer = await resolveCustomer();
      const configuredStores = getRequiredCommerceStores().filter((store) =>
        isCommerceStoreConfigured(store.id)
      );
      const catalogs = await Promise.all(
        configuredStores.map((store) =>
          loadRestStoreCatalog(store, customer, catalogFetchOptions)
        )
      );
      products = catalogs.flat();
    } else if (isWooCommerceStoreConfigured()) {
      source = "woocommerce-store";
      const storeCatalog = await getPublicStoreCatalog(
        PRIMARY_STORE_ID,
        catalogFetchOptions
      );
      const categoryContext = buildCategoryContext(storeCatalog.categories);
      const variationsByParent = new Map();
      storeCatalog.variations.forEach((variation) => {
        if (!variationsByParent.has(variation.parent)) {
          variationsByParent.set(variation.parent, []);
        }
        variationsByParent.get(variation.parent).push(variation);
      });

      products = storeCatalog.products.map((product) => {
        const mapped = mapStoreProduct(
          product,
          variationsByParent.get(product.id) || [],
          categoryContext
        );
        const prices = mapped.options
          .map((option) => Number(option.price))
          .filter(Number.isFinite);
        return {
          ...mapped,
          priceMin: prices.length ? Math.min(...prices) : 0,
          priceMax: prices.length ? Math.max(...prices) : 0,
          productUrl: `/product/${encodeURIComponent(mapped.id)}`,
        };
      });
    } else {
      products = await loadLocalCatalogSnapshot();
      if (!products) {
        return Response.json(
          { error: "Catalog backend unavailable." },
          { status: 503 }
        );
      }
    }

    const allPrices = products.flatMap((product) => [
      product.priceMin,
      product.priceMax,
    ]);
    const priceBounds = {
      min: allPrices.length ? Math.floor(Math.min(...allPrices)) : 0,
      max: allPrices.length ? Math.ceil(Math.max(...allPrices)) : 0,
    };

    const normalizedSearch = normalize(search);
    const normalizedCategory = normalize(category);
    const normalizedTribe = normalize(tribe);
    const matchesFilters = (
      product,
      {
        ignoreCategory = false,
        ignoreTribe = false,
        ignoreAttribute = "",
      } = {}
    ) => {
      const matchesSearch =
        !normalizedSearch ||
        normalize(product.name).includes(normalizedSearch) ||
        normalize(product.sku).includes(normalizedSearch) ||
        normalize(product.tribe).includes(normalizedSearch) ||
        normalize(product.storeName).includes(normalizedSearch) ||
        (product.attributes || []).some(
          (attribute) =>
            normalize(attribute.name).includes(normalizedSearch) ||
            (attribute.values || []).some((value) =>
              normalize(value).includes(normalizedSearch)
            )
        ) ||
        product.options.some((option) =>
          normalize(option.sku).includes(normalizedSearch)
        );
      const matchesCategory =
        ignoreCategory ||
        !normalizedCategory ||
        normalize(product.category) === normalizedCategory;
      const matchesTribe =
        ignoreTribe ||
        !normalizedTribe ||
        normalize(product.tribe) === normalizedTribe;
      const matchesAttributes = Object.entries(selectedAttributes).every(
        ([key, value]) =>
          key === ignoreAttribute || productHasAttribute(product, key, value)
      );
      const matchesMin = minPrice == null || product.priceMax >= minPrice;
      const matchesMax = maxPrice == null || product.priceMin <= maxPrice;
      const matchesStock = !onlyInStock || product.inStock === true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTribe &&
        matchesAttributes &&
        matchesMin &&
        matchesMax &&
        matchesStock
      );
    };

    const availableCategories = Array.from(
      new Set(
        products
          .filter((product) =>
            matchesFilters(product, { ignoreCategory: true })
          )
          .map((product) => product.category)
          .filter(Boolean)
      )
    ).sort((a, b) => normalize(a).localeCompare(normalize(b)));

    const availableTribes = Array.from(
      new Set(
        products
          .filter((product) => matchesFilters(product, { ignoreTribe: true }))
          .map((product) => product.tribe)
          .filter(
            (productTribe) =>
              productTribe && normalize(productTribe) !== normalizedCategory
          )
      )
    ).sort((a, b) => normalize(a).localeCompare(normalize(b)));

    const attributeDefinitions = new Map();
    products.forEach((product) => {
      (product.attributes || []).forEach((attribute) => {
        if (!attributeDefinitions.has(attribute.key)) {
          attributeDefinitions.set(attribute.key, attribute.name);
        }
      });
    });
    const availableAttributes = [...attributeDefinitions.entries()]
      .map(([key, name]) => {
        const candidates = products.filter((product) =>
          matchesFilters(product, { ignoreAttribute: key })
        );
        const counts = new Map();
        candidates.forEach((product) => {
          const attribute = (product.attributes || []).find(
            (item) => item.key === key
          );
          (attribute?.values || []).forEach((value) => {
            counts.set(value, (counts.get(value) || 0) + 1);
          });
        });
        const options = [...counts.entries()]
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => normalize(a.value).localeCompare(normalize(b.value)));
        return { key, name, options };
      })
      .filter(
        (attribute) =>
          attribute.options.length > 0 || selectedAttributes[attribute.key]
      )
      .sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

    const filtered = products
      .filter((product) => matchesFilters(product))
      .sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const page = exportAll ? 1 : Math.min(requestedPage, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    const visibleProducts = exportAll
      ? filtered
      : filtered.slice(start, start + PAGE_SIZE);

    return Response.json(
      {
        source,
        products: visibleProducts,
        pagination: {
          page,
          pageSize: exportAll ? totalItems : PAGE_SIZE,
          totalItems,
          totalPages: exportAll ? 1 : totalPages,
        },
        filters: {
          categories: availableCategories,
          tribes: availableTribes,
          attributes: availableAttributes,
          priceBounds,
        },
        viewer: {
          authenticated: Boolean(customer),
        },
        catalog: {
          fresh: exportAll,
          fetchedAt: new Date().toISOString(),
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/catalog failed:", error);
    const status =
      error instanceof WooCommerceApiError && error.status >= 400 ? 502 : 500;
    return Response.json(
      { error: "Failed to load the public catalog." },
      { status }
    );
  }
}
