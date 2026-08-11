"use client";

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Globe2, Sprout } from 'lucide-react';
import OptionalPublicImage from '@/components/OptionalPublicImage';

const PILLARS = [
  {
    title: 'Natural Products',
    description: 'Certified herbs and plants selected for dependable quality.',
    icon: Sprout,
  },
  {
    title: 'Global Sourcing',
    description: 'Material gathered from trusted regions and producer networks.',
    icon: Globe2,
  },
  {
    title: 'Quality Guaranteed',
    description: 'Rigorous checks before product release and wholesale shipment.',
    icon: BadgeCheck,
  },
];

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

        <div className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16">
          {PILLARS.map(({ title, description, icon: Icon }) => (
            <div key={title}>
              <article className="relative h-full overflow-hidden rounded-xl border border-[#999933] bg-white p-7 shadow-[0_14px_32px_rgba(45,45,45,0.12)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#999933] to-[#CC6633]"
                />
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#2D2D2D] text-[#F7F6EF] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="type-card-title mt-6 text-[#2D2D2D] font-headline-md">
                  {title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#2D2D2D] font-body-md">
                  {description}
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
