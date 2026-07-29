import "server-only";

const JSON_CONTENT_TYPE = "application/json";
const MAX_JSON_BYTES = 64 * 1024;

export class RequestBodyError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

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

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && (contentLength < 0 || contentLength > maxBytes)) {
    throw new RequestBodyError(`JSON body exceeds the ${maxBytes}-byte limit.`, 413);
  }
  if (!request.body) throw new RequestBodyError("Missing JSON body.", 400);

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RequestBodyError(`JSON body exceeds the ${maxBytes}-byte limit.`, 413);
    }
    chunks.push(Buffer.from(value));
  }

  try {
    return JSON.parse(Buffer.concat(chunks, totalBytes).toString("utf8"));
  } catch {
    throw new RequestBodyError("Invalid JSON body.", 400);
  }
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
