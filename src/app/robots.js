export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/catalog",
        "/checkout",
        "/digital-catalog",
        "/my-account",
        "/order-received",
        "/product/",
      ],
    },
    sitemap: "https://wholesale.mayaherbs.com/sitemap.xml",
  };
}
