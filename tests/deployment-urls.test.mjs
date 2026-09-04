import test from "node:test";
import assert from "node:assert/strict";
import {
  PUBLIC_SITE_ORIGIN,
  WORDPRESS_BACKEND_ORIGIN,
  normalizeServiceBaseUrl,
  wordpressBackendUrl,
  wordpressPasswordResetUrl,
} from "../src/lib/deployment-urls.mjs";

test("production domains keep the public portal and WordPress backend separate", () => {
  assert.equal(PUBLIC_SITE_ORIGIN, "https://wholesale.mayaherbs.com");
  assert.equal(
    WORDPRESS_BACKEND_ORIGIN,
    "https://backend-wholesale.mayaherbs.com"
  );
  assert.notEqual(PUBLIC_SITE_ORIGIN, WORDPRESS_BACKEND_ORIGIN);
});

test("WordPress falls back to the migrated HTTPS backend", () => {
  assert.equal(wordpressBackendUrl(), WORDPRESS_BACKEND_ORIGIN);
});

test("password recovery stays on the public wholesale domain", () => {
  assert.equal(
    wordpressPasswordResetUrl(),
    "https://wholesale.mayaherbs.com/wp-login.php?action=lostpassword"
  );
});

test("an external HTTP deployment value is upgraded to HTTPS", () => {
  assert.equal(
    wordpressBackendUrl("http://backend-wholesale.mayaherbs.com/"),
    WORDPRESS_BACKEND_ORIGIN
  );
});

test("a hostname without a scheme defaults to HTTPS", () => {
  assert.equal(
    wordpressBackendUrl("backend-wholesale.mayaherbs.com"),
    WORDPRESS_BACKEND_ORIGIN
  );
});

test("local HTTP is available only when explicitly enabled", () => {
  assert.equal(
    normalizeServiceBaseUrl("http://localhost:8080/", {
      allowLocalHttp: true,
      name: "LOCAL_SERVICE_URL",
    }),
    "http://localhost:8080"
  );
  assert.throws(
    () =>
      normalizeServiceBaseUrl("http://localhost:8080", {
        name: "LOCAL_SERVICE_URL",
      }),
    /must use HTTPS/
  );
});

test("service URLs reject embedded request data and unsupported protocols", () => {
  assert.throws(
    () => wordpressBackendUrl("https://example.com/?token=secret"),
    /must not contain credentials, query parameters, or a fragment/
  );
  assert.throws(
    () => wordpressBackendUrl("ftp://example.com"),
    /must use HTTPS/
  );
});

test("Next config proxies password recovery while keeping wp-admin on the backend", async () => {
  const previousUrl = process.env.WOOCOMMERCE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.WOOCOMMERCE_URL =
    "http://backend-wholesale.mayaherbs.com";
  process.env.NODE_ENV = "production";

  try {
    const { default: nextConfig } = await import(
      `../next.config.mjs?deployment-url-test=${Date.now()}`
    );
    const redirects = await nextConfig.redirects();
    assert.deepEqual(redirects, [
      {
        source: "/wp-admin/:path*",
        destination:
          "https://backend-wholesale.mayaherbs.com/wp-admin/:path*",
        permanent: false,
      },
    ]);
    assert.deepEqual(await nextConfig.rewrites(), [
      {
        source: "/wp-login.php",
        destination: "https://backend-wholesale.mayaherbs.com/wp-login.php",
      },
    ]);

    const headerRules = await nextConfig.headers();
    const globalHeaders = headerRules.find((rule) => rule.source === "/:path*");
    const csp = globalHeaders.headers.find(
      (header) => header.key === "Content-Security-Policy"
    ).value;
    assert.match(csp, /https:\/\/backend-wholesale\.mayaherbs\.com/);
    assert.doesNotMatch(csp, /http:\/\/backend-wholesale\.mayaherbs\.com/);
  } finally {
    if (previousUrl === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previousUrl;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
