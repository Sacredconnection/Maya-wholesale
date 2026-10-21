import { after } from "next/server";
import { enforceRateLimit } from "@/lib/auth-rate-limit";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  isWooCommerceConfigured,
  updateCustomerMeta,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { toWcAddress } from "@/lib/wc-mappers";
import {
  sendApplicationNotificationEmail,
  sendApplicationReceivedEmail,
  sendRegistrationGuidanceEmail,
  sendRegistrationFailureEmail,
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
import { setWpUserRole } from "@/lib/wp-auth";

export const maxDuration = 120;

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

  const rateError = await enforceRateLimit(request, "register", email);
  if (rateError) return rateError;

  // All existence-dependent work runs only after the identical public response.
  after(async () => {
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
          { key: "pw_user_status", value: "pending" },
          ...VAT_META_KEYS.map((key) => ({ key, value: vatNumber })),
        ],
      });

      let pendingCustomer;
      try {
        const pendingRoleApplied = customer.role === "pending" ||
          await setWpUserRole(customer.id, "pending");
        if (!pendingRoleApplied) throw new Error("Pending role was not applied.");
        pendingCustomer = await getCustomerById(customer.id);
        if (pendingCustomer.role !== "pending") throw new Error("Pending role was not persisted.");
      } catch (approvalError) {
        console.error("Could not initialize pending approval:", approvalError);
        try {
          await deleteCustomer(customer.id);
        } catch (rollbackError) {
          console.error("Failed to roll back customer after pending-role assignment failed:", rollbackError);
        }
        await sendRegistrationFailureEmail(email).catch(() => console.error("Registration failure notification failed."));
        return;
      }

      try {
        await sendApplicationReceivedEmail(pendingCustomer);
        await updateCustomerMeta(pendingCustomer, {
          sc_pending_email_sent_at: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error("Wholesale application confirmation email failed:", emailError);
      }
      try {
        await sendApplicationNotificationEmail(pendingCustomer);
        await updateCustomerMeta(pendingCustomer, {
          sc_application_notification_sent_at: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error("Wholesale application sales notification failed:", emailError);
      }

    } catch (err) {
      const code = err instanceof WooCommerceApiError ? String(err.details?.code || "") : "";
      if (/email[-_]exists|username[-_]exists|existing_user_(email|login)/.test(code)) {
        await sendRegistrationGuidanceEmail(email).catch(() => console.error("Registration guidance email failed."));
        return;
      }
      console.error("Registration processing failed.", { code: code || "upstream_failure" });
      await sendRegistrationFailureEmail(email).catch(() => console.error("Registration failure notification failed."));
    }
  });
  return Response.json(
    { accepted: true, message: "Request received. Check your email for guidance on accessing your account." },
    { status: 202, headers: { "Cache-Control": "no-store" } }
  );
}
