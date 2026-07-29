"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import AuthGate from "@/components/AuthGate";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import {
  ShoppingBag,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  PackageOpen,
  LoaderCircle,
} from "lucide-react";

import { useProducts } from "@/components/ProductsContext";
import { getEthnicityColor } from "@/lib/ethnicity-colors";
import { downloadDigitalCatalogPdf } from "@/lib/catalog-export";

// Normalize string for accent-insensitive comparison
// Strips diacritics, lowercases and trims — used ONLY for comparison, never for display
const normalizeStr = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const items = [1];
  const rangeStart = Math.max(2, Math.min(currentPage - 2, totalPages - 5));
  const rangeEnd = Math.min(totalPages - 1, Math.max(currentPage + 2, 6));

  if (rangeStart > 2) items.push("ellipsis-start");
  for (let page = rangeStart; page <= rangeEnd; page += 1) items.push(page);
  if (rangeEnd < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
};
export default function CatalogPage() {
  const { products, loading: productsLoading, error: productsError, warning: productsWarning, reload } = useProducts();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { setIsCartOpen, cartTotalItems } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfExportError, setPdfExportError] = useState("");

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tribe, setTribe] = useState("All");
  const [attributeFilters, setAttributeFilters] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Read URL query parameters to set initial tribe filter and page
  // Resolve accent-insensitively against actual data so URL params always match
  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const tribeParam = params.get("tribe");
      if (tribeParam) {
        const match = products.find(
          (p) => normalizeStr(p.tribe) === normalizeStr(tribeParam)
        );
        setCategory(match?.category || "All");
        setTribe(match?.tribe || "All");
      }
      const pageParam = params.get("page");
      if (pageParam) {
        const pageNum = parseInt(pageParam);
        if (!isNaN(pageNum) && pageNum > 0) {
          setCurrentPage(pageNum);
        }
      }
    }, 0);

    return () => window.clearTimeout(syncTimer);
    // Re-resolve the tribe param when the live catalog swaps in, so URL
    // filters keep matching against the current dataset.
  }, [products]);

  // Smooth scroll ref
  const productListRef = useRef(null);
  const isMounted = useRef(false);

  // Smooth scroll effect on page change & URL query sync
  useEffect(() => {
    if (isMounted.current) {
      if (productListRef.current) {
        productListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const params = new URLSearchParams(window.location.search);
      if (currentPage > 1) {
        params.set("page", currentPage.toString());
      } else {
        params.delete("page");
      }
      if (tribe !== "All") {
        params.set("tribe", tribe.toLowerCase());
      } else {
        params.delete("tribe");
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    } else {
      isMounted.current = true;
    }
  }, [currentPage, tribe]);

  // Extract Categories and Tribes dynamically for dropdowns (A–Z, accent-insensitive dedup)
  const categories = useMemo(() => {
    const seen = new Map(); // normalised key → original string
    products.forEach((p) => {
      const key = normalizeStr(p.category);
      if (key && !seen.has(key)) seen.set(key, p.category);
    });
    const unique = [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
    return ["All", ...unique];
  }, [products]);

  const tribes = useMemo(() => {
    if (category === "All") return [];

    const normalizedCategory = normalizeStr(category);
    const seen = new Map();
    products
      .filter((p) => normalizeStr(p.category) === normalizedCategory)
      .forEach((p) => {
        const key = normalizeStr(p.tribe);
        if (key && key !== normalizedCategory && !seen.has(key)) {
          seen.set(key, p.tribe);
        }
      });
    return [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
  }, [products, category]);

  // Filtered Products – accent-insensitive matching, sorted A–Z
  const filteredProducts = useMemo(() => {
    const normSearch  = normalizeStr(search);
    const normCat     = normalizeStr(category);
    const normTribe   = normalizeStr(tribe);

    return products
      .filter((product) => {
        const matchesSearch =
          normalizeStr(product.name).includes(normSearch) ||
          normalizeStr(product.sku).includes(normSearch);
        const matchesCategory =
          category === "All" || normalizeStr(product.category) === normCat;
        const matchesTribe =
          tribe === "All" || normalizeStr(product.tribe) === normTribe;
        return matchesSearch && matchesCategory && matchesTribe;
      })
      .sort((a, b) => normalizeStr(a.name).localeCompare(normalizeStr(b.name)));
  }, [products, search, category, tribe]);

  const { availableAttributes, compoundFilteredProducts } = useMemo(() => {
    const selectedAttributes = Object.fromEntries(
      Object.entries(attributeFilters).filter(([, value]) => value)
    );
    const productHasAttribute = (product, key, value) =>
      (product.attributes || []).some(
        (attribute) =>
          attribute.key === key &&
          (attribute.values || []).some(
            (attributeValue) =>
              normalizeStr(attributeValue) === normalizeStr(value)
          )
      );
    const matchesAttributes = (product, ignoredKey = "") =>
      Object.entries(selectedAttributes).every(
        ([key, value]) =>
          key === ignoredKey || productHasAttribute(product, key, value)
      );
    const attributeDefinitions = new Map();

    products.forEach((product) => {
      (product.attributes || []).forEach((attribute) => {
        if (!attributeDefinitions.has(attribute.key)) {
          attributeDefinitions.set(attribute.key, attribute.name);
        }
      });
    });

    const facets = [...attributeDefinitions.entries()]
      .map(([key, name]) => {
        const counts = new Map();
        filteredProducts
          .filter((product) => matchesAttributes(product, key))
          .forEach((product) => {
            const attribute = (product.attributes || []).find(
              (item) => item.key === key
            );
            const valuesOnProduct = new Map();
            (attribute?.values || []).forEach((value) => {
              const normalizedValue = normalizeStr(value);
              if (normalizedValue && !valuesOnProduct.has(normalizedValue)) {
                valuesOnProduct.set(normalizedValue, value);
              }
            });
            valuesOnProduct.forEach((value, normalizedValue) => {
              const current = counts.get(normalizedValue);
              counts.set(normalizedValue, {
                value: current?.value || value,
                count: (current?.count || 0) + 1,
              });
            });
          });

        return {
          key,
          name,
          options: [...counts.values()].sort((a, b) =>
            normalizeStr(a.value).localeCompare(normalizeStr(b.value))
          ),
        };
      })
      .filter(
        (attribute) =>
          attribute.options.length > 0 || selectedAttributes[attribute.key]
      )
      .sort((a, b) =>
        normalizeStr(a.name).localeCompare(normalizeStr(b.name))
      );

    return {
      availableAttributes: facets,
      compoundFilteredProducts: filteredProducts.filter((product) =>
        matchesAttributes(product)
      ),
    };
  }, [products, filteredProducts, attributeFilters]);


  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return compoundFilteredProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [compoundFilteredProducts, currentPage]);

  const totalPages =
    Math.ceil(compoundFilteredProducts.length / itemsPerPage) || 1;

  const mobilePageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const firstVisiblePage = Math.min(
      Math.max(currentPage - 1, 1),
      totalPages - 2
    );

    return [firstVisiblePage, firstVisiblePage + 1, firstVisiblePage + 2];
  }, [currentPage, totalPages]);

  const desktopPageItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setTribe("All");
    setAttributeFilters({});
    setCurrentPage(1);
  };

  const handlePublicCatalogPdf = async () => {
    if (pdfExporting) return;
    setPdfExporting(true);
    setPdfExportError("");

    try {
      await downloadDigitalCatalogPdf();
    } catch (exportFailure) {
      setPdfExportError(
        exportFailure.message || "The PDF catalog could not be generated."
      );
    } finally {
      setPdfExporting(false);
    }
  };

  // Catalog is partner-only: block until authenticated
  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  return (
    <div id="top" className="site-background-page bg-[#25362D] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {pdfExporting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#242f27]/95 px-5 backdrop-blur-sm xl:hidden"
          role="status"
          aria-live="assertive"
          aria-label="Generating your PDF catalog. Please wait and keep this page open."
        >
          <div className="w-full max-w-xl rounded-xl border border-[#d8c58f]/45 bg-[#303f32] px-6 py-10 text-center shadow-2xl shadow-black/50 sm:px-10 sm:py-14">
            <LoaderCircle
              className="mx-auto h-14 w-14 animate-spin text-[#d8c58f] sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <p className="mt-7 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Generating your PDF catalog...
            </p>
            <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-7 text-white/75 sm:text-lg">
              This may take a moment. Please wait and keep this page open until the PDF is ready.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12">

        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 sm:pb-8 gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#989836]/15 border border-[#989836]/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#d8c58f] uppercase font-label-sm mb-3">
              B2B Portal
            </div>
            <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">
              Wholesale Product Catalog
            </h1>
            <p className="font-body-md text-base text-white/60 max-w-2xl mt-2 leading-relaxed">
              Verify pricing options and add products to your bulk order draft. Submitting the request drafts an order sheet for our verification team.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* Download Catalog PDF Button */}
            <button
              onClick={handlePublicCatalogPdf}
              disabled={pdfExporting}
              className="flex w-full grow items-center justify-center gap-3 rounded-sm border-0 bg-[#cc6632] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#cc6632]/15 transition-all duration-300 hover:bg-[#b6532a] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:grow-0"
            >
              {pdfExporting ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
              ) : (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              )}
              {pdfExporting ? "Generating PDF" : "PDF Catalog"}
            </button>

            {/* Quick Cart Summary Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex w-full grow items-center justify-center gap-3 rounded-sm border border-white/10 bg-[#1a1a1a] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:border-white/20 hover:bg-white/5 sm:w-auto sm:grow-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#d8c58f]" />
              Order Sheet
              {cartTotalItems > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc6632] text-[10px] font-bold text-white absolute -top-2 -right-2 animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {pdfExportError && (
          <div
            className="rounded-sm border border-red-300/25 bg-red-950/45 px-4 py-3 text-sm font-semibold text-red-100"
            role="alert"
          >
            {pdfExportError}
          </div>
        )}

        <FilterSidebar
          filters={{ search, category, tribe, attributes: attributeFilters }}
          categories={categories.slice(1)}
          tribes={tribes}
          attributes={availableAttributes}
          allValue="All"
          onChange={(nextFilters) => {
            setSearch(nextFilters.search);
            setCategory(nextFilters.category);
            setTribe(nextFilters.tribe);
            setAttributeFilters(nextFilters.attributes || {});
            setCurrentPage(1);
          }}
          onClear={handleClearFilters}
          disabled={productsLoading}
        />

        {productsWarning && (
          <div role="status" className="rounded-sm border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-xs text-yellow-200">
            {productsWarning} Products from the available store are shown below.
          </div>
        )}

        {/* Product Card Grid */}
        <div ref={productListRef} className="scroll-mt-28 overflow-hidden rounded-xl border border-white/10 bg-[#131313]/60">
          {/* Product Items */}
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 gap-4">
              <div className="w-10 h-10 border-4 border-[#989836] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
                Loading live catalog…
              </p>
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 gap-4 text-center">
              <PackageOpen className="w-16 h-16 text-white/20" />
              <p className="text-sm text-white/50 font-medium max-w-md">
                {productsError || "We could not load the wholesale catalog right now. Please try again shortly."}
              </p>
              <button
                onClick={reload}
                className="text-xs font-bold text-[#d8c58f] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-2">
              {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="catalog-product-row grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-5 rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg shadow-black/20 transition-[background-color,border-color,box-shadow] hover:border-[#989836]/50 hover:bg-[#1b1b1b] hover:shadow-xl"
                  >
                    {/* Image Column — product thumbnail, tribe-letter fallback */}
                    <div className="col-span-1 flex items-center">
                      <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="block">
                        {product.image ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-[#131313] shadow-md transition-all duration-300 hover:border-[#989836]/45 hover:shadow-lg">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 text-lg font-black uppercase text-white shadow-md transition-all duration-300 hover:border-[#989836]/45 hover:shadow-lg font-mono select-none"
                            style={{ backgroundColor: getEthnicityColor(product.tribe, product.category) }}
                          >
                            <span className="transform hover:scale-110 transition-transform duration-300">
                              {product.tribe ? product.tribe.charAt(0).toUpperCase() : ""}
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Name Column */}
                    <div className="col-span-1 flex min-w-0 flex-col gap-2">
                      <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="hover:text-[#d8c58f] transition-colors text-left no-underline group">
                        <h3 className="catalog-product-title font-headline-md text-lg font-bold text-white group-hover:text-[#d8c58f] transition-colors flex items-center gap-2 flex-wrap">
                          {product.name}
                          {product.isNew && (
                            <span className="inline-block text-[9px] font-black tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm uppercase align-middle">
                              New
                            </span>
                          )}
                        </h3>
                      </Link>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        <span className="max-w-full break-words text-[10px] font-semibold bg-[#989836]/15 text-[#d8c58f] border border-[#989836]/30 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                          {product.category}
                        </span>
                        {product.tribe && (
                          <span className="max-w-full break-words text-[10px] font-semibold bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                            {product.tribe}
                          </span>
                        )}
                        <span className="max-w-full break-words text-[10px] font-semibold text-white/40 px-1 py-0.5 uppercase tracking-wide font-label-sm">
                          {product.storeName}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 border-t border-white/10 pt-4">
                      <ProductPurchaseControls
                        product={product}
                        onAdded={() => setIsCartOpen(true)}
                      />
                    </div>

                  </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
              <PackageOpen className="w-16 h-16 text-white/20" />
              <p className="text-sm text-white/40 font-medium">No wholesale remedies match the current criteria.</p>
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-[#d8c58f] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-hidden border-t border-white/5 px-2 py-8 sm:gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous catalog page"
                className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 sm:hidden">
                {mobilePageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to catalog page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`h-10 w-10 rounded-sm border font-mono text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-[#989836] text-white border-[#989836]"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <div className="hidden max-w-full items-center justify-center gap-2 sm:flex">
                {desktopPageItems.map((item) =>
                  typeof item === "string" ? (
                    <span key={item} aria-hidden="true" className="w-6 text-center text-white/35">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      aria-label={`Go to catalog page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                      className={`h-10 w-10 shrink-0 rounded-sm border font-mono text-xs font-bold transition-all cursor-pointer ${
                        currentPage === item
                          ? "bg-[#989836] text-white border-[#989836]"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next catalog page"
                className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Shared Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
