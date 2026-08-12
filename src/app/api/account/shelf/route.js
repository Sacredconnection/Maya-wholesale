import {
  getCustomerByEmail,
  isWooCommerceConfigured,
  updateCustomerMeta,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer } from "@/lib/wc-mappers";
import { getSession } from "@/lib/session";
import {
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";

const SHELF_META_KEY = "sc_my_shelf_products";
const MAX_SHELF_ITEMS = 200;
const PRODUCT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}~[a-z0-9][a-z0-9._-]{0,191}$/i;
const responseHeaders = { "Cache-Control": "private, no-store" };

function normalizeProductIds(value) {
  let entries = value;

  if (typeof entries === "string") {
    try {
      entries = JSON.parse(entries);
    } catch {
      entries = [];
    }
  }

  if (!Array.isArray(entries)) return [];

  return [...new Set(entries)]
    .filter(
      (productId) =>
        typeof productId === "string" && PRODUCT_ID_PATTERN.test(productId)
    )
    .slice(0, MAX_SHELF_ITEMS);
}

function customerShelf(customer) {
  const entry = [...(customer.meta_data || [])]
    .reverse()
    .find((item) => item.key === SHELF_META_KEY);
  return normalizeProductIds(entry?.value);
}

async function authenticatedCustomer() {
  const session = await getSession();
  if (!session) return null;

  const customer = await getCustomerByEmail(session.email);
  if (
    !isApprovedWholesaleCustomer(customer) ||
    customer.id !== session.customerId ||
    (customer.email || "").toLowerCase() !== session.email
  ) {
    return null;
  }

  return customer;
}

export async function GET() {
  if (!isWooCommerceConfigured()) {
    return securityError("Account backend unavailable.", 503);
  }

  try {
    const customer = await authenticatedCustomer();
    if (!customer) return securityError("Authentication required.", 401);

    return Response.json(
      { productIds: customerShelf(customer), limit: MAX_SHELF_ITEMS },
      { headers: responseHeaders }
    );
  } catch (error) {
    if (error instanceof WooCommerceApiError) {
      console.error("GET /api/account/shelf WooCommerce failure:", error.details);
    } else {
      console.error("GET /api/account/shelf failed:", error);
    }
    return securityError("My Shelf could not be loaded. Please try again.", 502);
  }
}

export async function PUT(request) {
  if (!isSameOrigin(request)) {
    return securityError("Cross-origin request rejected.", 403);
  }
  if (!isWooCommerceConfigured()) {
    return securityError("Account backend unavailable.", 503);
  }

  let body;
  try {
    body = await readJsonBody(request, 48 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return securityError(error.message, error.status);
    }
    return securityError("Invalid My Shelf request.", 400);
  }

  if (!Array.isArray(body.productIds)) {
    return securityError("productIds must be an array.", 400);
  }
  if (body.productIds.length > MAX_SHELF_ITEMS) {
    return securityError(`My Shelf can hold up to ${MAX_SHELF_ITEMS} products.`, 400);
  }

  const productIds = normalizeProductIds(body.productIds);
  if (productIds.length !== body.productIds.length) {
    return securityError("My Shelf contains an invalid product reference.", 400);
  }

  try {
    const customer = await authenticatedCustomer();
    if (!customer) return securityError("Authentication required.", 401);

    const updatedCustomer = await updateCustomerMeta(customer, {
      [SHELF_META_KEY]: productIds,
    });

    return Response.json(
      { productIds: customerShelf(updatedCustomer), limit: MAX_SHELF_ITEMS },
      { headers: responseHeaders }
    );
  } catch (error) {
    if (error instanceof WooCommerceApiError) {
      console.error("PUT /api/account/shelf WooCommerce failure:", error.details);
    } else {
      console.error("PUT /api/account/shelf failed:", error);
    }
    return securityError("My Shelf could not be saved. Please try again.", 502);
  }
}
