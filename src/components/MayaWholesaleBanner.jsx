import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MayaWholesaleBanner() {
  return (
    <section
      aria-labelledby="maya-wholesale-banner-title"
      className="maya-wholesale-banner theme-dark-zone relative mb-12 flex items-center overflow-hidden border-t border-white/10 bg-[#171813] bg-cover bg-center py-14 lg:mb-16 lg:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313]/88 via-[#131313]/48 to-[#131313]/8 md:bg-gradient-to-r md:from-[#131313]/90 md:via-[#131313]/65 md:to-[#131313]/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-65 md:block"
        aria-hidden="true"
      />
      <div className="home-content-shell relative z-10 flex items-center">
        <div className="relative flex w-full max-w-xl flex-col items-start text-left lg:w-[58%]">
          <Image
            src="/banner/maya-wholesale-cta/logo-maya-wholesale-cta.svg"
            alt="Maya Ethnobotanicals"
            width={494}
            height={201}
            unoptimized
            className="h-20 w-auto object-contain object-left sm:h-24"
          />
          <div className="mt-5 flex w-full flex-col items-start">
            <h2
              id="maya-wholesale-banner-title"
              className="type-promo-title max-w-lg font-headline-lg leading-[1.08] text-white"
            >
              Ready to build your Maya wholesale assortment?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
              Apply for a trade account to access live availability, partner
              pricing, repeat ordering and a catalog built for professional
              buyers.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#df7741] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c38b]"
            >
              Open a wholesale account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
