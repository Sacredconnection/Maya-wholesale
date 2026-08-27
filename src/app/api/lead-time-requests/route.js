import {
  getCustomerByEmail,
  getProductBySlug,
  getProductVariations,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { getRequiredCommerceStores, isCommerceStoreConfigured } from "@/lib/commerce-stores";
import { LEAD_TIME_POLICIES } from "@/lib/lead-time-policy.mjs";
import { isApprovedWholesaleCustomer, mapProductForRole } from "@/lib/wc-mappers";
import {
  cleanText,
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { getLocalDevSessionUser } from "@/lib/local-dev-auth";
import {
  isLeadTimeRequestEmailConfigured,
  sendLeadTimeRequestEmail,
} from "@/lib/transactional-email";

const MAX_REQUEST_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitState = new Map();

function parseProductIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.length > 240) return null;
  const separator = identifier.indexOf("~");
  const storeId = separator < 1 ? "maya-herbs" : identifier.slice(0, separator);
  const slug = separator < 1 ? identifier : identifier.slice(separator + 1);
  if (!/^[a-z0-9-]+$/i.test(storeId) || !/^[a-z0-9-]+$/i.test(slug)) return null;
  const store = getRequiredCommerceStores().find((entry) => entry.id === storeId);
  return store ? { store, slug } : null;
}

function isRateLimited(customerId) {
  const now = Date.now();
  const recent = (rateLimitState.get(customerId) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitState.set(customerId, recent);
    return true;
  }
  recent.push(now);
  rateLimitState.set(customerId, recent);
  return false;
}

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);

  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  const localDevUser = getLocalDevSessionUser(request, session);
  if (session.localDev) {
    if (!localDevUser) return securityError("Authentication required.", 401);
    return securityError("Temporary local accounts cannot request lead times.", 403);
  }
  if (!isLeadTimeRequestEmailConfigured()) {
    return securityError("Lead-time requests are temporarily unavailable.", 503);
  }

  let body;
  try {
    body = await readJsonBody(request, MAX_REQUEST_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) return securityError(error.message, error.status);
    return securityError("Invalid JSON body.", 400);
  }

  const productId = cleanText(body.productId, 240);
  const sku = cleanText(body.sku, 160);
  const note = cleanText(body.note, 1000, { multiline: true });
  const quantity = Number(body.quantity);
  const requestId = cleanText(body.requestId, 80);
  const identity = parseProductIdentifier(productId);

  if (!identity || !sku) return securityError("A valid product and format are required.", 400);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    return securityError("Requested quantity must be a whole number between 1 and 10,000.", 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return securityError("A valid request identifier is required.", 400);
  }
  if (!isCommerceStoreConfigured(identity.store.id)) {
    return securityError(`${identity.store.name} catalog backend unavailable.`, 503);
  }

  try {
    const [customer, wcProduct] = await Promise.all([
      getCustomerByEmail(session.email),
      getProductBySlug(identity.slug, identity.store.id, { revalidate: 0 }),
    ]);
    if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    if (!wcProduct) return securityError("Product not found.", 404);
    if (isRateLimited(customer.id)) {
      return securityError("Too many requests. Please wait a minute and try again.", 429);
    }

    const variations =
      wcProduct.type === "variable"
        ? await getProductVariations(wcProduct.id, identity.store.id, { revalidate: 0 })
        : [];
    const product = mapProductForRole(
      wcProduct,
      variations,
      {},
      customer.role,
      identity.store
    );
    const option = product.options.find((entry) => entry.sku === sku);
    if (!option) return securityError("Product format not found.", 404);
    if (option.inStock !== false) {
      return securityError("This product format is currently available to order.", 409);
    }
    if (option.leadTimePolicy !== LEAD_TIME_POLICIES.BULK_REQUEST) {
      return securityError("This product format does not require a lead-time request.", 409);
    }

    await sendLeadTimeRequestEmail({
      customer,
      product,
      option,
      quantity,
      note,
      requestId,
    });

    return Response.json(
      { sent: true, message: "Your request was sent to our sales team." },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/lead-time-requests failed:", error);
    const status = error instanceof WooCommerceApiError ? 502 : 500;
    return securityError("We could not send your request. Please try again shortly.", status);
  }
}
