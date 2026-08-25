"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductsContext";

export default function ProductRecommendations({
  title,
  eyebrow,
  description,
  limit = 2,
  variant = "drawer",
  onAdded,
}) {
  const { cart } = useCart();
  const { products, loading } = useProducts();

  const recommendations = useMemo(() => {
    const productIds = new Set(cart.map((item) => item.id));
    const categories = new Set(cart.map((item) => item.category).filter(Boolean));

    return products
      .filter((product) => product.inStock !== false && !productIds.has(product.id))
      .sort((a, b) => {
        const categoryDifference =
          Number(categories.has(b.category)) - Number(categories.has(a.category));
        return categoryDifference || a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }, [cart, limit, products]);

  if (loading || cart.length === 0 || recommendations.length === 0) return null;

  const isDrawer = variant === "drawer";

  return (
    <section className={`${isDrawer ? "border-t border-[#999A61] pt-5" : "rounded-lg border border-[#999933]/25 bg-[#242f27]/45 p-4 sm:p-5"}`}>
      <div className="mb-4">
        {eyebrow && (
          <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#f2f2f2]">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </span>
        )}
        <h3 className={`${isDrawer ? "text-sm" : "text-base"} font-bold text-white`}>{title}</h3>
        {description && <p className="mt-1 text-[10px] leading-relaxed text-white/60">{description}</p>}
      </div>

      <div className={`grid gap-3 ${isDrawer ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {recommendations.map((product) => (
          <article key={product.id} className="rounded-lg border border-[#727349] bg-[#1a1a1a] p-3 shadow-md shadow-black/15">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white">
                {product.image ? (
                  <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-xs font-bold text-white">{product.name}</h4>
                <p className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-white/60">
                  {product.category}
                </p>
              </div>
            </div>
            <ProductPurchaseControls
              product={product}
              compact
              buttonLabel="Add"
              onAdded={onAdded}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
