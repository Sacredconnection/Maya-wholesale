"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="site-hero theme-dark-zone relative flex w-full flex-col overflow-hidden bg-[#25362D]">
      {/* Responsive full-bleed hero background */}
      <div className="absolute inset-0 z-0">
        <picture className="absolute inset-0 block h-full w-full">
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
            className="absolute inset-0 block h-full w-full object-cover object-center"
          />
        </picture>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black/45"
        />
      </div>

      {/* Hero Section Content */}
      <section className="relative z-10 flex w-full flex-1 items-stretch py-8 md:items-center md:py-16 lg:py-20">
        <div className="mx-auto flex w-full max-w-[90rem] flex-1 animate-fade-in-up flex-col items-center px-4 pt-16 text-center sm:px-6 md:flex-none md:pt-0 lg:px-8">

          <span className="type-eyebrow relative inline-block pb-3 font-label-sm text-white/90 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-14 after:-translate-x-1/2 after:bg-gradient-to-r after:from-[#999933] after:to-[#cc6633] after:content-['']">
            Ethnobotanical specialists since 2000
          </span>

          <h1 className="type-display-title mt-4 font-headline-lg text-white sm:mt-5">
            <span className="block">Wholesale</span>
            <span className="block">Ethnobotanical</span>
            <span className="block">Herbs</span>
          </h1>

          <p className="type-body-lead mt-5 max-w-[28rem] font-body-lg text-white/75 sm:mt-6 sm:max-w-md md:max-w-2xl md:text-white/70">
            Authentic plant medicines and herbal ingredients delivered for wholesale and professional use.
          </p>

          <div className="mt-auto mb-10 flex w-full max-w-sm flex-col items-stretch gap-4 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center md:mt-8 md:mb-0 lg:mt-9">
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

    </div>
  );
}
