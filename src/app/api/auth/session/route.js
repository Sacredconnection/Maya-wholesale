import { getCustomerByEmail, isWooCommerceConfigured } from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, mapCustomerToUser } from "@/lib/wc-mappers";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { securityError } from "@/lib/request-security";
import {
  getLocalDevUser,
  isLocalDevAutoLoginConfigured,
  isLocalDevRequest,
  isLocalDevSession,
} from "@/lib/local-dev-auth";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    if (!isLocalDevRequest(request) || !isLocalDevAutoLoginConfigured()) {
      return securityError("Authentication required.", 401);
    }

    const user = getLocalDevUser();
    await createSession({ email: user.email, customerId: null, localDev: true });
    return Response.json(
      { user },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (session.localDev) {
    if (!isLocalDevRequest(request) || !isLocalDevSession(session)) {
      await deleteSession();
      return securityError("Authentication required.", 401);
    }

    return Response.json(
      { user: getLocalDevUser() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!isWooCommerceConfigured()) return securityError("Authentication backend unavailable.", 503);

  try {
    const customer = await getCustomerByEmail(session.email);
    if (
      !isApprovedWholesaleCustomer(customer) ||
      customer.id !== session.customerId ||
      (customer.email || "").toLowerCase() !== session.email
    ) {
      await deleteSession();
      return securityError("Authentication required.", 401);
    }
    return Response.json(
      { user: mapCustomerToUser(customer) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/auth/session failed:", err);
    return securityError("Authentication backend unavailable.", 502);
  }
}
