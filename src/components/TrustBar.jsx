"use client";

import { useEffect, useRef, useState } from 'react';
import OptionalPublicImage from '@/components/OptionalPublicImage';

export default function TrustBar() {
  const headerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!header) return undefined;

    if (reducedMotion.matches) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: '0px 0px -22% 0px' }
    );

    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="about-maya-title"
      className="relative isolate w-full overflow-hidden bg-transparent py-12 lg:py-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#999933] to-[#CC6633]"
      />
      <div className="home-content-shell relative">
        <header
          ref={headerRef}
          className={`trust-header-arrival mx-auto max-w-4xl text-center ${
            isVisible ? 'is-visible' : ''
          }`}
        >
          <OptionalPublicImage
            src="/symbols/about/about-maya-symbol-01.svg"
            alt=""
            width={96}
            height={57}
            className="mx-auto mb-3 h-auto w-20 object-contain sm:w-24"
          />
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#2d2d2d] sm:text-base">
            Maya Herbs Wholesale
          </p>
          <h2
            id="about-maya-title"
            className="type-section-title mt-6 uppercase text-[#2D2D2D] font-headline-lg sm:mt-7"
          >
            Maya Ethnobotanicals
          </h2>
          <p className="type-body-lead mx-auto mt-4 max-w-3xl text-[#2D2D2D] font-body-lg">
            Specialists in ethnobotanical herbs and plants, delivering authentic and sustainable products for wholesale clients.
          </p>
        </header>
      </div>
    </section>
  );
}
