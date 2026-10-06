import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getWooCommerceBaseUrl } from "@/lib/woocommerce";
import { securityError } from "@/lib/request-security";

export function trustedClientIp(request) {
  // Only trust a header overwritten by the hosting proxy, never arbitrary forwarded input.
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TRUSTED_CLIENT_IP_HEADER;
  const value = header ? (request.headers.get(header) || "").trim() : "";
  if (isIP(value)) return value;
  return "unknown"; // Shared conservative bucket when no trusted proxy is configured.
}

export async function enforceRateLimit(request, action, identifier) {
  let failure = "configuration";
  let upstreamStatus = null;
  try {
    const secret = process.env.SESSION_SECRET;
    const username = process.env.WP_ADMIN_USER;
    const password = process.env.WP_APP_PASSWORD;
    if (!secret || secret.length < 32 || !username || !password) throw new Error("Rate limit backend not configured");
    const digest = (value) => createHmac("sha256", secret).update(value).digest("hex");
    failure = "network";
    const response = await fetch(getWooCommerceBaseUrl() + "/wp-json/maya-wholesale/v1/security/rate-limit", {
      method: "POST", redirect: "error", cache: "no-store",
      headers: { Authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64"), "Content-Type": "application/json" },
      body: JSON.stringify({ action, clientKey: digest("ip:" + trustedClientIp(request)), accountKey: digest("account:" + String(identifier).trim().toLowerCase()) }),
      signal: AbortSignal.timeout(10000),
    });
    upstreamStatus = response.status;
    failure = "upstream_http";
    if (!response.ok) throw new Error("Rate limit backend unavailable");
    failure = "invalid_response";
    const result = await response.json();
    if (typeof result?.allowed !== "boolean") throw new Error("Invalid rate limit response");
    if (!result.allowed) {
      return Response.json({ error: "Too many requests. Please wait before trying again." }, {
        status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(Math.max(1, Math.min(Number(result.retryAfter) || 900, 3600))) },
      });
    }
    return null;
  } catch (error) {
    console.error("Security rate limit backend unavailable.", {
      action: /^[a-z-]{1,40}$/.test(action) ? action : "unknown",
      failure: failure === "network" && ["TimeoutError", "AbortError"].includes(error?.name)
        ? "timeout" : failure,
      upstreamStatus,
    });
    return securityError("This service is temporarily unavailable. Please try again later.", 503);
  }
}
