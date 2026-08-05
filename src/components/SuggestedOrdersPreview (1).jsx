"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck, Sparkles } from "lucide-react";
import { useProducts } from "@/components/ProductsContext";

export default function SuggestedOrdersPreview() {
  const { products, loading } = useProducts();
  const examples = products
    .filter((product) => product.inStock !== false)
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 3);

  return (
    <section
      id="suggested-orders"
      className="theme-dark-zone scroll-mt-28 overflow-hidden rounded-xl border border-[#d8c58f]/25 bg-[#242f27]"
    >
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] md:items-center md:p-8">
        <div>
          <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d8c58f]">
            <Sparkles className="h-4 w-4" />
            Suggested orders
          </span>
          <h2 className="mt-3 font-headline-md text-2xl font-bold text-white md:text-3xl">
            Smarter, ready-to-build wholesale orders
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Browse curated assortments and a personalized restock based on your
            history. Every list is checked against live inventory.
          </p>
          <Link
            href="/suggested-orders"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#cc6632] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white no-underline transition-colors hover:bg-[#b6532a]"
          >
            View suggested orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#171717] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#d8c58f]">
                Example assortment
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">Maya Essentials</h3>
            </div>
            <PackageCheck className="h-5 w-5 shrink-0 text-emerald-300" />
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {examples.length > 0 ? (
              examples.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <span className="truncate text-xs font-semibold text-white/75">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-[8px] font-bold uppercase text-emerald-200">
                    In stock
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs leading-relaxed text-white/45">
                {loading
                  ? "Checking the current assortment…"
                  : "Examples return when qualifying products are in stock."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
