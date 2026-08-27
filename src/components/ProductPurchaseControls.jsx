"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductsContext";
import { optionPriceForUser } from "@/lib/pricing";
import LeadTimeAvailability from "@/components/LeadTimeAvailability";

export default function ProductPurchaseControls({
  product,
  onAdded,
  onOptionChange,
  buttonLabel = "Add",
  compact = false,
}) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { resolveProduct } = useProducts();
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(() => {
    const firstAvailable = product.options?.findIndex((option) => option.inStock !== false);
    return firstAvailable >= 0 ? firstAvailable : 0;
  });
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [addedAt, setAddedAt] = useState(0);

  useEffect(() => {
    if (!addedAt) return undefined;
    const timer = window.setTimeout(() => setAddedAt(0), 1800);
    return () => window.clearTimeout(timer);
  }, [addedAt]);

  useEffect(() => {
    let cancelled = false;

    if (product.optionsLoaded) {
      return undefined;
    }

    resolveProduct(product)
      .then((loadedProduct) => {
        if (cancelled) return;
        setResolvedProduct(loadedProduct);
        const firstAvailable = loadedProduct.options.findIndex(
          (option) => option.inStock !== false
        );
        setSelectedOptionIndex(firstAvailable >= 0 ? firstAvailable : 0);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "Could not load product options.");
      });

    return () => {
      cancelled = true;
    };
  }, [product, resolveProduct, retryKey]);

  const activeProduct = product.optionsLoaded ? product : resolvedProduct;
  const selectedOption = activeProduct?.options[selectedOptionIndex];
  const price = selectedOption
    ? optionPriceForUser(selectedOption, user, activeProduct.category)
    : null;
  const canAdd = Boolean(selectedOption && selectedOption.inStock !== false && !error);
  const showOptionSelector = Boolean(
    activeProduct &&
      (activeProduct.productType === "variable" ||
        activeProduct.options?.length > 1)
  );

  const handleAdd = () => {
    if (!activeProduct || !canAdd) return;
    addToCart(activeProduct, selectedOptionIndex, quantity);
    setQuantity(1);
    setAddedAt(Date.now());
    onAdded?.(activeProduct, selectedOptionIndex);
  };

  return (
    <div className={`flex w-full flex-col ${compact ? "gap-2.5" : "gap-3"}`}>
      <label className={`${activeProduct && !showOptionSelector ? "hidden" : "flex"} flex-col gap-1.5`}>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">
          Product option
        </span>
        <select
          value={selectedOptionIndex}
          onChange={(event) => {
            const nextOptionIndex = Number(event.target.value);
            setSelectedOptionIndex(nextOptionIndex);
            setAddedAt(0);
            setQuantity(1);
            onOptionChange?.(activeProduct, activeProduct.options[nextOptionIndex]);
          }}
          disabled={!activeProduct || Boolean(error)}
          aria-label={`Select an option for ${product.name}`}
          className={`w-full rounded-sm border border-[#727349] bg-[#131313] text-white outline-none transition-colors focus:border-[#E5E791] focus:ring-2 focus:ring-[#E5E791]/25 disabled:cursor-wait disabled:text-white/60 ${
            compact ? "px-2.5 py-2 text-[11px]" : "px-3 py-2.5 text-xs"
          }`}
        >
          {!activeProduct ? (
            <option>Loading options…</option>
          ) : (
            activeProduct.options.map((option, index) => (
              <option
                key={`${option.wcVariationId || option.sku}-${index}`}
                value={index}
              >
                {option.name} · ${optionPriceForUser(option, user, activeProduct.category).toFixed(2)}
                {option.inStock === false ? " · Out of stock" : ""}
              </option>
            ))
          )}
        </select>
      </label>

      {error ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setRetryKey((key) => key + 1);
          }}
          className="rounded-sm border border-red-300/25 bg-red-400/10 px-3 py-2 text-left text-[10px] text-red-200 transition-colors hover:bg-red-400/15"
        >
          {error} <strong className="ml-1 uppercase">Retry</strong>
        </button>
      ) : selectedOption?.inStock === false ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block truncate text-[9px] uppercase tracking-wider text-white/60">
                {selectedOption.sku || "SKU unavailable"}
              </span>
              <strong className={`block text-[#f2f2f2] ${compact ? "text-sm" : "text-base"}`}>
                {price == null ? "—" : `$${price.toFixed(2)}`}
              </strong>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Out of stock
            </span>
          </div>
          <LeadTimeAvailability product={activeProduct} option={selectedOption} compact={compact} />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-[9px] uppercase tracking-wider text-white/60">
              {selectedOption?.sku || (activeProduct ? "SKU unavailable" : "Loading price")}
            </span>
            <strong className={`block text-[#f2f2f2] ${compact ? "text-sm" : "text-base"}`}>
              {price == null ? "—" : `$${price.toFixed(2)}`}
            </strong>
          </div>

          <div className="flex shrink-0 items-center rounded-sm border border-[#727349] bg-[#131313]">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label={`Decrease quantity of ${product.name}`}
              className={`${compact ? "p-2" : "p-2.5"} cursor-pointer border-0 bg-transparent text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#E5E791]`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-xs font-bold text-white">{quantity}</span>
            <button
              type="button"
              onClick={() =>
                setQuantity((value) =>
                  selectedOption?.stockQuantity == null
                    ? value + 1
                    : Math.min(value + 1, Number(selectedOption.stockQuantity))
                )
              }
              disabled={
                selectedOption?.stockQuantity != null &&
                quantity >= Number(selectedOption.stockQuantity)
              }
              aria-label={`Increase quantity of ${product.name}`}
              className={`${compact ? "p-2" : "p-2.5"} cursor-pointer border-0 bg-transparent text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#E5E791] disabled:cursor-not-allowed disabled:text-white/35`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm border-0 bg-[#cc6633] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#b6532a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791] disabled:cursor-wait disabled:opacity-70 ${
              compact ? "px-3 py-2.5 text-[9px]" : "px-4 py-3 text-[10px]"
            }`}
          >
            {!activeProduct ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : addedAt ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" />
            )}
            {addedAt ? "Added" : buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
