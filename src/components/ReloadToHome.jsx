"use client";

import { useEffect } from "react";

export default function ReloadToHome() {
  useEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0];

    if (navigationEntry?.type !== "reload") return;

    const isHomeTop =
      window.location.pathname === "/" &&
      window.location.search === "" &&
      (window.location.hash === "" || window.location.hash === "#top");

    if (!isHomeTop) {
      window.location.replace("/#top");
      return;
    }

    window.history.scrollRestoration = "manual";
    window.history.replaceState(null, "", "/#top");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return null;
}
