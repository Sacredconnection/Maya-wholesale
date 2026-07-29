"use client";

/* eslint-disable @next/next/no-img-element -- Product images are remote WooCommerce media. */

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, ShoppingBag } from "lucide-react";
import { getEthnicityColor } from "@/lib/ethnicity-colors";

export default function ProductCard({
  product,
  isLoggedIn,
  onAddToCart,
  onRequireLogin,
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const selectedOption = product.options[0];
  const description =
    product.description || "Wholesale product from the Maya Herbs collection.";
  const hasLongDescription = description.length > 180;
  const descriptionId = `product-description-${product.id}`;
  const media = (
    <>
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-7xl font-black text-white/90"
          style={{
            backgroundColor: getEthnicityColor(product.tribe, product.category),
          }}
        >
          {(product.tribe || product.name).charAt(0).toUpperCase()}
        </div>
      )}

      {product.isNew && (
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-sm bg-[#999933] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">
            New
          </span>
        </div>
      )}
    </>
  );

  return (
    <article
      className={`group grid min-w-0 grid-cols-1 items-stretch overflow-hidden rounded-lg border border-white/15 bg-[#1a1a1a] transition-all duration-300 hover:border-[#999933]/70 hover:shadow-xl hover:shadow-black/20 sm:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] ${
        isDescriptionExpanded
          ? "min-h-[41.5rem] sm:min-h-[22rem] xl:min-h-[18rem]"
          : "h-[41.5rem] sm:h-[22rem] xl:h-[18rem]"
      }`}
    >
      {isLoggedIn ? (
        <Link
          href={product.productUrl}
          aria-label={`View ${product.name}`}
          className="relative m-3 block h-56 overflow-hidden rounded-lg border border-[#f2f2f2]/25 bg-white sm:h-auto sm:min-h-0 xl:self-stretch"
        >
          {media}
        </Link>
      ) : (
        <div className="relative m-3 block h-56 overflow-hidden rounded-lg border border-[#f2f2f2]/25 bg-white sm:h-auto sm:min-h-0 xl:self-stretch">
          {media}
        </div>
      )}

      <div className="flex min-w-0 flex-col p-4 sm:p-5 xl:p-4">
        <div className="mb-3 flex min-h-[4.25rem] min-w-0 items-start justify-between gap-3 xl:min-h-0">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f2f2f2]">
              {product.category}
            </p>
            {isLoggedIn ? (
              <Link href={product.productUrl} className="block no-underline">
                <h2 title={product.name} className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#f2f2f2] sm:text-xl xl:truncate">
                  {product.name}
                </h2>
              </Link>
            ) : (
              <h2 title={product.name} className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#f2f2f2] sm:text-xl xl:truncate">
                {product.name}
              </h2>
            )}
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[#f2f2f2]" aria-hidden="true" />
        </div>

        <div className={isDescriptionExpanded ? "" : "min-h-28 sm:min-h-28 xl:min-h-[4.5rem]"}>
          <p
            id={descriptionId}
            className={`whitespace-pre-line text-sm leading-6 text-white/55 sm:text-[15px] sm:leading-7 ${
              hasLongDescription && !isDescriptionExpanded
                ? "line-clamp-3 xl:line-clamp-2"
                : ""
            }`}
          >
            {description}
          </p>
          {hasLongDescription ? (
            <button
              type="button"
              aria-expanded={isDescriptionExpanded}
              aria-controls={descriptionId}
              onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
              className="mt-2 self-start text-xs font-black uppercase tracking-[0.1em] text-[#f2f2f2] transition-colors hover:text-white"
            >
              {isDescriptionExpanded ? "Show less" : "Read more"}
            </button>
          ) : (
            <span className="invisible mt-2 block text-xs font-black uppercase" aria-hidden="true">
              Read more
            </span>
          )}
        </div>

        <div className="mt-auto grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-5 xl:pt-3">
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">
                SKU
              </span>
              <span className="block break-all font-mono text-xs text-white/65">
                {selectedOption?.sku || product.sku}
              </span>
            </div>

            {product.options.length > 0 && (
              <fieldset className="mt-2 min-w-0">
                <legend className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  Available formats
                </legend>
                <div className="flex flex-wrap gap-1.5 xl:flex-nowrap">
                  {product.options.map((option, index) => {
                    const label = option.weightGrams
                      ? `${option.weightGrams}g`
                      : option.name;
                    return (
                      <span
                        key={`${option.sku}-${index}`}
                        className="catalog-format-tag inline-flex min-h-8 shrink-0 items-center rounded-sm border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/75"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              disabled={product.inStock === false || selectedOption?.inStock === false}
              onClick={() => onAddToCart(product, 0)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border-0 bg-[#cc6633] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#b6532a] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 sm:col-span-2 xl:col-span-1 xl:min-w-48"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to order
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequireLogin}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#999933]/60 hover:bg-white/10 sm:col-span-2 xl:col-span-1 xl:min-w-48"
            >
              <LockKeyhole className="h-4 w-4 text-[#f2f2f2]" aria-hidden="true" />
              Sign in to order
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
