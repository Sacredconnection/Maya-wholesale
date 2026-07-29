import {
  getCustomerByEmail,
  isWooCommerceConfigured,
  updateCustomer,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, mapCustomerToUser } from "@/lib/wc-mappers";
import { getSession } from "@/lib/session";
import {
  cleanText,
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";

const DISPLAY_NAME_META_KEY = "sc_display_name";

const metaUpdate = (customer, key, value) => {
  const existing = [...(customer.meta_data || [])]
    .reverse()
    .find((entry) => entry.key === key);
  return existing?.id ? { id: existing.id, key, value } : { key, value };
};

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

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return securityError("Cross-origin request rejected.", 403);
  }
  if (!isWooCommerceConfigured()) {
    return securityError("Account backend unavailable.", 503);
  }

  let body;
  try {
    body = await readJsonBody(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return securityError(error.message, error.status);
    }
    return securityError("Invalid account details.", 400);
  }

  const firstName = cleanText(body.firstName, 80);
  const lastName = cleanText(body.lastName, 80);
  const displayName = cleanText(body.displayName, 160);
  const phone = cleanText(body.phone, 40);

  if (!firstName || !lastName || !displayName || !phone) {
    return securityError("Please complete all required account fields.", 400);
  }

  try {
    const customer = await authenticatedCustomer();
    if (!customer) return securityError("Authentication required.", 401);

    const updatedCustomer = await updateCustomer(customer.id, {
      first_name: firstName,
      last_name: lastName,
      billing: {
        ...(customer.billing || {}),
        first_name: firstName,
        last_name: lastName,
        phone,
      },
      shipping: {
        ...(customer.shipping || {}),
        first_name: firstName,
        last_name: lastName,
      },
      meta_data: [
        metaUpdate(customer, DISPLAY_NAME_META_KEY, displayName),
      ],
    });

    return Response.json(
      { user: mapCustomerToUser(updatedCustomer) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof WooCommerceApiError) {
      console.error("POST /api/account/profile WooCommerce failure:", error.details);
    } else {
      console.error("POST /api/account/profile failed:", error);
    }
    return securityError("Account details could not be saved. Please try again.", 502);
  }
}
