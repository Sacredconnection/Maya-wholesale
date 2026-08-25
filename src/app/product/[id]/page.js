"use client";

/* eslint-disable @next/next/no-img-element -- Runtime product URLs require native image fallbacks. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import AuthGate from "@/components/AuthGate";
import { useProducts } from "@/components/ProductsContext";
import { optionPriceForUser } from "@/lib/pricing";
import { productImageForOption } from "@/lib/product-images";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import ShelfToggleButton from "@/components/ShelfToggleButton";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingBag,
  Minus,
  Plus,
  ShieldCheck,
  Globe
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("fromPage") || "1";
  const { id } = params;

  const { addToCart } = useCart();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();

  // Find the lightweight catalog product first, then hydrate variable options on demand.
  const catalogProduct = products.find(
    (p) =>
      p.id === id ||
      (p.storeId === "maya-herbs" && p.id === `maya-herbs~${id}`)
  );
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [productLoadError, setProductLoadError] = useState("");
  const product = resolvedProduct?.id === catalogProduct?.id ? resolvedProduct : catalogProduct;
  const [selectedOptIdx, setSelectedOptIdx] = useState(() => {
    const firstAvailable = product?.options?.findIndex(
      (option) => option.inStock !== false
    );
    return firstAvailable >= 0 ? firstAvailable : 0;
  });
  const [quantity, setQuantity] = useState(1);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const relatedCarouselRef = useRef(null);
  const [relatedControls, setRelatedControls] = useState({ previous: false, next: false });
  const [addedAt, setAddedAt] = useState(0);

  useEffect(() => {
    if (
      !catalogProduct ||
      (catalogProduct.optionsLoaded && catalogProduct.images?.length > 1)
    ) return undefined;

    let cancelled = false;

    async function loadProductOptions() {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(catalogProduct.id)}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not load this product's options.");
        }
        if (!cancelled) {
          setResolvedProduct(data.product);
          const firstAvailable = data.product.options.findIndex(
            (option) => option.inStock !== false
          );
          setSelectedOptIdx(firstAvailable >= 0 ? firstAvailable : 0);
          setQuantity(1);
          setAddedAt(0);
        }
      } catch (error) {
        if (!cancelled) {
          setProductLoadError(
            error.name === "TimeoutError"
              ? "This product's options took too long to load. Please try again."
              : error.message
          );
        }
      }
    }

    loadProductOptions();
    return () => {
      cancelled = true;
    };
  }, [catalogProduct]);

  const relatedProductPool = useMemo(() => {
    if (!product) return [];

    return products.filter((item) => item.id !== product.id);
  }, [product, products]);

  useEffect(() => {
    if (!addedAt) return undefined;
    const timer = window.setTimeout(() => setAddedAt(0), 1800);
    return () => window.clearTimeout(timer);
  }, [addedAt]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const shuffledProducts = [...relatedProductPool];

      for (let index = shuffledProducts.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledProducts[index], shuffledProducts[randomIndex]] = [
          shuffledProducts[randomIndex],
          shuffledProducts[index],
        ];
      }

      setRelatedProducts(shuffledProducts.slice(0, 12));
    });

    return () => cancelAnimationFrame(frame);
  }, [relatedProductPool]);

  useEffect(() => {
    const carousel = relatedCarouselRef.current;
    if (!carousel) return undefined;

    const updateControls = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      setRelatedControls({
        previous: carousel.scrollLeft > 4,
        next: carousel.scrollLeft < maxScroll - 4,
      });
    };

    carousel.scrollTo({ left: 0 });
    const frame = requestAnimationFrame(updateControls);
    window.addEventListener("resize", updateControls);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateControls);
    };
  }, [isLoggedIn, relatedProducts.length, product?.id]);

  // Product pages are partner-only: block until authenticated
  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  // Product not in the static catalog yet — it may exist only in WooCommerce,
  // so hold off on "not found" until the live catalog finishes loading.
  if (!product && productsLoading) {
    return (
      <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />
        <main className="site-content-shell flex flex-grow flex-col items-center justify-center gap-4 py-16 text-center sm:py-20 lg:py-24">
          <div className="w-10 h-10 border-2 border-[#999933] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Loading product…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // If product doesn't exist
  if (!product) {
    return (
      <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />
        <main className="site-content-shell flex flex-grow flex-col items-center justify-center gap-6 py-16 text-center sm:py-20 lg:py-24">
          <div className="text-6xl">⚠️</div>
          <h2 className="font-headline-md text-3xl font-bold text-white">Product Not Found</h2>
          <p className="text-white/60 text-sm max-w-md">
            The wholesale remedy you are looking for does not exist or has been removed from our inventory.
          </p>
          <Link
            href="/catalog"
            className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-sm transition-all animate-fade-in"
          >
            Back to Catalog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedOption = product.options[selectedOptIdx];
  const productGallery = [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
  const automaticProductImage = productImageForOption(product, selectedOption);
  const selectedProductImage =
    selectedGalleryImage && productGallery.includes(selectedGalleryImage)
      ? selectedGalleryImage
      : automaticProductImage;
  const productDescription = product.description || "Wholesale botanical product sourced through equitable fair-trade agreements with Amazonian community associations and prepared using established local production methods.";
  const hasLongDescription = productDescription.length > 280;

  // Pricing calculations with discount
  const basePrice = optionPriceForUser(selectedOption, user, product.category);
  const discountPercentage = isLoggedIn && user ? user.discountRate : 0;
  const discountAmount = basePrice * (discountPercentage / 100);
  const finalPrice = basePrice - discountAmount;

  const handleAddToCartClick = () => {
    if (!product.optionsLoaded || selectedOption?.inStock === false) return;
    addToCart(product, selectedOptIdx, quantity);
    setAddedAt(Date.now());
  };

  const scrollRelatedProducts = (direction) => {
    const carousel = relatedCarouselRef.current;
    const firstCard = carousel?.querySelector("[data-related-product]");
    if (!carousel || !firstCard) return;

    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
    const distance = firstCard.getBoundingClientRect().width + gap;
    carousel.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased justify-between">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Main Container */}
      <main className="site-content-shell flex flex-grow flex-col gap-10 py-10 sm:gap-12 sm:py-12">

        {/* Breadcrumbs / Back button */}
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-white/50 font-mono">
          <Link href={`/catalog?page=${fromPage}`} className="flex items-center gap-1.5 hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-4.5 h-4.5" />
            Back to Wholesale Catalog (Page {fromPage})
          </Link>
          {fromPage !== "1" && (
            <>
              <span>·</span>
              <Link href="/catalog" className="hover:text-white transition-colors no-underline">
                First Page
              </Link>
            </>
          )}
          <span>/</span>
          <span className="break-words text-white/30 capitalize">{product.category}</span>
          <span>/</span>
          <span className="min-w-0 break-words text-white/80">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start bg-[#1a1a1a] border border-white/10 rounded-xl p-5 sm:p-6 md:p-8 shadow-2xl">

          {/* Product image */}
          <div className="lg:col-span-6 w-full">
          <div className="bg-white rounded-lg aspect-square flex items-center justify-center relative overflow-hidden group select-none shadow-lg shadow-black/15">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#999933]/5 via-transparent to-transparent opacity-60 z-0"></div>

            {/* Real Product Image with Fallback */}
            {!imgError ? (
              <div className="w-full h-full overflow-hidden rounded-lg bg-white relative z-10">
                <img
                  src={selectedProductImage || `/products/${product.photoFolder}/${product.photo}.jpg`}
                  alt={product.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center px-8 relative z-10">
                <div className="w-16 h-16 rounded-full bg-[#999933]/15 border border-[#999933]/30 flex items-center justify-center text-2xl text-[#f2f2f2]">
                  📷
                </div>
                <span className="text-[#f2f2f2] text-xs font-bold uppercase tracking-widest block mt-2">
                  No Image Uploaded
                </span>
                <span className="text-[10px] text-white/35 font-mono leading-relaxed block max-w-xs">
                  Upload a 900x900 jpg image to:<br />
                  <code className="text-[#f2f2f2] bg-black/40 px-1.5 py-0.5 rounded block mt-1.5 break-all select-all">
                    /public/products/{product.photoFolder}/{product.photo}.jpg
                  </code>
                </span>
              </div>
            )}
          </div>

          {productGallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Product image gallery">
              {productGallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => {
                    setSelectedGalleryImage(image);
                    setImgError(false);
                  }}
                  aria-label={`View image ${index + 1} of ${product.name}`}
                  aria-pressed={selectedProductImage === image}
                  className={`aspect-square overflow-hidden rounded-md border bg-white p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#999933] ${
                    selectedProductImage === image
                      ? "border-[#999933] ring-2 ring-[#999933]/25"
                      : "border-white/15 hover:border-[#999933]/60"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          </div>

          {/* Right Column: Content and Options */}
          <div className="lg:col-span-6 flex flex-col gap-4">

            {/* Product Meta Category & Tribe Badges */}
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-block text-[10px] font-bold bg-[#999933]/15 text-[#f2f2f2] border border-[#999933]/30 px-3 py-1 rounded-full uppercase tracking-wider font-label-sm">
                {product.category}
              </span>
              {product.tribe && (
                <span className="inline-block text-[10px] font-bold bg-white/5 text-white/60 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider font-label-sm">
                  Origin: {product.tribe}
                </span>
              )}
              <span className="inline-block text-[10px] font-bold text-white/45 px-2 py-1 uppercase tracking-wider font-label-sm">
                Store: {product.storeName}
              </span>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="type-page-title font-headline-lg text-white">
                {product.name}
              </h1>
              <p className="text-[11px] font-mono text-white/40 mt-1">
                SKU: <span className="text-white/60 font-bold">{selectedOption?.sku || product.sku}</span>
              </p>
            </div>

            {/* Price display */}
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#f2f2f2] font-headline-lg">
                    ${finalPrice.toFixed(2)}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="text-xs font-mono text-white/40 line-through">
                      ${basePrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {discountPercentage > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                  Partner {user.discountRate}% Off
                </span>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                Product Description
              </span>
              <p className={`font-body-md text-sm text-white/70 leading-relaxed ${!isDescriptionExpanded && hasLongDescription ? "line-clamp-5 sm:line-clamp-4" : ""}`}>
                {productDescription}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                  aria-expanded={isDescriptionExpanded}
                  className="self-start bg-transparent border-0 p-0 text-[10px] font-bold uppercase tracking-wider text-[#f2f2f2] hover:text-white transition-colors cursor-pointer"
                >
                  {isDescriptionExpanded ? "Show less" : "Read full description"}
                </button>
              )}
            </div>

            <div className="h-px bg-white/10 my-1"></div>

            {/* Options Selection form */}
            <div className="flex flex-col gap-4">

              {/* Size Select Dropdown */}
              {!product.optionsLoaded ? (
                <div className="rounded border border-[#f2f2f2]/20 bg-[#f2f2f2]/5 px-4 py-3 text-xs text-[#f2f2f2]">
                  {productLoadError || "Loading product options..."}
                </div>
              ) : product.productType === "variable" && product.options.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                    Weight / Packaging Size
                  </label>
                  <select
                    value={selectedOptIdx}
                    onChange={(event) => {
                      const nextOptionIndex = Number.parseInt(event.target.value, 10);
                      setSelectedOptIdx(nextOptionIndex);
                      setSelectedGalleryImage(
                        productImageForOption(product, product.options[nextOptionIndex])
                      );
                      setImgError(false);
                      setAddedAt(0);
                      setQuantity(1);
                    }}
                    className="bg-[#1a1a1a] border border-white/10 text-sm text-white rounded px-4 py-3.5 focus:border-[#999933] outline-none w-full"
                  >
                    {product.options.map((opt, idx) => (
                      <option key={opt.sku} value={idx} disabled={opt.inStock === false}>
                        {opt.name} (${optionPriceForUser(opt, user, product.category).toFixed(2)})
                        {opt.inStock === false ? " · Out of stock" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Purchase Box */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mt-1">

                {/* Quantity select */}
                <div className="flex flex-col gap-1.5 sm:shrink-0">
                  <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                    Quantity
                  </span>
                  <div className="flex items-center justify-between sm:justify-start bg-[#1a1a1a] border border-white/10 rounded">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-3 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-white font-mono select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((previous) =>
                          selectedOption?.stockQuantity == null
                            ? previous + 1
                            : Math.min(previous + 1, Number(selectedOption.stockQuantity))
                        )
                      }
                      disabled={
                        selectedOption?.stockQuantity != null &&
                        quantity >= Number(selectedOption.stockQuantity)
                      }
                      className="p-3 text-white/50 hover:text-white cursor-pointer bg-transparent border-0 disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Basket button */}
                <div className="flex-grow w-full">
                  <button
                    onClick={handleAddToCartClick}
                    disabled={!product.optionsLoaded || selectedOption?.inStock === false}
                    className="w-full bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-widest py-4 px-6 rounded shadow-lg shadow-[#cc6633]/20 hover:shadow-[#cc6633]/45 transition-all flex items-center justify-center gap-2 cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#cc6633]"
                  >
                    {addedAt ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    {!product.optionsLoaded
                      ? "Loading options..."
                      : selectedOption?.inStock === false
                        ? "Out of stock"
                        : addedAt
                          ? "Added to cart"
                          : "Add to Basket"}
                  </button>
                </div>

              </div>

              <ShelfToggleButton
                productId={product.id}
                productName={product.name}
                variant="wide"
                className="w-full"
              />

            </div>

            <div className="h-px bg-white/10 my-1"></div>

            {/* B2B Certifications Trust Flags */}
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#f2f2f2] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-white block">Sustainably Harvested</span>
                  <span className="text-[10px] text-white/40 leading-relaxed block">Honoring natural cycles</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Globe className="w-5 h-5 text-[#f2f2f2] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-white block">Direct Indigenous Trade</span>
                  <span className="text-[10px] text-white/40 leading-relaxed block">Fair compensation share</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5 sm:p-6 md:p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
            <h2 className="text-white text-2xl font-bold font-headline-md">Related products</h2>
            <div className="flex shrink-0 items-center gap-2" aria-label="Related product carousel controls">
              <button
                type="button"
                onClick={() => scrollRelatedProducts(-1)}
                disabled={!relatedControls.previous}
                aria-label="Show previous related product"
                className="related-carousel-button grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#131313] text-[#f2f2f2] shadow-lg transition-colors hover:border-[#f2f2f2] hover:text-[#eadcae] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollRelatedProducts(1)}
                disabled={!relatedControls.next}
                aria-label="Show next related product"
                className="related-carousel-button grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#131313] text-[#f2f2f2] shadow-lg transition-colors hover:border-[#f2f2f2] hover:text-[#eadcae] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={relatedCarouselRef}
            onScroll={(event) => {
              const carousel = event.currentTarget;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;
              setRelatedControls({
                previous: carousel.scrollLeft > 4,
                next: carousel.scrollLeft < maxScroll - 4,
              });
            }}
            className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 touch-pan-x sm:gap-5 lg:gap-6"
            aria-label="Related products"
          >
            {relatedProducts.map((p) => {
              // Find min and max price
              const prices = p.options.map(opt => optionPriceForUser(opt, user, p.category));
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);

              // Format the name to start with "Rapé" if it ends with "Rapeh"
              let displayName = p.name;
              if (displayName.endsWith(" Rapeh")) {
                const baseName = displayName.slice(0, -6);
                displayName = `Rapé ${baseName}`;
              }

              return (
                <div
                  key={p.id}
                  data-related-product
                  className="group flex min-w-[86%] snap-start flex-col gap-4 rounded-lg border border-white/5 bg-[#131313] p-5 text-left transition-all duration-300 hover:border-[#999933]/30 hover:shadow-lg hover:shadow-[#999933]/5 sm:min-w-[calc(50%_-_10px)] lg:min-w-[calc(25%_-_18px)]"
                >
                  {/* Product Image */}
                  <Link href={`/product/${p.id}?fromPage=${fromPage}`} className="block aspect-square overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5 relative">
                    <img
                      src={p.image || `/products/${p.photoFolder}/${p.photo}.jpg`}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/banner/maya-wholesale/logo-maya-wholesale.svg";
                        e.target.className = "w-full h-full object-contain p-8 opacity-20";
                      }}
                    />
                  </Link>

                  <div className="flex flex-col gap-2">
                    {/* Product Title */}
                    <Link href={`/product/${p.id}?fromPage=${fromPage}`} className="font-headline-md text-base font-bold text-white group-hover:text-[#f2f2f2] transition-colors line-clamp-2 no-underline min-h-[48px] flex items-center">
                      {displayName}
                    </Link>

                    {/* Price Range */}
                    <span className="text-[#f2f2f2] font-headline-md font-bold text-sm">
                      ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Select Options Button */}
                  <div className="mt-auto pt-2">
                    <Link href={`/product/${p.id}?fromPage=${fromPage}`} className="w-full inline-block text-center bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] py-3.5 px-4 rounded-sm transition-colors uppercase tracking-widest no-underline border border-white/10 font-label-sm">
                      Select options
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

      </main>

      <Footer />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
