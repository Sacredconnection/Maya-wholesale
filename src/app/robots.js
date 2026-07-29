export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/private/", "/portal/"],
    },
    sitemap: "https://wholesale.mayaherbs.com/sitemap.xml",
  };
}
