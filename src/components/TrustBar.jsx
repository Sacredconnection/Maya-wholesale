"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BriefcaseBusiness, Leaf, TrendingUp } from 'lucide-react';

const COUNTRY_FLAGS = [
  { name: 'Brazil', src: '/flags/brazil.svg' },
  { name: 'Netherlands', src: '/flags/netherlands.svg' },
  { name: 'United States', src: '/flags/united-states.svg' },
];

export default function TrustBar() {
  const metricRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [batchCount, setBatchCount] = useState(0);

  useEffect(() => {
    const metric = metricRef.current;
    if (!metric) return;

    const runCounter = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setBatchCount(25);
        return;
      }

      const duration = 1600;
      const startedAt = performance.now();

      const updateCounter = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setBatchCount(Math.round(easedProgress * 25));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(updateCounter);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        runCounter();
        observer.disconnect();
      }
    }, { threshold: 0.45 });

    observer.observe(metric);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full bg-[#131313]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="trust-bar-grid relative grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Card 1: B2B Program */}
          <div className="home-green-outline group relative flex flex-col items-start gap-4 overflow-hidden rounded-lg border bg-[#25362D] p-4 transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:bg-[#304638] hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] motion-reduce:transition-none sm:p-5 lg:p-7">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#d8c58f]/10 border border-[#d8c58f]/20 flex items-center justify-center text-[#d8c58f] transition-colors duration-500 group-hover:bg-[#d8c58f]/15 group-hover:border-[#d8c58f]/30">
                <BriefcaseBusiness className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white font-label-sm">
                B2B Program
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug tracking-tight text-white font-headline-md lg:text-lg">
                A broad ethnobotanical range, built for professional buyers.
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-white/50 font-body-md sm:text-sm">
                Source herbs, Aya plants, Kratom, Rapéh, superfoods and
                incense through one experienced wholesale partner, with live
                availability and business account support.
              </p>
            </div>
          </div>

          {/* Card 2: Sustainability */}
          <div className="home-green-outline group relative flex flex-col items-start gap-4 overflow-hidden rounded-lg border bg-[#25362D] p-4 transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:bg-[#304638] hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] motion-reduce:transition-none sm:p-5 lg:p-7">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#d8c58f]/10 border border-[#d8c58f]/20 flex items-center justify-center text-[#d8c58f] transition-colors duration-500 group-hover:bg-[#d8c58f]/15 group-hover:border-[#d8c58f]/30">
                <Leaf className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-3 motion-reduce:transform-none" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white font-label-sm">
                Ethical Sourcing
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug text-white font-headline-md lg:text-lg">
                Why Maya Herbs Wholesale?
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-white/50 font-body-md marker:text-[#d8c58f] sm:text-sm">
                <li>Established producer and supplier relationships.</li>
                <li>Batch and quality checks before wholesale release.</li>
                <li>Dedicated support for approved trade partners.</li>
              </ul>
            </div>
          </div>

          {/* Card 3: Metrics */}
          <div className="home-green-outline group relative col-span-1 flex flex-col gap-4 overflow-hidden rounded-lg border bg-[#25362D] p-4 transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:bg-[#304638] hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] motion-reduce:transition-none sm:p-5 md:col-span-2 lg:col-span-1 lg:p-7">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c58f]/20 bg-[#d8c58f]/10 text-[#d8c58f] transition-colors duration-500 group-hover:border-[#d8c58f]/30 group-hover:bg-[#d8c58f]/15">
                <TrendingUp className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white font-label-sm">
                Global Reach
              </span>
            </div>
            <div className="inline-flex w-fit items-center">
              <span ref={metricRef} className="inline-flex items-baseline text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white font-headline-lg tabular-nums" aria-label="More than twenty-five years of ethnobotanical experience">
                <span className="inline-flex min-w-[1.45ch] justify-end overflow-hidden" aria-hidden="true">
                  <span key={batchCount} className="inline-block animate-number-rise">
                    {batchCount}
                  </span>
                </span>
                <span aria-hidden="true">+</span>
              </span>
            </div>
            <span className="text-sm font-medium text-white/50 tracking-wide uppercase font-label-sm">
              Years connecting plant traditions with global buyers.
            </span>
            <div className="flex -space-x-2 opacity-90 mt-1" aria-label="Partner countries">
              {COUNTRY_FLAGS.map((country) => (
                <div
                  key={country.name}
                  className="inline-flex h-8 w-8 rounded-full ring-2 ring-[#25362D] bg-[#1a1a1a] border border-white/10 items-center justify-center select-none transition-colors duration-500 group-hover:ring-[#304638]"
                  title={country.name}
                >
                  <Image
                    src={country.src}
                    alt={`${country.name} flag`}
                    width={22}
                    height={15}
                    unoptimized
                    className="h-[15px] w-[22px] rounded-[2px] object-cover shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
