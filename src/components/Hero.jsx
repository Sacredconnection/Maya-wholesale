"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const BANNERS = [
  {
    desktopSrc: "/banner/hero-banner.webp",
    mobileSrc: "/banner/hero-mobile/hero-banner-mobile.webp",
    alt: "Indigenous artisan preparing a traditional botanical blend"
  },
  {
    desktopSrc: "/banner/hero-banner-01.webp",
    mobileSrc: "/banner/hero-mobile/hero-banner-01-mobile.webp",
    alt: "Amazonian botanicals and forest scenery"
  }
];

export default function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="theme-dark-zone relative flex min-h-[calc(100svh-66px)] w-full flex-col justify-center overflow-hidden bg-[#25362D] sm:min-h-[calc(100svh-82px)] lg:min-h-[calc(100svh-90px)]">
      {/* Full Bleed Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {BANNERS.map((banner, idx) => (
          <picture
            key={banner.desktopSrc}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeIdx === idx ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source media="(max-width: 767px)" srcSet={banner.mobileSrc} />
            <img
              src={banner.desktopSrc}
              alt={banner.alt}
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "low"}
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </picture>
        ))}
        {/* Radial & Linear Overlays for Premium Contrast and Typography Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/88 via-[#131313]/48 to-[#131313]/8 md:bg-gradient-to-r md:from-[#131313]/90 md:via-[#131313]/65 md:to-[#131313]/15"></div>
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-65 md:block"></div>

        {/* Glow decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#989836] opacity-[0.06] blur-[150px] pointer-events-none rounded-full animate-drift-slow"></div>
      </div>

      {/* Hero Section Content */}
      <section className="relative z-10 w-full -translate-y-48 py-10 sm:-translate-y-12 sm:py-14 md:translate-y-0 md:py-16 lg:py-24">
        <div className="mx-auto flex w-full max-w-7xl animate-fade-in-up flex-col items-center gap-4 px-4 text-center sm:gap-5 sm:px-6 md:items-start md:gap-6 md:text-left lg:px-8">

          <div className="hero-tribe-badge inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/25 p-1.5 pr-4 shadow-[0_12px_35px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <Image
              src="/icons/hero-authentic-tribes-01.svg"
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 shrink-0 object-contain"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 sm:text-[11px] font-label-sm">
              Ethnobotanical specialists since 2000
            </span>
          </div>

          <h1 className="max-w-xl text-[2rem] font-black leading-[1.02] tracking-tighter text-white sm:text-4xl md:max-w-3xl md:text-6xl md:leading-[0.98] lg:text-7xl font-headline-lg">
            <span className="text-[#d8c58f]">Botanical integrity</span> at wholesale scale.
          </h1>

          <p className="max-w-md text-base font-normal leading-relaxed text-white/75 sm:text-lg md:max-w-2xl md:text-xl md:text-white/70 font-body-lg">
            Authentic herbs, plant extracts, superfoods, incense and
            traditional preparations selected for retailers, practitioners
            and professional buyers.
          </p>

          <div className="hidden w-full max-w-sm flex-col items-stretch gap-4 pt-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center md:flex md:pt-4">
            <Link
              href="/register"
              className="bg-[#cc6632] hover:bg-[#b6532a] text-white text-sm font-bold tracking-wide px-7 sm:px-10 py-4 sm:py-5 rounded-sm shadow-lg shadow-[#cc6632]/10 hover:shadow-[#cc6632]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase no-underline cursor-pointer border-0"
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
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 rounded-sm border-0 bg-[#cc6632] px-7 py-4 text-sm font-bold uppercase tracking-wide text-white no-underline shadow-lg shadow-[#cc6632]/10 transition-all duration-300 hover:bg-[#b6532a] hover:shadow-[#cc6632]/20 font-label-sm"
        >
          Register B2B Account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Carousel dots indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer border-0 p-0 ${
              activeIdx === idx ? 'bg-[#d8c58f] w-6' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
