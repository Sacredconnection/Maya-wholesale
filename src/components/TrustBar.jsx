import { BadgeCheck, Globe2, Sprout } from 'lucide-react';

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
  return (
    <section
      aria-labelledby="about-maya-title"
      className="relative isolate w-full overflow-hidden bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#999933] to-[#CC6633]"
      />
      <div className="relative mx-auto max-w-6xl">
        <header className="mx-auto max-w-4xl text-center">
          <p className="type-eyebrow text-[#999933] font-label-sm">
            Maya Herbs Wholesale
          </p>
          <h2
            id="about-maya-title"
            className="type-section-title mt-3 uppercase text-[#2D2D2D] font-headline-lg"
          >
            About Maya Ethnobotanicals
          </h2>
          <p className="type-body-lead mx-auto mt-4 max-w-3xl text-[#2D2D2D] font-body-lg">
            Specialists in ethnobotanical herbs and plants, delivering authentic and sustainable products for wholesale clients.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16">
          {PILLARS.map(({ title, description, icon: Icon }, index) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-xl border border-[#999933] bg-white p-7 shadow-[0_14px_32px_rgba(45,45,45,0.12)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#999933] to-[#CC6633]"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#2D2D2D] text-[#F7F6EF] shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="type-eyebrow text-[#999933]" aria-hidden="true">
                  0{index + 1}
                </span>
              </div>
              <h3 className="type-card-title mt-6 text-[#2D2D2D] font-headline-md">
                {title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#2D2D2D] font-body-md">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
