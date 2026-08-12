"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import ShelfToggleButton from "@/components/ShelfToggleButton";
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
  FileSpreadsheet,
  PackageOpen,
  Upload,
} from "lucide-react";

import { useProducts } from "@/components/ProductsContext";
import { getEthnicityColor } from "@/lib/ethnicity-colors";
import { exportCatalogExcel } from "@/lib/catalog-export";
import { readCatalogOrderWorkbook } from "@/lib/catalog-order-workbook";

// Normalize string for accent-insensitive comparison
// Strips diacritics, lowercases and trims — used ONLY for comparison, never for display
const normalizeStr = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const productHasAttribute = (product, key, value) =>
  (product.attributes || []).some(
    (attribute) =>
      attribute.key === key &&
      (attribute.values || []).some(
        (attributeValue) =>
          normalizeStr(attributeValue) === normalizeStr(value)
      )
  );

const matchesAttributeFilters = (product, filters, ignoredKey = "") =>
  Object.entries(filters || {}).every(
    ([key, value]) =>
      !value ||
      key === ignoredKey ||
      productHasAttribute(product, key, value)
  );

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
  const { setIsCartOpen, addSelectionsToCart, cartSubtotal, cartTotalItems } = useCart();
  const cartTotal =
    cartSubtotal * (1 - Number(user?.discountRate || 0) / 100);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const importInputRef = useRef(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [childCategory, setChildCategory] = useState("All");
  const [attributeFilters, setAttributeFilters] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Read URL query parameters to set initial category, tribe and page filters.
  // Resolve accent-insensitively against actual data so URL params always match.
  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get("category");
      const subcategoryParam = params.get("subcategory") || params.get("tribe");
      if (subcategoryParam) {
        const match = products.find(
          (product) =>
            normalizeStr(product.subcategory || product.tribe) ===
            normalizeStr(subcategoryParam)
        );
        setCategory(match?.category || "All");
        setSubcategory(match?.subcategory || match?.tribe || "All");
      } else if (categoryParam) {
        const match = products.find(
          (product) =>
            normalizeStr(product.category) === normalizeStr(categoryParam)
        );
        setCategory(match?.category || "All");
        setSubcategory("All");
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
      if (category !== "All") {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      if (subcategory !== "All") {
        params.set("subcategory", subcategory.toLowerCase());
        params.delete("tribe");
      } else {
        params.delete("subcategory");
        params.delete("tribe");
      }
      if (childCategory !== "All") {
        params.set("childCategory", childCategory.toLowerCase());
      } else {
        params.delete("childCategory");
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    } else {
      isMounted.current = true;
    }
  }, [category, childCategory, currentPage, subcategory]);

  // Extract Categories and Tribes dynamically for dropdowns (A–Z, accent-insensitive dedup)
  const categories = useMemo(() => {
    const seen = new Map(); // normalised key → original string
    products
      .filter(
        (product) =>
          matchesAttributeFilters(product, attributeFilters) &&
          (subcategory === "All" ||
            normalizeStr(product.subcategory || product.tribe) ===
              normalizeStr(subcategory)) &&
          (childCategory === "All" ||
            normalizeStr(product.childCategory) === normalizeStr(childCategory))
      )
      .forEach((product) => {
        const key = normalizeStr(product.category);
        if (key && !seen.has(key)) seen.set(key, product.category);
      });
    const unique = [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
    return ["All", ...unique];
  }, [attributeFilters, childCategory, products, subcategory]);

  const subcategories = useMemo(() => {
    if (category === "All") return [];

    const normalizedCategory = normalizeStr(category);
    const seen = new Map();
    products
      .filter(
        (product) =>
          normalizeStr(product.category) === normalizedCategory &&
          matchesAttributeFilters(product, attributeFilters) &&
          (childCategory === "All" ||
            normalizeStr(product.childCategory) === normalizeStr(childCategory))
      )
      .forEach((p) => {
        const value = p.subcategory || p.tribe;
        const key = normalizeStr(value);
        if (key && key !== normalizedCategory && !seen.has(key)) {
          seen.set(key, value);
        }
      });
    return [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
  }, [attributeFilters, category, childCategory, products]);

  const childCategories = useMemo(() => {
    if (subcategory === "All") return [];
    const normalizedCategory = normalizeStr(category);
    const normalizedSubcategory = normalizeStr(subcategory);
    const seen = new Map();
    products
      .filter(
        (product) =>
          normalizeStr(product.category) === normalizedCategory &&
          normalizeStr(product.subcategory || product.tribe) === normalizedSubcategory &&
          matchesAttributeFilters(product, attributeFilters)
      )
      .forEach((product) => {
        const value = product.childCategory;
        const key = normalizeStr(value);
        if (key && !seen.has(key)) seen.set(key, value);
      });
    return [...seen.values()].sort((left, right) =>
      normalizeStr(left).localeCompare(normalizeStr(right))
    );
  }, [attributeFilters, category, products, subcategory]);

  // Filtered Products – accent-insensitive matching, sorted A–Z
  const filteredProducts = useMemo(() => {
    const normSearch  = normalizeStr(search);
    const normCat     = normalizeStr(category);
    const normSubcategory = normalizeStr(subcategory);
    const normChildCategory = normalizeStr(childCategory);

    return products
      .filter((product) => {
        const matchesSearch =
          normalizeStr(product.name).includes(normSearch) ||
          normalizeStr(product.sku).includes(normSearch);
        const matchesCategory =
          category === "All" || normalizeStr(product.category) === normCat;
        const matchesSubcategory =
          subcategory === "All" ||
          normalizeStr(product.subcategory || product.tribe) === normSubcategory;
        const matchesChildCategory =
          childCategory === "All" ||
          normalizeStr(product.childCategory) === normChildCategory;
        return matchesSearch && matchesCategory && matchesSubcategory && matchesChildCategory;
      })
      .sort((a, b) => normalizeStr(a.name).localeCompare(normalizeStr(b.name)));
  }, [products, search, category, subcategory, childCategory]);

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
          ["effects", "effect", "plant-part", "plantpart"].includes(
            normalizeStr(attribute.key).replace(/\s+/g, "-")
          ) &&
          (attribute.options.length > 0 || selectedAttributes[attribute.key])
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
    setSubcategory("All");
    setChildCategory("All");
    setAttributeFilters({});
    setCurrentPage(1);
  };

  const exportExcel = async () => {
    setExcelBusy(true);
    try { await exportCatalogExcel({ products: compoundFilteredProducts, user, includeLinks: true }); }
    finally { setExcelBusy(false); }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setExcelBusy(true);
    try {
      const rows = await readCatalogOrderWorkbook(file);
      const selections = rows.flatMap(({ storeId, sku, quantity }) => {
        const product = products.find((item) => String(item.storeId || "maya-herbs") === storeId && item.options?.some((option) => option.sku === sku));
        const optionIndex = product?.options?.findIndex((option) => option.sku === sku) ?? -1;
        return product && optionIndex >= 0 ? [{ product, optionIndex, quantity }] : [];
      });
      if (!selections.length) throw new Error("No current products were found in this workbook.");
      if (window.confirm(`Add ${selections.length} product lines from Excel to the cart?`)) { addSelectionsToCart(selections); setIsCartOpen(true); }
    } catch (error) { window.alert(error.message || "The Excel file could not be imported."); }
    finally { setExcelBusy(false); }
  };

  // Catalog is partner-only: block until authenticated
  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  return (
    <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Container */}
      <main className="site-content-shell flex flex-grow flex-col gap-10 py-10 sm:gap-12 sm:py-12">

        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 sm:pb-8 gap-4 sm:gap-6">
          <div>
            <h1 className="type-page-title font-headline-lg text-white">
              Wholesale Product Catalog
            </h1>
            <p className="font-body-md text-base text-white/60 max-w-2xl mt-2 leading-relaxed">
              Verify pricing options, add products to your cart, and submit the order for review by our wholesale team.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <input ref={importInputRef} type="file" accept=".xlsx" className="sr-only" onChange={importExcel} />
            <button
              type="button"
              disabled={excelBusy}
              onClick={() => importInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-[#999933]/35 bg-[#999933]/10 px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-white no-underline transition-colors hover:border-[#999933]/70 hover:bg-[#999933]/20 sm:w-auto"
            >
              <Upload className={`h-4 w-4 ${excelBusy ? "animate-pulse" : ""}`} aria-hidden="true" />
              Import Excel
            </button>
            <button
              type="button"
              disabled={excelBusy || productsLoading || compoundFilteredProducts.length === 0}
              onClick={exportExcel}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-white no-underline transition-colors hover:border-[#999933]/60 hover:bg-white/10 sm:w-auto"
            >
              <FileSpreadsheet className={`h-4 w-4 ${excelBusy ? "animate-pulse" : ""}`} aria-hidden="true" />
              Export Excel
            </button>
            {/* Quick Cart Summary Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex w-full grow items-center justify-center gap-3 rounded-sm border border-white/10 bg-[#1a1a1a] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:border-white/20 hover:bg-white/5 sm:w-auto sm:grow-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#f2f2f2]" />
              Cart · ${cartTotal.toFixed(2)}
              {cartTotalItems > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc6633] text-[10px] font-bold text-white absolute -top-2 -right-2 animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        <FilterSidebar
          filters={{ search, category, subcategory, childCategory, attributes: attributeFilters }}
          categories={categories.slice(1)}
          subcategories={subcategories}
          childCategories={childCategories}
          attributes={availableAttributes}
          allValue="All"
          onChange={(nextFilters) => {
            const compatibleProducts = products.filter((product) =>
              matchesAttributeFilters(product, nextFilters.attributes || {})
            );
            let nextCategory = nextFilters.category;
            let nextSubcategory = nextFilters.subcategory;
            let nextChildCategory = nextFilters.childCategory;

            if (
              nextCategory !== "All" &&
              !compatibleProducts.some(
                (product) =>
                  normalizeStr(product.category) === normalizeStr(nextCategory)
              )
            ) {
              nextCategory = "All";
              nextSubcategory = "All";
              nextChildCategory = "All";
            }
            if (
              nextSubcategory !== "All" &&
              !compatibleProducts.some(
                (product) =>
                  (nextCategory === "All" ||
                    normalizeStr(product.category) === normalizeStr(nextCategory)) &&
                  normalizeStr(product.subcategory || product.tribe) ===
                    normalizeStr(nextSubcategory)
              )
            ) {
              nextSubcategory = "All";
              nextChildCategory = "All";
            }
            if (
              nextChildCategory !== "All" &&
              !compatibleProducts.some(
                (product) =>
                  (nextCategory === "All" ||
                    normalizeStr(product.category) === normalizeStr(nextCategory)) &&
                  (nextSubcategory === "All" ||
                    normalizeStr(product.subcategory || product.tribe) ===
                      normalizeStr(nextSubcategory)) &&
                  normalizeStr(product.childCategory) ===
                    normalizeStr(nextChildCategory)
              )
            ) {
              nextChildCategory = "All";
            }

            setSearch(nextFilters.search);
            setCategory(nextCategory);
            setSubcategory(nextSubcategory);
            setChildCategory(nextChildCategory);
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
              <div className="w-10 h-10 border-4 border-[#999933] border-t-transparent rounded-full animate-spin"></div>
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
                className="text-xs font-bold text-[#f2f2f2] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-2">
              {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="catalog-product-row grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-5 rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg shadow-black/20 transition-[background-color,border-color,box-shadow] hover:border-[#999933]/50 hover:bg-[#1b1b1b] hover:shadow-xl"
                  >
                    {/* Image Column — product thumbnail, tribe-letter fallback */}
                    <div className="col-span-1 flex items-center">
                      <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="block">
                        {product.image ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-[#131313] shadow-md transition-all duration-300 hover:border-[#999933]/45 hover:shadow-lg">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 text-lg font-black uppercase text-white shadow-md transition-all duration-300 hover:border-[#999933]/45 hover:shadow-lg font-mono select-none"
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
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="min-w-0 hover:text-[#f2f2f2] transition-colors text-left no-underline group">
                          <h3 className="catalog-product-title font-headline-md text-lg font-bold text-white group-hover:text-[#f2f2f2] transition-colors flex items-center gap-2 flex-wrap">
                            {product.name}
                            {product.isNew && (
                              <span className="inline-block text-[9px] font-black tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm uppercase align-middle">
                                New
                              </span>
                            )}
                          </h3>
                        </Link>
                        <ShelfToggleButton productId={product.id} productName={product.name} variant="icon" className="-mt-1 h-9 w-9" />
                      </div>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        <span className="max-w-full break-words text-[10px] font-semibold bg-[#999933]/15 text-[#f2f2f2] border border-[#999933]/30 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
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
                      <ProductPurchaseControls product={product} />
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
                className="text-xs font-bold text-[#f2f2f2] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
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
                        ? "bg-[#999933] text-white border-[#999933]"
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
                          ? "bg-[#999933] text-white border-[#999933]"
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
