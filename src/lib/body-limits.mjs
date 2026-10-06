export class RequestBodyError extends Error {
  constructor(message, status) { super(message); this.name = "RequestBodyError"; this.status = status; }
}

// Bound streamed/chunked bodies before parsing or decoding, regardless of Content-Length.
export async function readLimitedBody(source, maxBytes) {
  const declared = Number(source.headers.get("content-length"));
  if (Number.isFinite(declared) && (declared < 0 || declared > maxBytes)) {
    throw new RequestBodyError("Request body is too large.", 413);
  }
  if (!source.body) throw new RequestBodyError("Missing request body.", 400);
  const reader = source.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError("Request body is too large.", 413);
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, length);
  } finally { reader.releaseLock(); }
}
