import {
  getCategories,
  getCustomerByEmail,
  getProductBySlug,
  getProductVariations,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { getRequiredCommerceStores, isCommerceStoreConfigured } from "@/lib/commerce-stores";
import { buildCategoryContext, isApprovedWholesaleCustomer, mapProductForRole } from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";

function parseProductIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.length > 240) return null;
  const separator = identifier.indexOf("~");
  const storeId = separator < 1 ? "maya-herbs" : identifier.slice(0, separator);
  const slug = separator < 1 ? identifier : identifier.slice(separator + 1);
  if (!/^[a-z0-9-]+$/i.test(storeId) || !/^[a-z0-9-]+$/i.test(slug)) return null;
  const store = getRequiredCommerceStores().find((entry) => entry.id === storeId);
  return store ? { store, slug } : null;
}

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);

  const { id } = await params;
  const identity = parseProductIdentifier(id);
  if (!identity) return securityError("Invalid product identifier.", 400);
  if (!isCommerceStoreConfigured(identity.store.id)) {
    return securityError(`${identity.store.name} catalog backend unavailable.`, 503);
  }

  try {
    const [customer, wcProduct] = await Promise.all([
      getCustomerByEmail(session.email),
      getProductBySlug(identity.slug, identity.store.id),
    ]);
    if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    if (!wcProduct) return Response.json({ error: "Product not found." }, { status: 404 });

    const [variations, categories] = await Promise.all([
      wcProduct.type === "variable"
        ? getProductVariations(wcProduct.id, identity.store.id)
        : [],
      getCategories(identity.store.id),
    ]);
    return Response.json(
      {
        product: mapProductForRole(
          wcProduct,
          variations,
          buildCategoryContext(categories),
          customer.role,
          identity.store
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error(`GET /api/products/${id} failed:`, err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: `Failed to load product from ${identity.store.name}.` },
      { status }
    );
  }
}
