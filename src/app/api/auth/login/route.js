import { verifyWpCredentials } from "@/lib/wp-auth";
import { getCustomerByEmail, isWooCommerceConfigured } from "@/lib/woocommerce";
import { mapCustomerToUser } from "@/lib/wc-mappers";
import {
  cleanText,
  isSameOrigin,
  isValidEmail,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";
import { createSession } from "@/lib/session";

const PENDING_ROLES = ["pending", "customer"];

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  if (!isWooCommerceConfigured()) return securityError("Authentication backend unavailable.", 503);

  let body;
  try {
    body = await readJsonBody(request, 8 * 1024);
  } catch (err) {
    if (err instanceof RequestBodyError) return securityError(err.message, err.status);
    return securityError("Invalid JSON body.", 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email) || !password || password.length > 256) {
    return securityError("A valid email and password are required.", 400);
  }

  let authenticationStage = "WordPress credential verification";
  try {
    const { valid } = await verifyWpCredentials(email, password);
    if (!valid) return securityError("Invalid email or password.", 401);

    authenticationStage = "WooCommerce customer lookup";
    const customer = await getCustomerByEmail(email);
    if (!customer || PENDING_ROLES.includes((customer.role || "").toLowerCase())) {
      return securityError(
        "Your wholesale account is pending approval by the administration.",
        403
      );
    }

    const user = mapCustomerToUser(customer);
    authenticationStage = "session creation";
    await createSession({ email: user.email, customerId: customer.id });
    return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(`POST /api/auth/login failed during ${authenticationStage}:`, err);
    return securityError("Could not reach the authentication backend. Please try again.", 502);
  }
}
