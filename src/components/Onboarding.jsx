"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const steps = [
  {
    num: "01",
    title: "Register B2B Account",
    desc: "Fill out the 3-step registration form with your identity, business information, and secure password.",
  },
  {
    num: "02",
    title: "Business Review",
    desc: "Our team reviews your business information and confirms the right wholesale access for your operation.",
  },
  {
    num: "03",
    title: "Order & Reorder",
    desc: "Once approved, access partner pricing, live availability, order tools and your purchase history.",
  },
];

export default function Onboarding() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes stepFadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes lineFillVertical {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes circlePulse {
          0%   { box-shadow: 0 0 0 0 rgba(130, 214, 197, 0.45); }
          70%  { box-shadow: 0 0 0 16px rgba(130, 214, 197, 0); }
          100% { box-shadow: 0 0 0 0 rgba(130, 214, 197, 0); }
        }
        .step-item {
          opacity: 0;
          transform: translateY(36px);
        }
        .step-item.animate {
          animation: stepFadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .step-item.animate .step-circle {
          animation: circlePulse 1.1s ease-out 0.4s 1;
        }
        .connector-line-fill {
          transform-origin: left center;
          transform: scaleX(0);
        }
        .connector-line-fill.animate {
          animation: lineFill 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }
        .connector-line-fill-vertical {
          transform-origin: center top;
          transform: scaleY(0);
        }
        .connector-line-fill-vertical.animate {
          animation: lineFillVertical 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }
      `}</style>

      <section
        ref={sectionRef}
        id="onboarding"
        className="home-green-outline relative mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col items-center gap-6 rounded-xl border bg-[#1a1a1a] px-4 py-7 shadow-[0_24px_70px_rgba(0,0,0,0.18)] transition-colors duration-300 sm:gap-7 sm:px-6 sm:py-8 lg:gap-8 lg:px-10 lg:py-10"
      >
        {/* Header */}
        <div
          className="w-full max-w-3xl text-center z-10 step-item"
          style={visible ? { animation: 'stepFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0s forwards' } : {}}
        >
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-black tracking-tighter text-white mb-2">
            A clear path to wholesale access
          </h2>
          <p className="font-body-md text-sm sm:text-base leading-relaxed text-white/70">
            Join retailers, practitioners and distributors sourcing
            ethnobotanical products through Maya&apos;s professional trade
            program.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 grid w-full grid-cols-1 gap-5 md:grid-cols-3 md:gap-5 lg:gap-7">

          {/* Connecting Line Background */}
          <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-px bg-white/10 -z-10" />

          {/* Animated fill on top of the line */}
          <div
            className={`hidden md:block absolute top-7 left-[15%] right-[15%] h-px bg-gradient-to-r from-[#999933] to-[#f2f2f2] -z-10 connector-line-fill${visible ? ' animate' : ''}`}
          />

          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`step-item relative flex flex-row items-start gap-3 text-left md:flex-col md:items-center md:gap-3 md:text-center group${visible ? ' animate' : ''}`}
              style={visible ? { animationDelay: `${0.2 + i * 0.18}s` } : {}}
            >
              {i < steps.length - 1 && (
                <>
                  <div className="absolute -bottom-11 left-6 top-6 w-px bg-white/10 md:hidden" />
                  <div
                    className={`connector-line-fill-vertical absolute -bottom-11 left-6 top-6 w-px bg-gradient-to-b from-[#999933] to-[#f2f2f2] md:hidden${visible ? ' animate' : ''}`}
                  />
                </>
              )}
              <div
                className="step-circle relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#131313] shadow-xl transition-colors duration-300 group-hover:border-[#f2f2f2] md:h-14 md:w-14"
              >
                <span className="font-headline-md text-base font-bold text-white/50 group-hover:text-[#f2f2f2] transition-colors duration-300">
                  {step.num}
                </span>
              </div>
              <div className="min-w-0 pt-0.5 md:pt-0">
                <h3 className="font-headline-md text-lg font-bold leading-snug text-white mb-1">{step.title}</h3>
                <p className="mx-auto max-w-sm font-body-md text-sm leading-relaxed text-white/70">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div
          className={`flex w-full justify-center z-10 step-item${visible ? ' animate' : ''}`}
          style={visible ? { animationDelay: '0.75s' } : {}}
        >
          <Link
            href="/register"
            className="w-full sm:w-auto bg-[#cc6633] text-white font-label-sm text-xs font-bold uppercase tracking-widest py-3.5 px-8 sm:px-10 lg:px-12 rounded-sm hover:bg-[#b6532a] transition-all duration-300 shadow-lg shadow-[#cc6633]/20 hover:shadow-[#cc6633]/40 cursor-pointer border-0 no-underline text-center"
          >
            Create B2B Account
          </Link>
        </div>
      </section>
    </>
  );
}
