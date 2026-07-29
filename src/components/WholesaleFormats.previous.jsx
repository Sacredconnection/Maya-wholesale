import Image from "next/image";
import { Package, ShoppingBag } from "lucide-react";

const PREVIOUS_FORMATS = [
  {
    title: "Retail-Ready Tins",
    category: "Retail formats",
    description: "Protective metal vessels designed for curated displays, discovery sets, and practitioner collections.",
    icon: Package,
    image: "/wholesale-formats/retail-tins.webp",
    imageAlt: "Maya Herbs retail-ready tins",
    sizes: [
      { volume: "5g / 10g", label: "Discovery & counter display" },
      { volume: "20g / 50g", label: "Core retail & practitioner" },
    ],
  },
  {
    title: "Wholesale Supply Bags",
    category: "Bulk formats",
    description: "Secure high-volume packaging for refill programs, established retailers, and global distribution.",
    icon: ShoppingBag,
    image: "/wholesale-formats/wholesale-bags.webp",
    imageAlt: "Maya Herbs wholesale supply bags",
    sizes: [
      { volume: "250g", label: "Practitioner & refill supply" },
      { volume: "1kg", label: "Bulk wholesale volume" },
    ],
  },
];

export default function WholesaleFormatsPrevious() {
  return (
    <section aria-labelledby="wholesale-formats-title-previous" className="flex w-full flex-col gap-8 py-2 sm:gap-10 sm:py-4">
      <div className="max-w-3xl">
        <span className="mb-3 block font-label-sm text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2f2f2] sm:text-xs">
          Product Line &amp; Categories
        </span>
        <h2 id="wholesale-formats-title-previous" className="mb-3 font-headline-lg text-3xl font-black tracking-tighter text-white sm:mb-4 sm:text-4xl md:text-5xl">
          Product Formats &amp; Wholesale Volumes
        </h2>
        <p className="max-w-2xl font-body-md text-base font-normal leading-relaxed text-white/70 sm:text-lg">
          Protective packaging options for retail display and bulk supply, from compact tins to 1kg wholesale bags.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 font-label-sm">
          <span>Blends</span>
          <span>Retail Packs</span>
          <span>Bulk Supply</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        {PREVIOUS_FORMATS.map(({ title, category, description, icon: Icon, image, imageAlt, sizes }, index) => (
          <article key={title} className="group relative flex overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#f2f2f2]/40 hover:bg-white/[0.07] hover:shadow-[0_22px_55px_rgba(0,0,0,0.18)]">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#f2f2f2]/0 blur-3xl transition-colors duration-300 group-hover:bg-[#f2f2f2]/10" />
            <div className="relative flex w-full flex-col">
              <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10 bg-[#131313]/35">
                {image ? (
                  <Image src={image} alt={imageAlt} fill unoptimized sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#131313]/55 text-[#f2f2f2]">
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-7 lg:p-8">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <span className="font-label-sm text-[9px] font-bold uppercase tracking-[0.16em] text-[#f2f2f2]/80">{category}</span>
                  <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-white/25">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mb-3 font-headline-md text-2xl font-bold text-white">{title}</h3>
                <p className="max-w-md font-body-md text-sm leading-relaxed text-white/60">{description}</p>
                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
                  {sizes.map(({ volume, label }) => (
                    <div key={volume} className="rounded-sm border border-white/[0.08] bg-[#131313]/25 p-3.5 sm:p-4">
                      <span className="block font-headline-md text-lg font-black tracking-tight text-white sm:text-xl">{volume}</span>
                      <span className="mt-1 block font-body-md text-[10px] leading-snug text-white/45 sm:text-[11px]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
