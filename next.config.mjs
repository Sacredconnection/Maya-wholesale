import {
  WORDPRESS_BACKEND_ORIGIN,
  normalizeServiceBaseUrl,
} from "./src/lib/deployment-urls.mjs";

/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === "development";
const wordpressBaseUrl = normalizeServiceBaseUrl(
  process.env.WOOCOMMERCE_URL || WORDPRESS_BACKEND_ORIGIN,
  {
    allowLocalHttp: isDevelopment,
    name: "WOOCOMMERCE_URL",
  }
);
const commerceOrigins = [
  wordpressBaseUrl,
  process.env.RETAIL_WOOCOMMERCE_URL || "https://mayaherbs.com",
]
  .filter(Boolean)
  .flatMap((value) => {
    try {
      return [new URL(value).origin];
    } catch {
      return [];
    }
  })
  .filter((origin, index, origins) => origins.indexOf(origin) === index)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `img-src 'self' data: blob: ${commerceOrigins}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${commerceOrigins}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  // Reduce local memory pressure while keeping hot reload available.
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
    serverSourceMaps: false,
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  async redirects() {
    return [
      {
        source: "/wp-admin/:path*",
        destination: `${wordpressBaseUrl}/wp-admin/:path*`,
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/icons/hero-authentic-tribes-01.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/ngo/simbolo-conexao-ancestral.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },

  // Pin the workspace root — a stray lockfile in a parent folder makes
  // Turbopack infer the wrong root otherwise.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
