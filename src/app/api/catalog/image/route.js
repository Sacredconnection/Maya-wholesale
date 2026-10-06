import { getCommerceStoreOrigins } from "@/lib/commerce-stores";
import { normalizeImage } from "@/lib/safe-image.mjs";
import { readLimitedBody, RequestBodyError } from "@/lib/body-limits.mjs";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const decodeLegacyUtf8Sequence = (sequence) =>
  Buffer.from(
    Array.from(sequence, (character) => character.charCodeAt(0))
  ).toString("utf8");

const repairLegacyUtf8Url = (value) =>
  String(value || "")
    .replace(
      /[\u00f0-\u00f4][\u0080-\u00bf]{3}/g,
      decodeLegacyUtf8Sequence
    )
    .replace(
      /[\u00e0-\u00ef][\u0080-\u00bf]{2}/g,
      decodeLegacyUtf8Sequence
    )
    .replace(
      /[\u00c2-\u00df][\u0080-\u00bf]/g,
      decodeLegacyUtf8Sequence
    );

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("url");
    const wantsImageResponse = searchParams.get("format") === "image";
    if (!source) return new Response("Missing image URL.", { status: 400 });

    const target = new URL(repairLegacyUtf8Url(source));
    const catalogHosts = new Set(
      getCommerceStoreOrigins()
    );
    const allowed =
      target.protocol === "https:" &&
      !target.username && !target.password &&
      catalogHosts.has(target.origin) &&
      target.pathname.startsWith("/wp-content/uploads/");
    if (!allowed) return new Response("Image URL is not allowed.", { status: 403 });

    target.search = "";
    target.hash = "";
    const response = await fetch(target, {
      signal: AbortSignal.timeout(10000),
      redirect: "error",
      next: { revalidate: 86400 },
    });
    if (!response.ok) return new Response("Image unavailable.", { status: 502 });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new Response("Unsupported image type.", { status: 415 });
    }

    const image = await readLimitedBody(response, MAX_IMAGE_BYTES);
    if (image.byteLength > MAX_IMAGE_BYTES) {
      return new Response("Image is too large.", { status: 413 });
    }

    let optimized;
    try { optimized = await normalizeImage(image, 240); }
    catch { return new Response("Unsupported image type.", { status: 415 }); }

    const cacheHeaders = {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    };

    if (wantsImageResponse) {
      return new Response(optimized, {
        headers: {
          ...cacheHeaders,
          "Content-Type": "image/png",
        },
      });
    }

    return Response.json(
      {
        format: "PNG",
        base64: optimized.toString("base64"),
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    if (error instanceof RequestBodyError) return new Response(error.message, { status: error.status });
    console.error("GET /api/catalog/image failed:", error);
    return new Response("Image unavailable.", { status: 502 });
  }
}
