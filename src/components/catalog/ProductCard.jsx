"use client";
/* eslint-disable @next/next/no-img-element -- WooCommerce product media. */
import { useState } from "react";
import Link from "next/link";
import ShelfToggleButton from "@/components/ShelfToggleButton";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import { productImageForOption } from "@/lib/product-images";
import { categoryLabel, productFormats } from "@/lib/catalog-organization.mjs";
import { optionPriceForUser } from "@/lib/pricing";

export default function ProductCard({ product, user, isLoggedIn, mode = "order", selected = false, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [image, setImage] = useState("");
  const description = product.description || "Wholesale product from the Maya Herbs collection.";
  const prices = (product.options || []).map(option => optionPriceForUser(option, user, product.category)).filter(Number.isFinite);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  return <article className="grid min-w-0 grid-cols-1 overflow-hidden rounded-lg border border-white/15 bg-[#1a1a1a] sm:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
    <div className="relative m-3 flex h-56 items-center justify-center overflow-hidden rounded-lg bg-white sm:h-auto sm:min-h-56">
      {(image || product.image) ? <img src={image || product.image} alt={product.name} loading="lazy" className="h-56 w-full object-contain p-3 sm:h-full sm:max-h-80" /> : <span className="text-5xl text-[#707026]">{product.name?.charAt(0)}</span>}
    </div>
    <div className="min-w-0 space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-[#707026]">{[...new Set([product.category, product.subcategory || product.tribe, product.childCategory].filter(Boolean).map(categoryLabel))].join(" / ")}</p>
          <h2 className="mt-2 text-xl font-bold text-white">{mode === "order" && isLoggedIn ? <Link href={product.productUrl || "/product/" + product.id}>{product.name}</Link> : product.name}</h2>
          <p className="mt-1 break-all text-xs text-white/60">SKU: {product.sku || product.options?.[0]?.sku || "—"}</p>
        </div>
        {isLoggedIn && mode === "order" && <ShelfToggleButton productId={product.id} productName={product.name} variant="icon" />}
        {mode === "select" && <label className="flex shrink-0 items-center gap-2 text-sm text-white"><input type="checkbox" checked={selected} onChange={onSelect} aria-label={"Include " + product.name + " in catalog"} className="h-5 w-5 accent-[#999933]" /> Include</label>}
      </div>
      <p className={"whitespace-pre-line text-sm leading-6 text-white/70 " + (expanded ? "" : "line-clamp-3")}>{description}</p>
      {description.length > 180 && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="text-xs font-bold text-[#707026]">{expanded ? "Show less" : "Read more"}</button>}
      {mode === "select" && <div className="space-y-2 border-t border-white/15 pt-3 text-sm text-white/75"><p><strong>Available sizes:</strong> {productFormats(product) || "Contact sales for formats"}</p><p><strong>Price range:</strong> {min == null ? "Contact sales" : "€" + min.toFixed(2) + (min !== max ? " – €" + max.toFixed(2) : "")}</p></div>}
      {mode === "order" && isLoggedIn && <ProductPurchaseControls product={product} buttonLabel="Add to cart" onOptionChange={(item, option) => setImage(productImageForOption(item, option))} />}
    </div>
  </article>;
}
