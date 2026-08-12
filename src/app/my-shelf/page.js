"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, PackageOpen, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthGate from "@/components/AuthGate";
import LoginModal from "@/components/LoginModal";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import ShelfToggleButton from "@/components/ShelfToggleButton";
import { useAuth } from "@/components/AuthContext";
import { useProducts } from "@/components/ProductsContext";
import { useShelf } from "@/components/ShelfContext";
import { getEthnicityColor } from "@/lib/ethnicity-colors";

export default function MyShelfPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, error: productsError, reload } = useProducts();
  const {
    productIds,
    loading: shelfLoading,
    saving: shelfSaving,
    error: shelfError,
    replaceProductIds,
  } = useShelf();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const savedProducts = useMemo(() => {
    const productsById = new Map(products.map((product) => [product.id, product]));
    return productIds.map((productId) => productsById.get(productId)).filter(Boolean);
  }, [productIds, products]);

  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  const isLoading = shelfLoading || productsLoading;
  const unavailableCount = Math.max(0, productIds.length - savedProducts.length);

  return (
    <div id="top" className="site-background-page min-h-screen bg-[#25362D] text-[#f2f2f2]">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-8 shadow-2xl sm:px-8 sm:py-10">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-32 bg-[url('/patterns/maya-brand-pattern.svg')] bg-cover bg-left opacity-[0.07] sm:w-52"
          />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#999933]/35 bg-[#999933]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E5E791]">
              <Bookmark className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              Your saved collection
            </div>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h1 className="type-page-title text-white">My Shelf</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                  Keep products close while you plan your next wholesale order. Your shelf is saved to your partner account.
                </p>
              </div>
              {!isLoading && productIds.length > 0 && (
                <p className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-white/45">
                  {productIds.length} {productIds.length === 1 ? "product" : "products"}
                </p>
              )}
            </div>
          </div>
        </section>

        {(shelfError || productsError) && (
          <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-sm border border-[#D9962B]/35 bg-[#D9962B]/10 px-4 py-3 text-sm text-[#eadcae] sm:flex-row sm:items-center">
            <span>{shelfError || productsError}</span>
            {productsError && (
              <button type="button" onClick={reload} className="shrink-0 font-bold uppercase tracking-wider text-white hover:underline">
                Retry
              </button>
            )}
          </div>
        )}

        {!isLoading && !productsError && unavailableCount > 0 && (
          <div role="status" className="flex flex-col items-start justify-between gap-3 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 sm:flex-row sm:items-center">
            <span>
              {unavailableCount} saved {unavailableCount === 1 ? "product is" : "products are"} no longer available in the current catalog.
            </span>
            <button
              type="button"
              disabled={shelfSaving}
              onClick={() => replaceProductIds(savedProducts.map((product) => product.id))}
              className="shrink-0 font-bold uppercase tracking-wider text-[#E5E791] hover:text-white hover:underline disabled:cursor-wait disabled:opacity-50"
            >
              Remove unavailable
            </button>
          </div>
        )}

        {isLoading ? (
          <section aria-label="Loading My Shelf" className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </section>
        ) : savedProducts.length > 0 ? (
          <section aria-label="Products on My Shelf" className="grid gap-4 md:grid-cols-2">
            {savedProducts.map((product) => (
              <article key={product.id} className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-xl border border-white/10 bg-[#171717] p-4 shadow-lg shadow-black/20 transition-colors hover:border-[#999933]/50 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:p-5">
                <Link href={`/product/${encodeURIComponent(product.id)}`} className="block aspect-square overflow-hidden rounded-lg border border-white/10 bg-white">
                  {product.image ? (
                    <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-500 hover:scale-105" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-3xl font-black text-white"
                      style={{ backgroundColor: getEthnicityColor(product.tribe, product.category) }}
                    >
                      {(product.tribe || product.name).charAt(0).toUpperCase()}
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-col">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#E5E791]">{product.category}</p>
                      <Link href={`/product/${encodeURIComponent(product.id)}`} className="no-underline">
                        <h2 className="text-lg font-bold leading-snug text-white transition-colors hover:text-[#E5E791] sm:text-xl">{product.name}</h2>
                      </Link>
                      {product.tribe && <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">Origin: {product.tribe}</p>}
                    </div>
                    <ShelfToggleButton productId={product.id} productName={product.name} variant="icon" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/50 sm:text-sm">
                    {product.description || "Wholesale product from the Maya Herbs collection."}
                  </p>
                </div>

                <div className="col-span-2 border-t border-white/10 pt-4">
                  <ProductPurchaseControls product={product} compact buttonLabel="Add to order" />
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-xl border border-dashed border-[#999933]/40 bg-[#1a1a1a] px-6 py-16 text-center sm:py-20">
            <div className="mx-auto flex max-w-lg flex-col items-center">
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#999933]/35 bg-[#999933]/10 text-[#E5E791]">
                <PackageOpen className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-white">Your shelf is ready</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Save products from the catalog to compare formats and return to them when you are ready to build an order.
              </p>
              <Link href="/catalog" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#b2592d]">
                <Search className="h-4 w-4" aria-hidden="true" />
                Browse the catalog
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
