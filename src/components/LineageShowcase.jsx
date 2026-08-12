"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, ShieldCheck, HeartHandshake, Eye } from 'lucide-react';
import { getEthnicityColor } from '@/lib/ethnicity-colors';
import { useDialogAccessibility } from '@/lib/use-dialog-accessibility';

const TRIBES_DATA = [
  {
    id: 'huni-kuin',
    name: 'Huni Kuin',
    region: 'Acre, Brazil',
    image: '/tribes/huni-kuin.webp',
    description: 'The Huni Kuin (also known as Kaxinawá) are the largest indigenous population in Acre. Their name translates to "True People". They hold deep ancestral knowledge of jungle medicine, botany, and ritualistic spiritual practices.',
    sustainability: '100% Direct Fair Trade',
    harvest: 'Lunar Cycle Harvesting',
    details: 'Huni Kuin blends are famous for their grounding properties. Sourced under strict spiritual guidance, they use selected rustic tobaccos mixed with Tsunu tree ash, fostering extreme clarity, deep focus, and energetic clearing.'
  },
  {
    id: 'yawanawa',
    name: 'Yawanawá',
    region: 'Gregório River',
    image: '/tribes/yawanawa.webp',
    description: 'The Yawanawá ("People of the Wild Boar") occupy the Gregório River indigenous territory. They are celebrated globally for their vibrant music, spiritual authority, and pioneering leadership of female shamans.',
    sustainability: 'Equitable Profit Share',
    harvest: 'Sustainably Wild-Harvested',
    details: 'Yawanawá blends are traditionally lighter and heart-opening. Crafted using ashes of the Tsunu tree mixed with native aromatic botanicals, their products are designed to support emotional balance, spiritual connection, and physical revitalization.'
  },
  {
    id: 'katukina',
    name: 'Katukina',
    region: 'Campinas',
    image: '/tribes/katukina.webp',
    description: 'The Katukina are ancestral keepers of the Kambo ritual and sacred snuffs in the Campinas area. They maintain a highly traditional, disciplined lifestyle deeply connected to the rhythm of the virgin forest.',
    sustainability: 'Cooperative Managed Sourcing',
    harvest: 'Traditional Hand-Milled',
    details: 'Katukina blends are robust and intensely grounding. Sourced directly from elder medicine makers, these formulations use powerful native hardwood ashes that provide instant focus, strong physical presence, and energetic alignment.'
  },
  {
    id: 'nukini',
    name: 'Nukini',
    region: 'Juruá Valley',
    image: '/tribes/nukini.webp',
    description: 'Residing in the Juruá Valley, the Nukini are known for their resilience and exquisite artisanal crafts. Nukini women hold a central role in gathering sacred herbs and crafting the tribe’s legendary snuffs.',
    sustainability: '100% Female-Gathered Support',
    harvest: 'Organic Forest Sourced',
    details: 'Nukini blends are distinctively clean and aromatic. They blend fine, light tobaccos with cooling herbs like Sansara, resulting in highly meditative, relaxing, and centering experiences preferred for daily alignment.'
  },
  {
    id: 'shanenawa',
    name: 'Shanenawa',
    region: 'Feijó, Acre',
    image: '/tribes/shanenawa.webp',
    description: 'The Shanenawa inhabit the Feijó region. Their name means "People of the Blue Bird". They represent peace, wisdom, and deep alignment with the birds and wind spirits of the high forest.',
    sustainability: 'Direct Community Sourced',
    harvest: 'Traditional Bark Scraping',
    details: 'Shanenawa formulations are known for spiritual cleansing. Using the ash of the Murici tree, their blends are formulated to cleanse heavy energy, relieve stress, and support deep breathing.'
  },
  {
    id: 'caboclo',
    name: 'Caboclo',
    region: 'Amazon Forest',
    image: '/tribes/caboclo.webp',
    description: 'Caboclo formulations represent the synthesis of traditional indigenous knowledge and forest medicine gathered by rubber tappers and riverside communities throughout the Amazon.',
    sustainability: 'Fair-Trade Co-op Sourced',
    harvest: 'Wild-Harvested Botanicals',
    details: 'Crafted using traditional forest ashes mixed with native herbs, Caboclo blends offer a balanced, grounding energy, designed to connect the body and mind in daily practices.'
  },
  {
    id: 'puyanawa',
    name: 'Puyanawa',
    region: 'Mâncio Lima',
    image: '/tribes/puyanawa.webp',
    description: 'The Puyanawa reside in Mâncio Lima. They have undergone a profound cultural renaissance, recovering their native language and establishing highly sustainable community agriculture models.',
    sustainability: '100% Reinvested Profits',
    harvest: 'Manual Leaf Selection',
    details: 'Puyanawa blends are distinctively strong and refreshing, often containing local wild herbs. They are formulated to boost physical energy, mental clarity, and overall stamina.'
  },
  {
    id: 'apurina',
    name: 'Apurinã',
    region: 'Purus River',
    image: '/tribes/apurina.webp',
    description: 'The Apurinã live along the Purus River basin. They are the creators of the world-famous "Awiry" green snuff, which is unique in that it contains no tobacco and is never burned.',
    sustainability: 'Ultra-Rare Fair Sourced',
    harvest: 'Green Leaf Sun-Dried',
    details: 'Apurinã Awiry is completely raw and un-burned, made of a wild forest herb ground to an ultra-fine green powder. It provides a gentle, aromatic, highly clearing sensation, free of nicotine or intense burning.'
  },
  {
    id: 'kuntanawa',
    name: 'Kuntanawa',
    region: 'Alto Juruá',
    image: '/tribes/kuntanawa.webp',
    description: 'The Kuntanawa are located at the headwaters of the Alto Juruá. They are committed to reforestation, planting native sacred trees, and protecting the rich bio-diversity of their reservation.',
    sustainability: '100% Forest Protection Pact',
    harvest: 'Ethical Root Harvesting',
    details: 'Their snuffs are formulated to promote peace, safety, and spiritual protection. Infused with aromatic herbs like Sansara, Kuntanawa blends are smooth, relaxing, and centering.'
  },
  {
    id: 'shawadawa',
    name: 'Shawãdawa',
    region: 'Acre, Brazil',
    image: '/tribes/shawadawa.webp',
    description: 'The Shawãdawa (also known as Arara) live along the Juruá River basin. Their name represents the sun and the macaw. They preserve deep ancestral songs and botanical expertise.',
    sustainability: '100% Direct Community Sourced',
    harvest: 'Sun-Dried Traditional Milling',
    details: 'Shawãdawa formulations incorporate unique forest ash combinations (like Tsunu bark) with special native plants, facilitating deep meditation, opening the heart, and strengthening spiritual connection.'
  }
];

export default function LineageShowcase() {
  const [selectedTribe, setSelectedTribe] = useState(null);
  const sliderRef = useRef(null);
  const isDown = useRef(false);
  const isHovered = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const activeTriggerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useDialogAccessibility(Boolean(selectedTribe), () => setSelectedTribe(null), {
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: activeTriggerRef,
  });

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setHasMoved(false);
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    isHovered.current = false;
  };

  const handleMouseEnter = () => {
    isHovered.current = true;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;

    const moveX = Math.abs(e.clientX - dragStartPos.current.x);
    const moveY = Math.abs(e.clientY - dragStartPos.current.y);
    if (moveX > 5 || moveY > 5) {
      setHasMoved(true);
    }

    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Drag speed multiplier

    const slider = sliderRef.current;
    const halfWidth = slider.scrollWidth / 2;
    let newScrollLeft = scrollLeft.current - walk;

    // Wrap around for infinite scrolling during drag
    if (newScrollLeft >= halfWidth) {
      newScrollLeft -= halfWidth;
      startX.current = x;
      scrollLeft.current = newScrollLeft;
    } else if (newScrollLeft <= 0) {
      newScrollLeft += halfWidth;
      startX.current = x;
      scrollLeft.current = newScrollLeft;
    }

    slider.scrollLeft = newScrollLeft;
  };

  useEffect(() => {
    let animationFrameId;

    const scrollLoop = () => {
      if (sliderRef.current) {
        const slider = sliderRef.current;
        const halfWidth = slider.scrollWidth / 2;

        if (!isDown.current && !isHovered.current) {
          slider.scrollLeft += 0.8; // Auto-scroll speed

          if (slider.scrollLeft >= halfWidth) {
            slider.scrollLeft -= halfWidth;
          }
        }
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section id="tribes" aria-labelledby="lineage-title" className="theme-dark-zone lineage-showcase relative isolate flex flex-col gap-8 sm:gap-10 lg:gap-12 py-10 sm:py-12 border-t border-white/10 scroll-mt-24 w-full before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-[#131313]">

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
        <div>
          <h2 id="lineage-title" className="lineage-heading type-section-title font-headline-lg text-white mb-3 sm:mb-4">
            Rapéh partnerships across 10 Indigenous nations
          </h2>
          <p className="lineage-description type-body-lead font-body-md text-white/70 max-w-2xl">
            Maya&apos;s Rapéh collection is connected to established artisan
            and community relationships in Brazil. Explore the people, places
            and lineages represented in this specialist range.
          </p>
        </div>

        {/* Controls block */}
        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
          <Link
            className="lineage-link text-[#f2f2f2] hover:text-[#999933] font-label-sm text-sm uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-colors"
            href="/catalog"
          >
            Explore Lineage
          </Link>
        </div>
      </div>

      {/* Tribe Carousel Track - Seamless CSS Marquee replaced by Draggable Slider */}
      <div className="relative">
        <div
          className="lineage-decorative-band pointer-events-none absolute left-1/2 top-1/2 z-0 hidden h-[100px] w-screen -translate-x-1/2 -translate-y-1/2 bg-[url('/decorations/lineage-decorative-band.webp')] bg-center bg-repeat-x [background-size:auto_128px] min-[1440px]:block"
          aria-hidden="true"
        />

        <div className="lineage-track-shell relative z-10 w-full overflow-hidden bg-[#131313]">
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex gap-4 overflow-x-auto py-3 select-none cursor-grab scrollbar-none active:cursor-grabbing sm:gap-6 sm:py-4 [mask-image:linear-gradient(to_right,transparent_0%,black_5%,black_95%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_5%,black_95%,transparent_100%)]"
        >
          {[...TRIBES_DATA, ...TRIBES_DATA].map((tribe, index) => {
            const accentColor = getEthnicityColor(tribe.id);
            const readableAccentColor = `color-mix(in srgb, ${accentColor} 55%, white 45%)`;
            const isDuplicate = index >= TRIBES_DATA.length;

            return (
              <button
                type="button"
                key={`${tribe.id}-${index}`}
                onClick={(event) => {
                  if (event.detail === 0 || !hasMoved) {
                    activeTriggerRef.current = isDuplicate
                      ? sliderRef.current?.querySelector(`[data-tribe-id="${tribe.id}"]:not([aria-hidden="true"])`)
                      : event.currentTarget;
                    setSelectedTribe(tribe);
                  }
                }}
                onFocus={() => { isHovered.current = true; }}
                onBlur={() => { isHovered.current = false; }}
                aria-label={`View details about the ${tribe.name} people`}
                aria-haspopup="dialog"
                data-tribe-id={tribe.id}
                aria-hidden={isDuplicate || undefined}
                tabIndex={isDuplicate ? -1 : 0}
                className="lineage-card group cursor-pointer relative overflow-hidden rounded bg-[#1a1a1a] border border-white/5 aspect-[3/4] w-[280px] sm:w-[320px] shrink-0 p-0 text-left transition-all duration-300 hover:[border-color:var(--ethnicity-accent)] hover:shadow-xl hover:shadow-black/30 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2f2f2]"
                style={{
                  '--ethnicity-accent': accentColor,
                  '--ethnicity-readable': readableAccentColor,
                }}
              >
                {/* Image Overlay */}
                <Image
                  src={tribe.image}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover object-center opacity-60 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105 group-hover:mix-blend-normal"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent"></div>

                {/* Hover Eye Badge */}
                <div className="lineage-glass-surface absolute top-4 right-4 bg-black/60 border border-white/10 rounded-full p-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
                  <Eye className="w-4 h-4" style={{ color: readableAccentColor }} aria-hidden="true" />
                </div>

                {/* Bottom details */}
                <div className="lineage-glass-surface absolute bottom-0 left-0 w-full p-6 flex flex-col gap-2 bg-[#131313]/50 border-t border-white/10">
                  <span className="lineage-location font-label-sm text-xs text-[#f2f2f2] uppercase tracking-widest transition-colors group-hover:[color:var(--ethnicity-readable)]">
                    {tribe.region}
                  </span>
                  <span className="type-card-title font-headline-md text-white">
                    {tribe.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Tribe Detail Modal Overlay */}
      {selectedTribe && createPortal(
        <div
          className="fixed inset-0 bg-[#0c0c0c]/90 z-[100] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={() => setSelectedTribe(null)}
        >
          <div
            ref={dialogRef}
            className="bg-[#1a1a1a] border rounded-lg max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain shadow-2xl relative animate-fade-in-up my-auto"
            style={{ borderColor: getEthnicityColor(selectedTribe.id) }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tribe-dialog-title"
            tabIndex={-1}
          >
            {/* Top Image Banner */}
            <div className="h-60 relative w-full">
              <Image
                src={selectedTribe.image}
                alt={`${selectedTribe.name} community`}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent"></div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedTribe(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center font-bold border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                aria-label="Close tribe details"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-6">
                <span className="text-xs font-bold tracking-widest text-[#f2f2f2] uppercase bg-[#999933]/20 border border-[#999933]/30 px-3 py-1 rounded-full">
                  {selectedTribe.region}
                </span>
                <h3 id="tribe-dialog-title" className="lineage-modal-title font-headline-lg text-3xl font-black text-white mt-2">
                  {selectedTribe.name}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
              <p className="font-body-md text-[#f2f2f2] text-base leading-relaxed">
                {selectedTribe.description}
              </p>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-white/5 py-4">
                <div className="flex items-center gap-3">
                  <HeartHandshake className="w-5 h-5 text-[#f2f2f2] shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-white/40 uppercase">Trade Agreement</div>
                    <div className="text-sm font-semibold text-white">{selectedTribe.sustainability}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#f2f2f2] shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-white/40 uppercase">Harvesting Method</div>
                    <div className="text-sm font-semibold text-white">{selectedTribe.harvest}</div>
                  </div>
                </div>
              </div>

              {/* Formulation details */}
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 font-label-sm">
                  <ShieldCheck className="w-4 h-4 text-[#f2f2f2]" />
                  Traditional Formulation Details
                </h4>
                <p className="text-sm text-white/60 leading-relaxed font-body-md">
                  {selectedTribe.details}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTribe(null)}
                  className="bg-transparent hover:bg-white/5 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm border border-white/10 transition-colors cursor-pointer"
                >
                  Close Details
                </button>
                <Link
                  href={`/catalog?tribe=${encodeURIComponent(selectedTribe.name)}`}
                  className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm transition-all duration-300 cursor-pointer border-0 flex items-center gap-1.5 no-underline"
                >
                  Explore Products
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
