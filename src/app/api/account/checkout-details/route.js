import { getSession } from "@/lib/session";
import { getCustomerByEmail, updateCustomer } from "@/lib/woocommerce";
import { isSessionCurrent } from "@/lib/session-customer.mjs";
import { isApprovedWholesaleCustomer, mapCustomerToUser, toWcAddress } from "@/lib/wc-mappers";
import { isSupportedCountryCode } from "@/lib/countries";
import { isSameOrigin, cleanText, readJsonBody, RequestBodyError, securityError } from "@/lib/request-security";
const addressFields = ["street", "neighborhood", "city", "state", "zip", "country"];
const cleanAddress = address => Object.fromEntries(addressFields.map(key => [key, cleanText(address?.[key], key === "country" ? 2 : 160)]));
const validAddress = address => address.street && address.city && address.zip && isSupportedCountryCode(address.country);
export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  if (session.localDev) return securityError("Temporary local accounts are read-only.", 403);
  try {
    const body = await readJsonBody(request, 8192);
    const firstName = cleanText(body.firstName, 80), lastName = cleanText(body.lastName, 80), company = cleanText(body.company, 160);
    const billing = cleanAddress(body.billingAddress), shipping = cleanAddress(body.shippingAddress);
    if (!firstName || !lastName || !validAddress(billing) || !validAddress(shipping)) return securityError("Complete your contact, billing and delivery details.", 400);
    const customer = await getCustomerByEmail(session.email);
    if (!isApprovedWholesaleCustomer(customer) || !isSessionCurrent(session, customer)) return securityError("Authentication required.", 401);
    const names = { first_name: firstName, last_name: lastName, company };
    const updated = await updateCustomer(customer.id, { first_name: firstName, last_name: lastName, billing: { ...customer.billing, ...names, ...toWcAddress(billing) }, shipping: { ...customer.shipping, ...names, ...toWcAddress(shipping) } });
    return Response.json({ user: mapCustomerToUser(updated) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestBodyError) return securityError(error.message, error.status);
    console.error("Saving checkout details failed.");
    return securityError("Your details could not be saved. Please try again.", 502);
  }
}
