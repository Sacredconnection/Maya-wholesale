const FALLBACK_WORDPRESS_URL = "https://wholesale.mayaherbs.com";

export function GET() {
  let baseUrl = FALLBACK_WORDPRESS_URL;

  try {
    const configuredUrl = new URL(process.env.WOOCOMMERCE_URL || FALLBACK_WORDPRESS_URL);
    if (configuredUrl.protocol === "https:") baseUrl = configuredUrl.origin;
  } catch {
    // Use the known HTTPS WordPress origin when the environment value is invalid.
  }

  const resetUrl = new URL("/wp-login.php", baseUrl);
  resetUrl.searchParams.set("action", "lostpassword");
  return Response.redirect(resetUrl, 302);
}
