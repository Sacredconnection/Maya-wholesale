"use client";

import { useEffect, useRef } from 'react';
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

const CARD_ENTRY_DIRECTIONS = [
  { x: -6, y: -3 },
  { x: 0, y: 5 },
  { x: 6, y: -3 },
];

export default function TrustBar() {
  const cardRefs = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reducedMotion.matches) return undefined;

    let animationFrame;

    const updateCards = () => {
      animationFrame = undefined;
      const startLine = window.innerHeight * 0.94;
      const endLine = window.innerHeight * 0.5;
      const travelDistance = startLine - endLine;

      cardRefs.current.forEach((card, index) => {
        if (!card) return;

        const cardTop = card.getBoundingClientRect().top;
        const columnDelay = index * 0.08;
        const rawProgress = (startLine - cardTop) / travelDistance;
        const progress = Math.min(
          1,
          Math.max(0, (rawProgress - columnDelay) / (1 - columnDelay))
        );
        const direction = CARD_ENTRY_DIRECTIONS[index];
        const remainingDistance = 1 - progress;

        card.style.opacity = String(progress);
        card.style.filter = `blur(${remainingDistance * 0.45}rem)`;
        card.style.transform = `translate3d(${direction.x * remainingDistance}rem, ${direction.y * remainingDistance}rem, 0) scale(${0.96 + progress * 0.04})`;
      });
    };

    const requestCardsUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateCards);
    };

    updateCards();
    window.addEventListener('scroll', requestCardsUpdate, { passive: true });
    window.addEventListener('resize', requestCardsUpdate);

    return () => {
      window.removeEventListener('scroll', requestCardsUpdate);
      window.removeEventListener('resize', requestCardsUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
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
        <header className="mx-auto max-w-4xl text-center">
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
          {PILLARS.map(({ title, description, icon: Icon }, index) => (
            <div
              key={title}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              className="trust-card-arrival"
              style={{
                '--card-entry-x': `${CARD_ENTRY_DIRECTIONS[index].x}rem`,
                '--card-entry-y': `${CARD_ENTRY_DIRECTIONS[index].y}rem`,
              }}
            >
              <article className="group relative h-full overflow-hidden rounded-xl border border-[#999933] bg-white p-7 shadow-[0_14px_32px_rgba(45,45,45,0.12)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none">
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
