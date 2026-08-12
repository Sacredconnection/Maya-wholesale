"use client";

import Image from 'next/image';
import { ArrowUpRight, Leaf, Shield, Droplets } from 'lucide-react';

export default function NGOSection() {
  return (
      <section
        id="ngo-partnership"
        className="ngo-section-card bg-[#1a1a1a] border border-[#999933] rounded-xl p-6 sm:p-8 lg:p-12 xl:p-16 relative overflow-hidden scroll-mt-24 w-full shadow-2xl transition-colors duration-500"
      >
        {/* NGO Symbol Watermark in Bottom-Right */}
        <Image
          src="/ngo/simbolo-conexao-ancestral.svg"
          alt=""
          width={750}
          height={750}
          unoptimized
          className="ngo-section-watermark absolute bottom-[-160px] right-[-120px] w-[500px] h-[500px] md:w-[650px] md:h-[650px] lg:w-[750px] lg:h-[750px] pointer-events-none select-none z-0 mix-blend-screen"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center z-10 relative">

          {/* Left Column: Copywriting & Pillars */}
          <div
            className="lg:col-span-7 flex flex-col gap-6 sm:gap-8"
          >
            {/* NGO Logo with text fallback */}
            <div className="h-16 md:h-[80px] flex items-center mb-2 sm:mb-4 lg:mb-6">
              <Image
                src="/ngo/logo-conexao-ancestral.svg"
                width={400}
                height={160}
                alt="Conexão Ancestral Logo"
                className="ngo-logo ngo-logo-dark h-16 md:h-[80px] w-auto object-contain opacity-95 hover:opacity-100 transition-all duration-300"
              />
              <Image
                src="/ngo/logo-conexao-ancestral-light-01.svg"
                width={400}
                height={160}
                alt="Conexão Ancestral Logo"
                className="ngo-logo ngo-logo-light h-16 md:h-[80px] w-auto object-contain opacity-95 hover:opacity-100 transition-all duration-300"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  const darkLogo = event.currentTarget.previousElementSibling;
                  if (darkLogo) darkLogo.style.display = 'block';
                }}
              />
              <span className="hidden items-center gap-2 bg-black/20 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-[#f2f2f2] uppercase font-label-sm w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f2f2f2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f2f2f2]"></span>
                </span>
                Conexão Ancestral
              </span>
            </div>

            {/* Titles */}
            <div className="flex flex-col gap-4">
              <h2 className="type-section-title font-headline-lg text-white">
                Bridges of Support for the <span className="text-[#284e32]">Amazon Rainforest</span>
              </h2>
              <p className="type-body-lead font-body-md text-white/70">
                Conexão Ancestral acts as a vital bridge between the wisdom of the forest and the modern world. We support indigenous self-determination in Acre, Brazil, safeguarding ancestral knowledge and protecting traditional territories.
              </p>
            </div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 pt-5 sm:pt-6 border-t border-white/5">

              {/* Pillar 1 */}
              <div className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#284e32] group-hover:bg-[#284e32]/20 transition-all duration-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-white mb-1">Self-Determination</h4>
                  <p className="font-body-md text-xs text-white/50 leading-relaxed">
                    Strengthening indigenous leadership and autonomous territory management.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#284e32] group-hover:bg-[#284e32]/20 transition-all duration-300">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-white mb-1">Cultural Preservation</h4>
                  <p className="font-body-md text-xs text-white/50 leading-relaxed">
                    Safeguarding traditional songs, forest medicine, and sacred lineages.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#284e32] group-hover:bg-[#284e32]/20 transition-all duration-300">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-white mb-1">Impact Projects</h4>
                  <p className="font-body-md text-xs text-white/50 leading-relaxed">
                    Concrete actions in clean water access, sustainability, and basic infrastructure.
                  </p>
                </div>
              </div>

            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <a
                href="https://www.conexaoancestral.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-[#284e32] hover:bg-[#1f3d27] text-white font-label-sm text-sm font-bold uppercase tracking-widest py-4 sm:py-5 px-7 sm:px-10 rounded-sm transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-[#284e32]/20 cursor-pointer no-underline group border-0"
              >
                Visit Conexão Ancestral
                <ArrowUpRight
                  color="#ffffff"
                  stroke="#ffffff"
                  className="ngo-cta-arrow w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>

          {/* Right Column: Harmonic Collage Grid */}
          <div className="lg:col-span-5 flex flex-col gap-4 w-full">
            {/* Centerpiece Image (Large) */}
            <div
              className="rounded-xl overflow-hidden border border-white/10 shadow-xl aspect-[16/10] group cursor-pointer relative transition-[border-color,box-shadow] duration-500 hover:border-[#f2f2f2]/45 hover:shadow-2xl hover:shadow-[#f2f2f2]/10"
            >
              <Image
                src="/ngo/collage-5.webp"
                alt="Traditional Amazonian Gathering"
                fill
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="object-cover transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045] group-hover:brightness-105 group-hover:saturate-110 motion-reduce:transition-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent opacity-80 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none" />
            </div>

            {/* 2x2 Grid of Corner Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative transition-[border-color,box-shadow] duration-500 hover:border-[#f2f2f2]/45 hover:shadow-xl hover:shadow-[#f2f2f2]/10">
                <Image src="/ngo/collage-1.webp" alt="Amazon Forest Canopy" fill sizes="(min-width: 1024px) 17vw, 50vw" className="object-cover transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] group-hover:brightness-105 group-hover:saturate-110 motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent opacity-80 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none" />
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative transition-[border-color,box-shadow] duration-500 hover:border-[#f2f2f2]/45 hover:shadow-xl hover:shadow-[#f2f2f2]/10">
                <Image src="/ngo/collage-2.webp" alt="Indigenous Community & Culture" fill sizes="(min-width: 1024px) 17vw, 50vw" className="object-cover transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] group-hover:brightness-105 group-hover:saturate-110 motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent opacity-80 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none" />
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative transition-[border-color,box-shadow] duration-500 hover:border-[#f2f2f2]/45 hover:shadow-xl hover:shadow-[#f2f2f2]/10">
                <Image src="/ngo/collage-3.webp" alt="Sacred Amazonian Botanicals" fill sizes="(min-width: 1024px) 17vw, 50vw" className="object-cover transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] group-hover:brightness-105 group-hover:saturate-110 motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent opacity-80 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none" />
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative transition-[border-color,box-shadow] duration-500 hover:border-[#f2f2f2]/45 hover:shadow-xl hover:shadow-[#f2f2f2]/10">
                <Image src="/ngo/collage-4.webp" alt="Pristine Forest Stream" fill sizes="(min-width: 1024px) 17vw, 50vw" className="object-cover transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] group-hover:brightness-105 group-hover:saturate-110 motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent opacity-80 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </section>
  );
}
