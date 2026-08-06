import { unstable_cache } from "next/cache";
import {
  getAllProducts,
  getCategories,
  getCustomerByEmail,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import {
  getRequiredCommerceStores,
  isCommerceStoreConfigured,
} from "@/lib/commerce-stores";
import { buildCategoryContext, isApprovedWholesaleCustomer, mapProductForRole } from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { getLocalDevSessionUser } from "@/lib/local-dev-auth";

const catalogCacheSeconds = (() => {
  const value = Number(process.env.WC_REVALIDATE_SECONDS);
  return Number.isFinite(value) && value >= 30 ? value : 300;
})();
async function loadStoreCatalog(storeId, storeName, role) {
  const [wcProducts, categories] = await Promise.all([
    getAllProducts(storeId),
    getCategories(storeId),
  ]);
  const categoryContext = buildCategoryContext(categories);
  const store = { id: storeId, name: storeName };

  return wcProducts.map((product) =>
    mapProductForRole(product, [], categoryContext, role, store)
  );
}

const getCachedStoreCatalog = unstable_cache(
  loadStoreCatalog,
  ["maya-herbs-catalog-v1"],
  { revalidate: catalogCacheSeconds, tags: ["woocommerce-catalog"] }
);

export async function GET(request) {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  const localDevUser = getLocalDevSessionUser(request, session);
  if (session.localDev && !localDevUser) {
    return securityError("Authentication required.", 401);
  }

  const requestedStoreId = new URL(request.url).searchParams.get("store");
  const allStores = getRequiredCommerceStores();
  const stores = requestedStoreId
    ? allStores.filter((store) => store.id === requestedStoreId)
    : allStores;
  if (stores.length === 0) return securityError("Unknown catalog store.", 400);

  const missingStores = stores.filter((store) => !isCommerceStoreConfigured(store.id));
  if (missingStores.length > 0) {
    return Response.json(
      {
        error: `Catalog backends are not configured: ${missingStores.map((store) => store.name).join(", ")}.`,
      },
      { status: 503 }
    );
  }

  try {
    let role = localDevUser?.role || null;
    if (!localDevUser) {
      const customer = await getCustomerByEmail(session.email);
      if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId) {
        return securityError("Authentication required.", 401);
      }
      role = customer.role;
    }

    const catalogs = await Promise.all(
      stores.map((store) => getCachedStoreCatalog(store.id, store.name, role))
    );
    const products = catalogs.flat().sort((a, b) => a.name.localeCompare(b.name));

    return Response.json(
      { products, stores: stores.map(({ id, name }) => ({ id, name })) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error(
      `GET /api/products failed for ${stores.map((store) => store.id).join(",")}:`,
      err
    );
    const upstreamStatus = err instanceof WooCommerceApiError ? err.status : 0;
    const status = upstreamStatus >= 400 ? 502 : 504;
    const storeNames = stores.map((store) => store.name).join(" and ");
    const errorMessage =
      upstreamStatus === 401
        ? `${storeNames} rejected its WooCommerce API credentials.`
        : `The ${storeNames} catalog took too long or could not be loaded.`;
    return Response.json(
      { error: errorMessage },
      { status }
    );
  }
}
