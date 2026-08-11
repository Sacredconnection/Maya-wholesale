import Image from "next/image";

const FORMATS = [
  {
    title: "Retail-Ready Tins",
    category: "Retail formats",
    description: "Protective metal vessels designed for curated displays, discovery sets, and practitioner collections.",
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
    image: "/wholesale-formats/wholesale-bags.webp",
    imageAlt: "Maya Herbs wholesale supply bags",
    sizes: [
      { volume: "250g", label: "Practitioner & refill supply" },
      { volume: "1kg", label: "Bulk wholesale volume" },
    ],
  },
];

export default function WholesaleFormats() {
  return (
    <section
      aria-labelledby="wholesale-formats-title"
      className="flex w-full flex-col gap-8 sm:gap-10"
    >
      <div className="max-w-3xl">
        <span className="type-eyebrow mb-3 block font-label-sm text-[#f2f2f2]">
          Product Line &amp; Categories
        </span>
        <h2
          id="wholesale-formats-title"
          className="type-section-title mb-3 font-headline-lg text-white sm:mb-4"
        >
          Product Formats &amp; Wholesale Volumes
        </h2>
        <p className="type-body-lead max-w-2xl font-body-md text-white/70">
          Protective packaging options for retail display and bulk supply, from compact tins to 1kg wholesale bags.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 font-label-sm">
          <span>Blends</span>
          <span>Retail Packs</span>
          <span>Bulk Supply</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {FORMATS.map(({ title, category, description, image, imageAlt, sizes }) => (
          <article
            key={title}
            className="wholesale-format-card home-green-outline group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white/[0.03] p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(0,0,0,0.24)] sm:p-7 lg:p-8"
          >
            <div className="relative z-10 mb-8 flex h-56 items-center justify-center sm:h-64 lg:h-72">
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="wholesale-format-image object-contain drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

            <div className="relative z-10 border-t border-white/10 pt-6">
              <span className="wholesale-format-category type-eyebrow mb-2 block font-label-sm text-[#ffffff]">
                {category}
              </span>
              <h3 className="wholesale-format-title type-card-title font-headline-md text-white transition-colors duration-300 group-hover:text-[#ffffff]">
                {title}
              </h3>
              <p className="wholesale-format-description mt-3 max-w-xl font-body-md text-sm leading-relaxed text-white/80">
                {description}
              </p>

              <ul className="mt-6 grid grid-cols-2 gap-3" aria-label={`${title} available sizes`}>
                {sizes.map(({ volume, label }) => (
                  <li
                    key={volume}
                    className="wholesale-format-badge rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-center transition-colors duration-300 group-hover:border-white/20"
                  >
                    <strong className="block font-mono text-sm font-bold text-white">
                      {volume}
                    </strong>
                    <span className="wholesale-format-detail mt-1 block font-body-md text-[10px] leading-snug text-white/70 sm:text-[11px]">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
