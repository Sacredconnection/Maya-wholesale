import { NextResponse } from "next/server";
import { isMaintenanceMode } from "./lib/maintenance.mjs";

export function proxy(request) {
  if (!isMaintenanceMode()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  // Keep signed backend events and the maintenance page's assets available.
  if (
    pathname === "/api/webhooks/woocommerce" ||
    pathname.startsWith("/_next/") ||
    pathname === "/banner/maya-wholesale/logo-maya-wholesale.svg" ||
    pathname === "/patterns/maya-brand-pattern.svg" ||
    ["/favicon.ico", "/icon.png", "/apple-icon.png"].includes(pathname)
  ) {
    return NextResponse.next();
  }

  const options = {
    status: 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Retry-After": "3600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  };

  if (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    !["GET", "HEAD"].includes(request.method)
  ) {
    return NextResponse.json(
      { error: "Website under development. Coming soon." },
      options,
    );
  }

  return NextResponse.rewrite(new URL("/maintenance", request.url), options);
}
