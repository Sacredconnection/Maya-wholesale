import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    name: "Herbs",
    description:
      "Blue Lotus, Kanna, Mulungu, Guayusa and carefully selected botanical blends.",
    image: "/categories/herbs.webp",
    imageAlt: "Selected wholesale herbs",
  },
  {
    name: "Aya Plants",
    description:
      "Caapi vine, Chacruna, Chaliponga and related South American botanicals.",
    image: "/categories/aya-plants.webp",
    imageAlt: "Aya plant ingredients",
  },
  {
    name: "Kratom",
    description:
      "Red, green and white vein options prepared for professional wholesale supply.",
    image: "/categories/kratom.webp",
    imageAlt: "Kratom leaves",
  },
  {
    name: "Rapéh",
    description:
      "Traditional and tobacco-free blends made by established artisan partners.",
    image: "/categories/rapeh.webp",
    imageAlt: "Traditional Rapéh blends",
  },
  {
    name: "Superfoods",
    description:
      "Ceremonial cacao, algae, mushrooms, teas and nutrient-rich plant powders.",
    image: "/categories/superfoods.webp",
    imageAlt: "Botanical superfood ingredients",
  },
  {
    name: "Incense",
    description:
      "Palo Santo, natural resins, essential oils and aromatic ritual products.",
    image: "/categories/incense.webp",
    imageAlt: "Natural incense ingredients",
  },
];

const getHoverImage = (image) => image.replace(/(\.[^.]+)$/, "-02$1");

export default function BotanicalCategories() {
  return (
    <section
      id="categories"
      aria-label="Botanical product categories"
      className="mx-auto w-full max-w-[72rem] scroll-mt-28"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(({ name, description, image, imageAlt }) => (
          <div key={name}>
            <article className="group relative flex h-full min-h-[26rem] flex-col overflow-hidden rounded-xl border border-[#999933] bg-white shadow-[0_6px_20px_rgba(45,45,45,0.06)] transition-[transform,box-shadow] duration-700 ease-in-out will-change-transform after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-xl after:border after:border-transparent after:content-[''] after:transition-colors after:duration-700 after:ease-in-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(75,80,30,0.10)] hover:after:border-[#999933] focus-within:-translate-y-0.5 focus-within:shadow-[0_12px_30px_rgba(75,80,30,0.10)] focus-within:after:border-[#999933] motion-reduce:transform-none motion-reduce:transition-none motion-reduce:after:transition-none">
              <div className="relative aspect-[16/10] w-full shrink-0 bg-[#E8E7DF]" aria-hidden={!image}>
                {image ? (
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    unoptimized
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover opacity-100 transition-[opacity,transform] duration-500 ease-in-out will-change-[opacity,transform] group-hover:scale-[1.015] group-hover:opacity-0 group-focus-within:scale-[1.015] group-focus-within:opacity-0 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                ) : null}
                {image ? (
                  <Image
                    src={getHoverImage(image)}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover opacity-0 transition-[opacity,transform] duration-500 ease-in-out will-change-[opacity,transform] group-hover:scale-[1.015] group-hover:opacity-100 group-focus-within:scale-[1.015] group-focus-within:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col bg-white px-6 pb-6 pt-5">
                <h2 className="type-card-title text-[#2D2D2D] font-headline-md">
                  {name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#2D2D2D]/70">
                  {description}
                </p>
                <Link
                  href={{ pathname: "/catalog", query: { category: name } }}
                  className="botanical-category-button relative z-20"
                  aria-label={`View ${name} products`}
                >
                  View products
                </Link>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
