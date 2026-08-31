import {
  WORDPRESS_BACKEND_ORIGIN,
  wordpressBackendUrl,
} from "@/lib/deployment-urls.mjs";

export function GET() {
  let baseUrl = WORDPRESS_BACKEND_ORIGIN;

  try {
    baseUrl = wordpressBackendUrl(process.env.WOOCOMMERCE_URL, {
      allowLocalHttp: process.env.NODE_ENV !== "production",
    });
  } catch {
    // Use the known HTTPS WordPress origin when the environment value is invalid.
  }

  const resetUrl = new URL("/wp-login.php", baseUrl);
  resetUrl.searchParams.set("action", "lostpassword");
  return Response.redirect(resetUrl, 302);
}
