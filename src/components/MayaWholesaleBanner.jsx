import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function MayaWholesaleBanner() {
  return (
    <section
      aria-labelledby="sacred-snuff-banner-title"
      className="maya-wholesale-banner theme-dark-zone relative mb-12 flex items-center overflow-hidden border-y border-[#268072]/80 bg-[#171813] bg-cover bg-center py-14 lg:mb-16 lg:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313]/70 via-[#131313]/36 to-[#131313]/5 md:bg-gradient-to-r md:from-[#131313]/76 md:via-[#131313]/48 md:to-[#131313]/8"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-40 md:block"
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
            <p className="type-eyebrow mb-3 font-label-sm text-[#268072]">
              From our Indigenous partners to your practice
            </p>
            <h2
              id="sacred-snuff-banner-title"
              className="type-promo-title max-w-lg font-headline-lg leading-[1.08] text-white"
            >
              Discover the world of Sacred Snuff.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
              Explore authentic Amazonian Rapé made by our Indigenous
              partners. Meet the tribes, discover their lineages and find
              carefully sourced blends rooted in living tradition.
            </p>
            <a
              href="https://sacred-snuff.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Sacred Snuff in a new tab"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#268072] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-[#319888] hover:shadow-xl hover:shadow-black/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c38b] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Visit Sacred Snuff
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
