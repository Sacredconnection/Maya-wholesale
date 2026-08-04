"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="theme-dark-zone relative flex min-h-[calc(100svh-66px)] w-full flex-col justify-center overflow-hidden bg-[#25362D] sm:min-h-[calc(100svh-82px)] lg:min-h-[calc(100svh-90px)]">
      {/* Responsive full-bleed hero background */}
      <div className="absolute inset-0 z-0">
        <picture className="absolute inset-0">
          <source
            media="(max-width: 767px)"
            srcSet="/banner/maya-wholesale/maya-wholesale-banner-mobile.webp"
          />
          <img
            src="/banner/maya-wholesale/maya-wholesale-banner-desktop.webp"
            alt="Amazonian botanicals in the rainforest"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
        </picture>
        {/* Radial & Linear Overlays for Premium Contrast and Typography Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/88 via-[#131313]/48 to-[#131313]/8 md:bg-gradient-to-r md:from-[#131313]/90 md:via-[#131313]/65 md:to-[#131313]/15"></div>
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-65 md:block"></div>

        {/* Glow decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#999933] opacity-[0.06] blur-[150px] pointer-events-none rounded-full animate-drift-slow"></div>
      </div>

      {/* Hero Section Content */}
      <section className="relative z-10 w-full -translate-y-48 py-10 sm:-translate-y-12 sm:py-14 md:translate-y-0 md:py-16 lg:py-24">
        <div className="mx-auto flex w-full max-w-7xl animate-fade-in-up flex-col items-center gap-5 px-4 text-center sm:px-6 md:items-start md:gap-6 md:text-left lg:px-8">

          <span className="type-eyebrow font-label-sm text-white/90">
            Ethnobotanical specialists since 2000
          </span>

          <h1 className="type-display-title font-headline-lg text-white">
            Wholesale Ethnobotanical Herbs
          </h1>

          <p className="type-body-lead max-w-[28rem] text-white/75 sm:max-w-md md:max-w-2xl md:text-white/70 font-body-lg">
            Authentic plant medicines and herbal ingredients delivered for wholesale and professional use.
          </p>

          <div className="hidden w-full max-w-sm flex-col items-stretch gap-4 pt-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center md:flex md:pt-4">
            <Link
              href="/register"
              className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-sm font-bold tracking-wide px-7 sm:px-10 py-4 sm:py-5 rounded-sm shadow-lg shadow-[#cc6633]/10 hover:shadow-[#cc6633]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase no-underline cursor-pointer border-0"
            >
              Register B2B Account
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* Mobile CTA anchored near the bottom to preserve the product area */}
      <div className="absolute inset-x-4 bottom-14 z-20 sm:bottom-16 md:hidden">
        <Link
          href="/register"
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 rounded-sm border-0 bg-[#cc6633] px-7 py-4 text-sm font-bold uppercase tracking-wide text-white no-underline shadow-lg shadow-[#cc6633]/10 transition-all duration-300 hover:bg-[#b6532a] hover:shadow-[#cc6633]/20 font-label-sm"
        >
          Register B2B Account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
