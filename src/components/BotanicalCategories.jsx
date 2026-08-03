import Link from "next/link";
import {
  ArrowUpRight,
  Flower2,
  Leaf,
  MoonStar,
  Sprout,
  TreePine,
  Wheat,
} from "lucide-react";

const CATEGORY_STYLES = [
  { icon: Flower2, tone: "from-[#cc6633]/22 to-[#cc6633]/5" },
  { icon: TreePine, tone: "from-[#999933]/24 to-[#999933]/5" },
  { icon: Leaf, tone: "from-[#70966a]/24 to-[#70966a]/5" },
  { icon: MoonStar, tone: "from-[#b47a52]/24 to-[#b47a52]/5" },
  { icon: Wheat, tone: "from-[#b69b4d]/24 to-[#b69b4d]/5" },
  { icon: Sprout, tone: "from-[#739179]/24 to-[#739179]/5" },
];

export default function BotanicalCategories({ categories = [] }) {
  const rangeLabel = `${categories.length} core ${
    categories.length === 1 ? "range" : "ranges"
  }`;

  return (
    <section
      id="categories"
      aria-labelledby="botanical-categories-title"
      className="scroll-mt-28"
    >
      <div className="mb-8 flex flex-col gap-5 sm:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#f2f2f2] sm:text-xs">
            One source, {rangeLabel}
          </span>
          <h2
            id="botanical-categories-title"
            className="text-3xl font-black tracking-tighter text-white sm:text-4xl md:text-5xl"
          >
            Build a distinctive botanical assortment.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Plan your wholesale selection across established ethnobotanical,
            ceremonial and aromatic categories from one experienced partner.
          </p>
        </div>

        <Link
          href="/digital-catalog"
          className="inline-flex shrink-0 items-center gap-2 self-start border-b border-[#f2f2f2]/45 pb-1 text-xs font-black uppercase tracking-[0.16em] text-[#f2f2f2] transition-colors hover:border-white hover:text-white md:self-auto"
        >
          Explore digital catalog
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {categories.map(({ id, name, description }, index) => {
          const { icon: CategoryIcon, tone } =
            CATEGORY_STYLES[index % CATEGORY_STYLES.length];
          const isLastOddCard =
            categories.length % 2 === 1 && index === categories.length - 1;
          const startsCenteredPair =
            categories.length % 3 === 2 && index === categories.length - 2;
          const isCenteredSingle =
            categories.length % 3 === 1 && index === categories.length - 1;

          return (
            <article
              key={id ?? name}
              className={`group relative min-h-80 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${tone} p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[#f2f2f2]/45 hover:shadow-[0_24px_65px_rgba(0,0,0,0.24)] sm:col-span-1 sm:p-7 lg:col-span-2 ${
                isLastOddCard
                  ? "sm:col-span-2 sm:w-[calc(50%-0.5rem)] sm:justify-self-center lg:w-auto"
                  : ""
              } ${startsCenteredPair ? "lg:col-start-2" : ""} ${
                isCenteredSingle ? "lg:col-start-3" : ""
              }`}
            >
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-10 text-[8rem] font-black leading-none text-white/[0.025]"
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="relative flex h-full flex-col">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-[#f2f2f2]/25 bg-black/15 text-[#f2f2f2] transition-colors group-hover:border-[#f2f2f2]/55 group-hover:bg-[#f2f2f2]/10">
                  <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-white">{name}</h3>
                <p className="mt-3 line-clamp-5 max-w-sm text-sm leading-7 text-white/60">
                  {description || `Explore our wholesale ${name} selection.`}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
