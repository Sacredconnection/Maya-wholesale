import {
  createCustomer,
  isWooCommerceConfigured,
  updateCustomerMeta,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { mapCustomerToUser, toWcAddress } from "@/lib/wc-mappers";
import {
  sendApplicationNotificationEmail,
  sendApplicationReceivedEmail,
} from "@/lib/transactional-email";
import { isSupportedCountryCode } from "@/lib/countries";
import {
  cleanText,
  isSameOrigin,
  isValidEmail,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";

const VAT_META_KEYS = ["billing_vat", "vat_number", "maya_vat_number"];

const splitFullName = (name) => {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" "),
  };
};

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

  const name = cleanText(body.name, 160);
  const email = cleanText(body.email, 254).toLowerCase();
  const { firstName, lastName } = splitFullName(name);
  const vatNumber = cleanText(body.vatNumber, 64);
  const address = cleanAddress({
    street: body.address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    country: body.country,
  });

  if (!name) return securityError("Name is required.", 400);
  if (!isValidEmail(email) || email.length > 60) {
    return securityError("A valid email address with no more than 60 characters is required.", 400);
  }
  if (
    !vatNumber ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.zip ||
    !address.country
  ) {
    return securityError("Complete all registration and address fields.", 400);
  }
  if (!isSupportedCountryCode(address.country)) {
    return securityError("Please select a valid Country.", 400);
  }

  try {
    const customer = await createCustomer({
      email,
      username: email,
      first_name: firstName,
      last_name: lastName,
      billing: { first_name: firstName, last_name: lastName, email, ...toWcAddress(address) },
      shipping: { first_name: firstName, last_name: lastName, ...toWcAddress(address) },
      // Preserve the field names used by Maya's legacy WordPress registration
      // validation. WooCommerce ignores unknown properties when persisting the
      // customer, but WordPress hooks can still read them from the REST request.
      vat_number: vatNumber,
      billing_vat: vatNumber,
      maya_vat_number: vatNumber,
      address: address.street,
      city: address.city,
      state: address.state,
      postcode: address.zip,
      zip: address.zip,
      country: address.country,
      meta_data: [
        { key: "sc_channel", value: "wholesale-portal" },
        { key: "sc_approval_status", value: "pending" },
        { key: "sc_display_name", value: name },
        { key: "maya_account_status", value: "pending_approval" },
        { key: "maya_account_status_label", value: "Pending approval" },
        ...VAT_META_KEYS.map((key) => ({ key, value: vatNumber })),
      ],
    });

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
    try {
      await sendApplicationNotificationEmail(customer);
      await updateCustomerMeta(customer, {
        sc_application_notification_sent_at: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error("Wholesale application sales notification failed:", emailError);
    }
    return Response.json(
      { user: mapCustomerToUser(customer), confirmationEmailSent },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof WooCommerceApiError) {
      const code = err.details?.code || "";
      if (code.includes("email-exists") || code.includes("username-exists")) {
        return securityError(
          "An account with this email already exists. Please sign in or use another email address.",
          409
        );
      }
      console.error("POST /api/auth/register rejected:", err.details);
      const upstreamMessage = cleanText(err.details?.message, 240);
      return securityError(
        upstreamMessage || "WordPress rejected the registration details.",
        422
      );
    }
    console.error("POST /api/auth/register failed:", err);
    return securityError("Registration failed. Please try again.", 502);
  }
}
