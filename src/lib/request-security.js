import "server-only";

import { readLimitedBody, RequestBodyError } from "@/lib/body-limits.mjs";
export { RequestBodyError } from "@/lib/body-limits.mjs";

const JSON_CONTENT_TYPE = "application/json";
const MAX_JSON_BYTES = 64 * 1024;


export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJsonBody(request, maxBytes = MAX_JSON_BYTES) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== JSON_CONTENT_TYPE) {
    throw new RequestBodyError("Expected an application/json request body.", 415);
  }

  const bytes = await readLimitedBody(request, maxBytes);
  let body;
  try { body = JSON.parse(bytes.toString("utf8")); }
  catch { throw new RequestBodyError("Invalid JSON body.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestBodyError("Expected a JSON object.", 400);
  }
  return body;
}

export function cleanText(value, maxLength, { multiline = false } = {}) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function securityError(message, status) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}
