export const PUBLIC_SITE_ORIGIN = "https://wholesale.mayaherbs.com";
export const WORDPRESS_BACKEND_ORIGIN =
  "https://backend-wholesale.mayaherbs.com";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const urlWithScheme = (value) =>
  /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;

/**
 * Resolve a service base URL without allowing production traffic over HTTP.
 * External HTTP values are upgraded to HTTPS so a missing `s` in deployment
 * configuration cannot disable the backend or leak credentials.
 */
export function normalizeServiceBaseUrl(
  value,
  { allowLocalHttp = false, name = "Service URL" } = {}
) {
  const rawValue = String(value || "").trim();
  if (!rawValue) throw new Error(`${name} is not configured.`);

  let url;
  try {
    url = new URL(urlWithScheme(rawValue));
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      `${name} must not contain credentials, query parameters, or a fragment.`
    );
  }

  const isLocal = LOCAL_HOSTNAMES.has(url.hostname);
  if (url.protocol === "http:" && !isLocal) {
    url.protocol = "https:";
  }

  const localHttpAllowed =
    url.protocol === "http:" && isLocal && allowLocalHttp;
  if (url.protocol !== "https:" && !localHttpAllowed) {
    throw new Error(`${name} must use HTTPS.`);
  }

  return url.toString().replace(/\/+$/, "");
}

export function wordpressBackendUrl(
  value,
  { allowLocalHttp = false } = {}
) {
  return normalizeServiceBaseUrl(value || WORDPRESS_BACKEND_ORIGIN, {
    allowLocalHttp,
    name: "WOOCOMMERCE_URL",
  });
}
