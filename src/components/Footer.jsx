"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Leaf, Globe, Users } from "lucide-react";

const footerLinkClass =
  "font-body-md text-base text-[#615b50] transition-colors hover:text-[#cc6633] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#999933]";

export default function Footer() {
  const handleLogoClick = (event) => {
    event.preventDefault();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <footer
      id="footer"
      className="w-full scroll-mt-24 bg-white text-[#2d2d2d] shadow-[0_-8px_24px_rgba(45,45,45,0.08)]"
    >
      <div aria-hidden="true" className="h-1.5 w-full bg-[#999933]" />

      <div className="home-content-shell grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-4 lg:gap-12 lg:py-16">
        <div className="flex flex-col gap-5 sm:col-span-2 sm:gap-6 lg:pr-8">
          <div className="flex flex-col items-start gap-2">
            <Link
              href="#top"
              onClick={handleLogoClick}
              aria-label="Back to the top of this page"
              className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#999933]"
            >
              <Image
                src="/banner/maya-wholesale/logo-maya-wholesale.svg"
                alt="Maya Herbs Wholesale"
                width={494}
                height={201}
                unoptimized
                className="h-20 w-auto md:h-24"
              />
            </Link>
          </div>

          <p className="font-body-md text-base leading-relaxed text-[#2d2d2d]/70">
            © {new Date().getFullYear()} Maya World Trading B.V. Wholesale
            ethnobotanicals supplied with experience, care and respect for
            origin.
          </p>

          <div className="font-label-sm flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6f701f]">
            <ShieldCheck className="h-4 w-4" />
            Professional botanical sourcing
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h5 className="font-label-sm text-xs font-bold uppercase tracking-widest text-[#2d2d2d]">
            Resources
          </h5>
          <nav className="flex flex-col gap-4">
            <Link className={footerLinkClass} href="/about">
              About
            </Link>
            <Link className={footerLinkClass} href="/catalog">
              Catalog
            </Link>
            <Link className={footerLinkClass} href="/contact">
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <h5 className="font-label-sm text-xs font-bold uppercase tracking-widest text-[#2d2d2d]">
            Legal
          </h5>
          <nav className="flex flex-col gap-4">
            <Link
              className={footerLinkClass}
              href="/shipping-and-returns-policy"
            >
              Shipping and Returns Policy
            </Link>
            <Link className={footerLinkClass} href="/privacy-policy">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-[#2d2d2d]/10 py-8">
        <div className="home-content-shell flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-label-sm text-xs uppercase tracking-widest text-[#2d2d2d]/60">
            Haarlem, the Netherlands · Sourcing &amp; production in Brazil
          </p>
          <div className="flex gap-6 text-[#999933]">
            <Leaf className="h-5 w-5 transition-colors hover:text-[#cc6633]" />
            <Globe className="h-5 w-5 transition-colors hover:text-[#cc6633]" />
            <Users className="h-5 w-5 transition-colors hover:text-[#cc6633]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
