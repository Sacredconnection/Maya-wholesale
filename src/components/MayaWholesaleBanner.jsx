import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function MayaWholesaleBanner() {
  return (
    <section
      aria-labelledby="sacred-snuff-banner-title"
      className="maya-wholesale-banner theme-dark-zone relative flex min-h-[440px] items-center overflow-hidden border-y border-[#268072]/80 bg-[#171813] bg-cover bg-center py-0 md:min-h-0 md:py-14 lg:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313]/78 via-[#131313]/46 to-[#131313]/12 md:bg-gradient-to-r md:from-[#131313]/76 md:via-[#131313]/48 md:to-[#131313]/8"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-40 md:block"
        aria-hidden="true"
      />
      <div className="home-content-shell relative z-10 flex self-stretch justify-center py-8 md:self-auto md:items-center md:justify-start md:py-0">
        <div className="relative flex w-full max-w-xl flex-col items-center justify-between px-2 text-center md:items-start md:justify-start md:px-0 md:text-left lg:w-[58%]">
          <div className="flex w-full flex-col items-center md:items-start">
            <Image
              src="/banner/maya-wholesale-cta/logo-maya-wholesale-cta.svg"
              alt="Maya Ethnobotanicals"
              width={494}
              height={201}
              unoptimized
              className="h-20 w-auto object-contain object-center sm:h-24 md:object-left"
            />
            <div className="mt-2 flex w-full flex-col items-center md:mt-5 md:items-start">
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
            </div>
          </div>
          <a
            href="https://sacred-snuff.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Sacred Snuff in a new tab"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#268072] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-[#319888] hover:shadow-xl hover:shadow-black/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c38b] motion-reduce:transform-none motion-reduce:transition-none md:mt-6"
          >
            Visit Sacred Snuff
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
