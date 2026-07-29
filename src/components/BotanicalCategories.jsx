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

const CATEGORIES = [
  {
    name: "Herbs",
    description:
      "Blue Lotus, Kanna, Mulungu, Guayusa and carefully selected botanical blends.",
    icon: Flower2,
    tone: "from-[#cc6632]/22 to-[#cc6632]/5",
  },
  {
    name: "Aya Plants",
    description:
      "Caapi vine, Chacruna, Chaliponga and related South American botanicals.",
    icon: TreePine,
    tone: "from-[#989836]/24 to-[#989836]/5",
  },
  {
    name: "Kratom",
    description:
      "Red, green and white vein options prepared for professional wholesale supply.",
    icon: Leaf,
    tone: "from-[#70966a]/24 to-[#70966a]/5",
  },
  {
    name: "Rapéh",
    description:
      "Traditional and tobacco-free blends made by established artisan partners.",
    icon: MoonStar,
    tone: "from-[#b47a52]/24 to-[#b47a52]/5",
  },
  {
    name: "Superfoods",
    description:
      "Ceremonial cacao, algae, mushrooms, teas and nutrient-rich plant powders.",
    icon: Wheat,
    tone: "from-[#b69b4d]/24 to-[#b69b4d]/5",
  },
  {
    name: "Incense",
    description:
      "Palo Santo, natural resins, essential oils and aromatic ritual products.",
    icon: Sprout,
    tone: "from-[#739179]/24 to-[#739179]/5",
  },
];

export default function BotanicalCategories() {
  return (
    <section
      id="categories"
      aria-labelledby="botanical-categories-title"
      className="scroll-mt-28"
    >
      <div className="mb-8 flex flex-col gap-5 sm:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#d8c58f] sm:text-xs">
            One source, six core ranges
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
          className="inline-flex shrink-0 items-center gap-2 self-start border-b border-[#d8c58f]/45 pb-1 text-xs font-black uppercase tracking-[0.16em] text-[#d8c58f] transition-colors hover:border-white hover:text-white md:self-auto"
        >
          Explore digital catalog
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(
          ({ name, description, icon: CategoryIcon, tone }, index) => (
            <article
              key={name}
              className={`group relative min-h-60 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${tone} p-6 shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d8c58f]/45 hover:shadow-[0_24px_65px_rgba(0,0,0,0.24)] sm:p-7`}
            >
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-10 text-[8rem] font-black leading-none text-white/[0.025]"
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="relative flex h-full flex-col">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-[#d8c58f]/25 bg-black/15 text-[#d8c58f] transition-colors group-hover:border-[#d8c58f]/55 group-hover:bg-[#d8c58f]/10">
                  <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-white">{name}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/60">
                  {description}
                </p>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}
