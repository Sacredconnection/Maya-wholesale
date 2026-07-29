import {
  createCustomer,
  isWooCommerceConfigured,
  updateCustomerMeta,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { setWpUserRole } from "@/lib/wp-auth";
import { mapCustomerToUser, toWcAddress } from "@/lib/wc-mappers";
import { sendApplicationReceivedEmail } from "@/lib/transactional-email";
import { isSupportedCountryCode } from "@/lib/countries";
import {
  cleanText,
  isSameOrigin,
  isValidEmail,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";

function cleanAddress(value) {
  const address = value && typeof value === "object" ? value : {};
  return {
    street: cleanText(address.street, 160),
    neighborhood: cleanText(address.neighborhood, 100),
    city: cleanText(address.city, 100),
    state: cleanText(address.state, 100),
    zip: cleanText(address.zip, 24),
    country: cleanText(address.country, 2).toUpperCase(),
  };
}

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  if (!isWooCommerceConfigured()) return securityError("Registration backend unavailable.", 503);

  let body;
  try {
    body = await readJsonBody(request, 32 * 1024);
  } catch (err) {
    if (err instanceof RequestBodyError) return securityError(err.message, err.status);
    return securityError("Invalid JSON body.", 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const firstName = cleanText(body.firstName, 80);
  const lastName = cleanText(body.lastName, 80);
  const company = cleanText(body.company, 120);
  const phone = cleanText(body.phone, 40);
  const businessType = cleanText(body.businessType, 80);
  const shippingAddress = cleanAddress(body.shippingAddress);
  const billingAddress = cleanAddress(body.billingAddress);

  if (!isValidEmail(email)) return securityError("A valid email address is required.", 400);
  if (password.length < 12 || password.length > 128) {
    return securityError("Password must contain between 12 and 128 characters.", 400);
  }
  if (!firstName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.country || !phone) {
    return securityError("Required account and address fields are missing.", 400);
  }
  if (
    !isSupportedCountryCode(shippingAddress.country) ||
    !isSupportedCountryCode(billingAddress.country)
  ) {
    return securityError("Please select a valid Country/Region.", 400);
  }

  try {
    const customer = await createCustomer({
      email,
      username: email,
      password,
      first_name: firstName,
      last_name: lastName,
      billing: { first_name: firstName, last_name: lastName, company, email, phone, ...toWcAddress(billingAddress) },
      shipping: { first_name: firstName, last_name: lastName, company, ...toWcAddress(shippingAddress) },
      meta_data: [
        { key: "sc_channel", value: "wholesale-portal" },
        { key: "sc_approval_status", value: "pending" },
        ...(businessType ? [{ key: "sc_business_type", value: businessType }] : []),
      ],
    });

    await setWpUserRole(customer.id, "pending");
    let confirmationEmailSent = false;
    try {
      await sendApplicationReceivedEmail(customer);
      confirmationEmailSent = true;
      await updateCustomerMeta(customer, {
        sc_pending_email_sent_at: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error("Wholesale application confirmation email failed:", emailError);
    }
    return Response.json(
      { user: mapCustomerToUser(customer), confirmationEmailSent },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof WooCommerceApiError) {
      const code = err.details?.code || "";
      if (code.includes("email-exists") || code.includes("username-exists")) {
        return securityError("An account with this email already exists. Please log in.", 409);
      }
      console.error("POST /api/auth/register rejected:", err.details);
      return securityError("Registration was rejected. Please review the supplied details.", 422);
    }
    console.error("POST /api/auth/register failed:", err);
    return securityError("Registration failed. Please try again.", 502);
  }
}
