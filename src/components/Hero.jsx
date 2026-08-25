"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const HERO_ROTATION_INTERVAL = 10000;

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
  const [isPointerPaused, setIsPointerPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const heroRef = useRef(null);
  const backgroundRef = useRef(null);
  const activeContent = HERO_SLIDES[activeSlide];
  const isPaused = isPointerPaused || isFocusPaused;

  useEffect(() => {
    if (isPaused) return undefined;

    const rotationTimer = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length);
    }, HERO_ROTATION_INTERVAL);

    return () => window.clearInterval(rotationTimer);
  }, [isPaused]);

  useEffect(() => {
    const hero = heroRef.current;
    const background = backgroundRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!hero || !background || reducedMotion.matches) return undefined;

    let animationFrame;

    const updateParallax = () => {
      animationFrame = undefined;
      const heroBounds = hero.getBoundingClientRect();

      if (heroBounds.bottom <= 0 || heroBounds.top >= window.innerHeight) return;

      const distanceScrolled = Math.max(0, -heroBounds.top);
      const offset = Math.min(distanceScrolled * 0.38, heroBounds.height * 0.2);
      background.style.setProperty('--hero-parallax-offset', `${offset}px`);
    };

    const requestParallaxUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate);

    return () => {
      window.removeEventListener('scroll', requestParallaxUpdate);
      window.removeEventListener('resize', requestParallaxUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={heroRef}
      className="site-hero brand-contrast-zone relative flex w-full flex-col overflow-hidden bg-[#25362D]"
      onMouseEnter={() => setIsPointerPaused(true)}
      onMouseLeave={() => setIsPointerPaused(false)}
      onFocusCapture={() => setIsFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusPaused(false);
      }}
    >
      {/* Responsive full-bleed hero background */}
      <div
        ref={backgroundRef}
        className="absolute inset-x-0 -top-[10%] z-0 h-[120%] will-change-transform motion-reduce:transform-none"
        style={{ transform: 'translate3d(0, var(--hero-parallax-offset, 0px), 0)' }}
      >
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
        <div className="site-content-shell flex flex-1 flex-col items-center pt-16 text-center md:flex-none md:pt-0">

          <span
            className="hero-content-rise type-eyebrow relative inline-block pb-3 font-label-sm text-white/90 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-14 after:-translate-x-1/2 after:bg-gradient-to-r after:from-[#999933] after:to-[#cc6633] after:content-['']"
            style={{ "--hero-content-delay": "120ms" }}
          >
            {activeContent.eyebrow}
          </span>

          <h1
            className="hero-content-rise type-display-title mt-4 font-headline-lg text-white sm:mt-5"
            style={{ "--hero-content-delay": "240ms" }}
          >
            {activeContent.heading.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </h1>

          <p
            className="hero-content-rise type-body-lead mt-5 max-w-[28rem] font-body-lg text-white/75 sm:mt-6 sm:max-w-md md:max-w-2xl md:text-white/70"
            style={{ "--hero-content-delay": "380ms" }}
          >
            {activeContent.description}
          </p>

          <div
            className="hero-content-rise mt-auto mb-10 flex w-full max-w-sm flex-col items-stretch gap-4 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center md:mt-8 md:mb-0 lg:mt-9"
            style={{ "--hero-content-delay": "520ms" }}
          >
            <Link
              href={activeContent.ctaHref}
              className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-sm font-bold tracking-wide px-7 sm:px-10 py-4 sm:py-5 rounded-sm shadow-lg shadow-[#cc6633]/10 hover:shadow-[#cc6633]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase no-underline cursor-pointer border-0"
            >
              {activeContent.ctaLabel}
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
