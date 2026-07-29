"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`theme-dark-zone fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-[#d8c58f]/40 bg-[#173c35] text-[#d8c58f] shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-[#d8c58f] hover:bg-[#1e4b43] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8c58f] sm:bottom-7 sm:right-7 ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
