"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    eyebrow: 'Ethnobotanical specialists since 2000',
    heading: ['Wholesale', 'Ethnobotanical', 'Herbs'],
    description:
      'Authentic plant medicines and herbal ingredients delivered for wholesale and professional use.',
    ctaLabel: 'Register B2B Account',
    ctaHref: '/register',
  },
  {
    eyebrow: 'From forest to formulation',
    heading: ['Rare Botanicals', 'Reliable Supply'],
    description:
      'Discover roots, barks, flowers and herbs selected for makers, retailers and professional practitioners.',
    ctaLabel: 'Explore Wholesale Catalog',
    ctaHref: '/catalog',
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeContent = HERO_SLIDES[activeSlide];

  useEffect(() => {
    if (isPaused) return undefined;

    const rotationTimer = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % 2);
    }, 6000);

    return () => window.clearInterval(rotationTimer);
  }, [isPaused]);

  return (
    <div
      className="site-hero theme-dark-zone relative flex w-full flex-col overflow-hidden bg-[#25362D]"
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      {/* Responsive full-bleed hero background */}
      <div className="absolute inset-0 z-0">
        <picture
          className={`absolute inset-0 block h-full w-full transition-opacity duration-1000 motion-reduce:transition-none ${
            activeSlide === 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source
            media="(max-width: 767px)"
            srcSet="/banner/maya-wholesale/maya-wholesale-banner-mobile.webp"
          />
          <img
            src="/banner/maya-wholesale/maya-wholesale-banner-desktop.webp"
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 block h-full w-full object-cover object-center"
          />
        </picture>

        <picture
          className={`absolute inset-0 block h-full w-full transition-opacity duration-1000 motion-reduce:transition-none ${
            activeSlide === 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source
            media="(max-width: 767px)"
            srcSet="/banner/maya-wholesale/maya-wholesale-banner-mobile-02.webp"
          />
          <img
            src="/banner/maya-wholesale/maya-wholesale-banner-02.webp"
            alt=""
            loading="eager"
            fetchPriority="low"
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
        <div
          key={activeSlide}
          className="site-content-shell flex flex-1 animate-fade-in-up flex-col items-center pt-16 text-center md:flex-none md:pt-0"
        >

          <span className="type-eyebrow relative inline-block pb-3 font-label-sm text-white/90 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-14 after:-translate-x-1/2 after:bg-gradient-to-r after:from-[#999933] after:to-[#cc6633] after:content-['']">
            {activeContent.eyebrow}
          </span>

          <h1 className="type-display-title mt-4 font-headline-lg text-white sm:mt-5">
            {activeContent.heading.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </h1>

          <p className="type-body-lead mt-5 max-w-[28rem] font-body-lg text-white/75 sm:mt-6 sm:max-w-md md:max-w-2xl md:text-white/70">
            {activeContent.description}
          </p>

          <div className="mt-auto mb-10 flex w-full max-w-sm flex-col items-stretch gap-4 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center md:mt-8 md:mb-0 lg:mt-9">
            <Link
              href={activeContent.ctaHref}
              className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-sm font-bold tracking-wide px-7 sm:px-10 py-4 sm:py-5 rounded-sm shadow-lg shadow-[#cc6633]/10 hover:shadow-[#cc6633]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase no-underline cursor-pointer border-0"
            >
              {activeContent.ctaLabel}
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      <div
        className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        role="group"
        aria-label="Choose hero banner"
      >
        {[0, 1].map((slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            onClick={() => setActiveSlide(slideIndex)}
            aria-label={`Show banner ${slideIndex + 1}`}
            aria-pressed={activeSlide === slideIndex}
            className={`h-2.5 rounded-full border border-white/70 transition-[width,background-color] duration-300 motion-reduce:transition-none ${
              activeSlide === slideIndex
                ? 'w-8 bg-white'
                : 'w-2.5 bg-white/25 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

    </div>
  );
}
