"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useShelf } from "@/components/ShelfContext";

const variantClasses = {
  icon: "h-10 w-10 rounded-full border p-0",
  compact: "min-h-9 rounded-sm border px-3 py-2 text-[10px] uppercase tracking-[0.1em]",
  wide: "min-h-12 rounded-sm border px-5 py-3 text-xs uppercase tracking-[0.12em]",
};

export default function ShelfToggleButton({
  productId,
  productName,
  variant = "compact",
  className = "",
}) {
  const { isOnShelf, toggleProduct, loading, saving } = useShelf();
  const saved = isOnShelf(productId);
  const disabled = loading || saving;
  const actionLabel = saved ? "Remove from My Shelf" : "Save to My Shelf";

  return (
    <button
      type="button"
      onClick={() => toggleProduct(productId)}
      disabled={disabled}
      aria-pressed={saved}
      aria-label={`${actionLabel}: ${productName}`}
      title={actionLabel}
      className={`inline-flex shrink-0 items-center justify-center gap-2 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791] disabled:cursor-wait disabled:opacity-55 ${
        saved
          ? "border-[#999933] bg-[#999933] text-white hover:bg-[#84842c]"
          : "border-white/15 bg-white/5 text-white/75 hover:border-[#999933]/70 hover:bg-[#999933]/10 hover:text-white"
      } ${variantClasses[variant] || variantClasses.compact} ${className}`}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Bookmark
          className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
          aria-hidden="true"
        />
      )}
      {variant !== "icon" && <span>{saved ? "On My Shelf" : "My Shelf"}</span>}
    </button>
  );
}
