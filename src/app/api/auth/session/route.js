import { getCustomerByEmail, isWooCommerceConfigured } from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, mapCustomerToUser } from "@/lib/wc-mappers";
import { deleteSession, getSession } from "@/lib/session";
import { securityError } from "@/lib/request-security";

export async function GET() {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
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
