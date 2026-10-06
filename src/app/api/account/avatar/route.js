import { readLimitedBody, RequestBodyError } from "@/lib/body-limits.mjs";
import { normalizeImage } from "@/lib/safe-image.mjs";
import { enforceRateLimit } from "@/lib/auth-rate-limit";
import { isSessionCurrent } from "@/lib/session-customer.mjs";
import {
  getCustomerByEmail,
  isWooCommerceConfigured,
  updateCustomer,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, mapCustomerToUser } from "@/lib/wc-mappers";
import { getSession } from "@/lib/session";
import { getLocalDevSessionUser } from "@/lib/local-dev-auth";
import { isSameOrigin, securityError } from "@/lib/request-security";
import {
  isWordPressMediaUploadConfigured,
  uploadWordPressMedia,
} from "@/lib/wp-auth";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const AVATAR_META_KEY = "sc_profile_avatar_url";
const AVATAR_MEDIA_META_KEY = "sc_profile_avatar_media_id";


const metaUpdate = (customer, key, value) => {
  const existing = [...(customer.meta_data || [])].reverse().find((entry) => entry.key === key);
  return existing?.id ? { id: existing.id, key, value } : { key, value };
};

async function authenticatedCustomer() {
  const session = await getSession();
  if (!session) return null;
  const customer = await getCustomerByEmail(session.email);
  if (
    !isApprovedWholesaleCustomer(customer) ||
    !isSessionCurrent(session, customer) ||
    (customer.email || "").toLowerCase() !== session.email
  ) {
    return null;
  }
  return customer;
}

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const session = await getSession();
  if (session?.localDev) {
    if (!getLocalDevSessionUser(request, session)) {
      return securityError("Authentication required.", 401);
    }
    return securityError("Temporary local accounts are read-only.", 403);
  }
  if (!isWooCommerceConfigured()) return securityError("Account backend unavailable.", 503);
  if (!isWordPressMediaUploadConfigured()) {
    return securityError("Profile image storage is not configured.", 503);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    return securityError("Expected a profile image upload.", 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_AVATAR_BYTES + 64 * 1024) {
    return securityError("The profile image must be 4 MB or smaller.", 413);
  }

  try {
    const customer = await authenticatedCustomer();
    if (!customer) return securityError("Authentication required.", 401);

    const rateError = await enforceRateLimit(request, "avatar", session.email);
    if (rateError) return rateError;
    const payload = await readLimitedBody(request, MAX_AVATAR_BYTES + 64 * 1024);
    const formData = await new Response(payload, { headers: { "Content-Type": request.headers.get("content-type") } }).formData();
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return securityError("Choose a profile image to upload.", 400);
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return securityError("The profile image must be 4 MB or smaller.", 413);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let image;
    try { image = await normalizeImage(bytes, 512); }
    catch { return securityError("Choose a valid JPG, PNG, or WEBP image up to 16 megapixels.", 415); }

    const media = await uploadWordPressMedia({
      bytes: image,
      contentType: "image/png",
      filename: `sacred-profile-${customer.id}-${Date.now()}.png`,
      altText: `${customer.first_name || customer.username || "Partner"} profile photo`,
    });
    const updatedCustomer = await updateCustomer(customer.id, {
      meta_data: [
        metaUpdate(customer, AVATAR_META_KEY, media.url),
        metaUpdate(customer, AVATAR_MEDIA_META_KEY, String(media.id)),
      ],
    });

    return Response.json(
      { user: mapCustomerToUser(updatedCustomer) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof RequestBodyError) return securityError(error.message, error.status);
    if (error instanceof WooCommerceApiError) {
      console.error("POST /api/account/avatar WooCommerce failure:", error.details);
    } else {
      console.error("POST /api/account/avatar failed:", error);
    }
    return securityError("The profile photo could not be saved. Please try again.", 502);
  }
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const session = await getSession();
  if (session?.localDev) {
    if (!getLocalDevSessionUser(request, session)) {
      return securityError("Authentication required.", 401);
    }
    return securityError("Temporary local accounts are read-only.", 403);
  }
  if (!isWooCommerceConfigured()) return securityError("Account backend unavailable.", 503);

  try {
    const customer = await authenticatedCustomer();
    if (!customer) return securityError("Authentication required.", 401);

    const updatedCustomer = await updateCustomer(customer.id, {
      meta_data: [
        metaUpdate(customer, AVATAR_META_KEY, "__none__"),
        metaUpdate(customer, AVATAR_MEDIA_META_KEY, ""),
      ],
    });
    return Response.json(
      { user: mapCustomerToUser(updatedCustomer) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof WooCommerceApiError) {
      console.error("DELETE /api/account/avatar WooCommerce failure:", error.details);
    } else {
      console.error("DELETE /api/account/avatar failed:", error);
    }
    return securityError("The profile photo could not be removed. Please try again.", 502);
  }
}
