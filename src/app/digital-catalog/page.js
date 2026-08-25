"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  LoaderCircle,
  PackageOpen,
  RefreshCw,
  ShoppingBag,
  Upload,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ProductCard from "@/components/catalog/ProductCard";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import {
  createDigitalCatalogPdfPreview,
  downloadDigitalCatalogPdf,
  exportCatalogExcel,
} from "@/lib/catalog-export";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";
import { readCatalogOrderWorkbook } from "@/lib/catalog-order-workbook";

const EMPTY_FILTERS = {
  search: "",
  category: "",
  subcategory: "",
  childCategory: "",
  attributes: {},
};

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 30,
  totalItems: 0,
  totalPages: 1,
};

function pageList(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    return previous && page - previous > 1 ? ["ellipsis-" + page, page] : [page];
  });
}

function appendAttributeFilters(params, attributes) {
  Object.entries(attributes || {}).forEach(([key, value]) => {
    if (value) params.append("attribute", `${key}:${value}`);
  });
}

export default function CatalogPage() {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { addToCart, addSelectionsToCart, setIsCartOpen, cartSubtotal, cartTotalItems } = useCart();
  const cartTotal =
    cartSubtotal * (1 - Number(user?.discountRate || 0) / 100);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMeta, setPreviewMeta] = useState(null);
  const [importItems, setImportItems] = useState([]);
  const [importError, setImportError] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef(null);
  const resultsRef = useRef(null);
  const hasLoaded = useRef(false);
  const previewDialogRef = useRef(null);
  const previewCloseRef = useRef(null);
  const previewButtonRef = useRef(null);

  useDialogAccessibility(isPreviewOpen, () => setIsPreviewOpen(false), {
    containerRef: previewDialogRef,
    initialFocusRef: previewCloseRef,
    returnFocusRef: previewButtonRef,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (authLoading) return undefined;
    const controller = new AbortController();

    async function loadCatalog() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: String(page) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.category) params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.childCategory) params.set("childCategory", filters.childCategory);
      appendAttributeFilters(params, filters.attributes);
      try {
        let response;
        let data;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          response = await fetch(`/api/catalog?${params.toString()}`, {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          });
          data = await response.json();
          if (response.ok) break;
          if (response.status < 500 || attempt === 2) {
            throw new Error(data.error || "The catalog could not be loaded.");
          }
          await new Promise((resolve) => window.setTimeout(resolve, 650));
        }

        const nextCategories = data.filters?.categories || [];
        const nextSubcategories =
          data.filters?.subcategories || data.filters?.tribes || [];
        const nextChildCategories = data.filters?.childCategories || [];
        setProducts(Array.isArray(data.products) ? data.products : []);
        setCategories(nextCategories);
        setSubcategories(nextSubcategories);
        setChildCategories(nextChildCategories);
        setAttributes(data.filters?.attributes || []);
        setFilters((current) => {
          if (current.category && !nextCategories.includes(current.category)) {
            return {
              ...current,
              category: "",
              subcategory: "",
              childCategory: "",
            };
          }
          if (
            current.subcategory &&
            !nextSubcategories.includes(current.subcategory)
          ) {
            return { ...current, subcategory: "", childCategory: "" };
          }
          if (
            current.childCategory &&
            !nextChildCategories.includes(current.childCategory)
          ) {
            return { ...current, childCategory: "" };
          }
          return current;
        });
        setPagination(data.pagination || EMPTY_PAGINATION);
        if (data.pagination?.page && data.pagination.page !== page) {
          setPage(data.pagination.page);
        }

        if (hasLoaded.current && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        hasLoaded.current = true;
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setProducts([]);
          setError(loadError.message || "The catalog could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    // Deferring one tick prevents React development mode from issuing the
    // complete catalog request twice during its effect safety check.
    const loadTimer = window.setTimeout(loadCatalog, 0);
    return () => {
      window.clearTimeout(loadTimer);
      controller.abort();
    };
  }, [
    page,
    debouncedSearch,
    filters.category,
    filters.subcategory,
    filters.childCategory,
    filters.attributes,
    authLoading,
    isLoggedIn,
    reloadKey,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.subcategory) params.set("subcategory", filters.subcategory);
    if (filters.childCategory) params.set("childCategory", filters.childCategory);
    appendAttributeFilters(params, filters.attributes);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/digital-catalog?${query}` : "/digital-catalog");
  }, [debouncedSearch, filters, page]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const visiblePages = useMemo(
    () => pageList(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );
  const hasActiveExportFilters = Boolean(
    debouncedSearch ||
    filters.category ||
    filters.subcategory ||
    filters.childCategory ||
    Object.values(filters.attributes).some(Boolean)
  );

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  };

  const handleAddToCart = (product, optionIndex) => {
    addToCart(product, optionIndex, 1);
  };

  const loadExportProducts = async () => {
    const params = new URLSearchParams({ export: "true" });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.subcategory) params.set("subcategory", filters.subcategory);
    if (filters.childCategory) params.set("childCategory", filters.childCategory);
    appendAttributeFilters(params, filters.attributes);
    const response = await fetch(`/api/catalog?${params.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The catalog could not be prepared for export.");
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw new Error("There are no products matching the current filters.");
    }
    return data.products;
  };

  const filterLabel = () => {
    if (filters.category) return filters.category;

    const labels = [];
    if (debouncedSearch) labels.push(`Search: ${debouncedSearch}`);
    if (filters.subcategory) labels.push(`Subcategory: ${filters.subcategory}`);
    if (filters.childCategory) {
      labels.push(`Subcategory level 2: ${filters.childCategory}`);
    }
    attributes.forEach((attribute) => {
      const value = filters.attributes[attribute.key];
      if (value) labels.push(`${attribute.name}: ${value}`);
    });
    return labels.length ? labels.join(" | ") : "Complete catalog";
  };

  const currentPdfOptions = () => ({
    search: debouncedSearch,
    category: filters.category,
    tribe: filters.subcategory,
    attributes: filters.attributes,
    filterLabel: filterLabel(),
    includePrices: isLoggedIn,
    user,
  });

  const handlePreviewPdf = async () => {
    setExporting("preview");
    setExportError("");
    try {
      const preview = await createDigitalCatalogPdfPreview(currentPdfOptions());
      const nextUrl = URL.createObjectURL(preview.blob);
      setPreviewUrl(nextUrl);
      setPreviewMeta({
        productCount: preview.productCount,
        generatedAt: preview.generatedAt,
      });
      setIsPreviewOpen(true);
    } catch (previewFailure) {
      setExportError(
        previewFailure.message || "The PDF preview could not be generated."
      );
    } finally {
      setExporting("");
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    setExportError("");
    try {
      if (format === "excel") {
        const exportProducts = await loadExportProducts();
        await exportCatalogExcel({
          products: exportProducts,
          user,
          includeLinks: isLoggedIn,
        });
      } else {
        await downloadDigitalCatalogPdf(currentPdfOptions());
      }
    } catch (exportFailure) {
      setExportError(exportFailure.message || "The export could not be generated.");
    } finally {
      setExporting("");
    }
  };

  const handleWorkbookImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsImporting(true);
    setImportError("");
    try {
      const requestedItems = await readCatalogOrderWorkbook(file);
      const catalog = await loadExportProducts();
      const selections = requestedItems.flatMap(({ storeId, sku, quantity }) => {
        const product = catalog.find((item) => String(item.storeId || "maya-herbs") === storeId && item.options?.some((option) => option.sku === sku));
        const optionIndex = product?.options?.findIndex((option) => option.sku === sku) ?? -1;
        return product && optionIndex >= 0 && product.options[optionIndex].inStock !== false
          ? [{ product, optionIndex, quantity }]
          : [];
      });
      if (!selections.length) throw new Error("None of the spreadsheet products are currently available.");
      setImportItems(selections);
      setIsImportOpen(true);
    } catch (importFailure) {
      setImportError(importFailure.message || "The spreadsheet could not be imported.");
    } finally {
      setIsImporting(false);
    }
  };

  const confirmWorkbookImport = () => {
    addSelectionsToCart(importItems);
    setIsImportOpen(false);
    setImportItems([]);
    setIsCartOpen(true);
  };

  return (
    <div id="top" className="site-background-page flex min-h-screen flex-col bg-[#25362D] text-[#f2f2f2] antialiased">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {(exporting === "pdf" || exporting === "preview") && (
        <div
          className={`brand-contrast-zone fixed inset-0 z-[140] flex items-center justify-center bg-[#242f27]/95 px-5 ${
            exporting === "pdf" ? "xl:hidden" : ""
          }`}
          role="status"
          aria-live="assertive"
          aria-label="Generating your PDF catalog. Please wait and keep this page open."
        >
          <div className="w-full max-w-xl rounded-xl border border-[#f2f2f2]/45 bg-[#303f32] px-6 py-10 text-center shadow-2xl shadow-black/50 sm:px-10 sm:py-14">
            <LoaderCircle
              className="mx-auto h-14 w-14 animate-spin text-[#f2f2f2] sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <p className="mt-7 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              {exporting === "preview"
                ? "Updating your PDF preview..."
                : "Generating your PDF catalog..."}
            </p>
            <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-7 text-white/75 sm:text-lg">
              This may take a moment. Please wait and keep this page open until the PDF is ready.
            </p>
          </div>
        </div>
      )}

      {isPreviewOpen && previewUrl && (
        <div
          className="fixed inset-0 z-[120] bg-[#081d19]/95 p-0 sm:p-4 lg:p-6"
          aria-hidden="false"
        >
          <section
            ref={previewDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-preview-title"
            tabIndex={-1}
            className="mx-auto flex h-full w-full max-w-[96rem] flex-col overflow-hidden border border-white/15 bg-[#111] shadow-2xl shadow-black/60 sm:rounded-xl"
          >
            <header className="flex flex-col gap-3 border-b border-white/10 bg-[#1a1a1a] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <h2
                  id="pdf-preview-title"
                  className="truncate text-base font-black text-white sm:text-lg"
                >
                  PDF Catalog Preview
                </h2>
                <p className="mt-1 text-[11px] text-white/45 sm:text-xs">
                  {previewMeta
                    ? `${previewMeta.productCount} products · Updated ${new Intl.DateTimeFormat(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      ).format(previewMeta.generatedAt)}`
                    : "Current catalog preview"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={handlePreviewPdf}
                  disabled={Boolean(exporting)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-[#999933]/60 bg-[#999933]/20 px-3 text-[10px] font-black uppercase tracking-wider text-[#f2f2f2] transition-colors hover:bg-[#999933]/30 disabled:cursor-wait disabled:opacity-50 sm:px-4 sm:text-xs"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${exporting === "preview" ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  Update
                </button>
                <a
                  href={previewUrl}
                  download="maya-herbs-wholesale-catalog.pdf"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:px-4 sm:text-xs"
                >
                  <Download className="h-4 w-4 text-[#f2f2f2]" aria-hidden="true" />
                  Download
                </a>
                <button
                  ref={previewCloseRef}
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:px-4 sm:text-xs"
                  aria-label="Close PDF preview"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Close
                </button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 bg-[#292929]">
              <iframe
                src={previewUrl}
                title="Generated wholesale catalog PDF preview"
                className="h-full w-full border-0"
              />
              <noscript>
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  Open PDF preview
                </a>
              </noscript>
            </div>
          </section>
        </div>
      )}

      <main className="site-content-shell flex flex-grow flex-col gap-10 py-10 sm:gap-12 sm:py-12">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8">
          <div className="max-w-3xl">
            <h1 className="type-page-title font-headline-lg text-white">
              Wholesale Digital Catalog
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Explore Maya Herbs products, then combine category levels with Effects and Plant Part filters.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-4">
            <section
              className="catalog-export-tip rounded-lg border border-[#f2f2f2]/25 bg-[#242f27]/70 px-4 py-4 shadow-lg shadow-black/10 sm:px-5"
              aria-labelledby="pdf-export-tip-title"
            >
              <div className="flex min-w-0 gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#f2f2f2]" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 id="pdf-export-tip-title" className="text-sm font-black text-white">
                    Customize your PDF catalog
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-white/65">
                    To include every Maya Herbs product, leave the search field empty and clear all filters. To create a personalized catalog, combine any available filters before selecting Generate PDF.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        hasActiveExportFilters
                          ? "bg-[#d99a1b]/15 text-[#ffd27a]"
                          : "bg-[#999933]/25 text-[#f2f2f2]"
                      }`}
                      aria-live="polite"
                    >
                      {hasActiveExportFilters
                        ? `${pagination.totalItems} filtered products`
                        : `Complete catalog: ${pagination.totalItems} products`}
                    </span>
                    {hasActiveExportFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        disabled={loading}
                        className="text-xs font-bold text-[#f2f2f2] transition-colors hover:text-white disabled:cursor-wait disabled:opacity-50"
                      >
                        Clear filters for full catalog
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => handleExport("pdf")}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:border-[#999933]/60 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              >
                {exporting === "pdf" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#f2f2f2]" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4 text-[#f2f2f2]" aria-hidden="true" />
                )}
                {exporting === "pdf" ? "Generating PDF" : "Generate PDF"}
              </button>
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => handleExport("excel")}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:border-[#999933]/60 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              >
                {exporting === "excel" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#f2f2f2]" aria-hidden="true" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-[#f2f2f2]" aria-hidden="true" />
                )}
                {exporting === "excel" ? "Preparing Excel" : "Export Excel"}
              </button>
              <input ref={importInputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleWorkbookImport} className="sr-only" />
              <button
                type="button"
                disabled={isImporting || Boolean(exporting)}
                onClick={() => importInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#999933]/35 bg-[#999933]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:border-[#999933]/70 hover:bg-[#999933]/20 disabled:cursor-wait disabled:opacity-50"
              >
                {isImporting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                {isImporting ? "Checking Excel" : "Import Excel"}
              </button>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-[#1a1a1a] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#999933]/60"
                >
                  <ShoppingBag className="h-4 w-4 text-[#f2f2f2]" aria-hidden="true" />
                  Cart · ${cartTotal.toFixed(2)}
                  {cartTotalItems > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#cc6633] px-1 text-[10px] text-white">
                      {cartTotalItems}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="rounded-sm bg-[#cc6633] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#b6532a]"
                >
                  Client login
                </button>
              )}
            </div>
            {(exportError || importError) && (
              <p className="max-w-lg text-right text-xs leading-5 text-[#ff9b88]" role="alert">
                {exportError || importError}
              </p>
            )}
          </div>
        </header>

        <div className="space-y-10 sm:space-y-12">
          <FilterSidebar
            filters={filters}
            categories={categories}
            subcategories={subcategories}
            childCategories={childCategories}
            attributes={attributes}
            onChange={handleFiltersChange}
            onClear={clearFilters}
            disabled={loading}
          />

          <section ref={resultsRef} aria-busy={loading} className="scroll-mt-28">
            <div className="mb-5 flex min-h-8 items-center justify-between gap-4">
              <p className="text-sm text-white/45" aria-live="polite">
                {loading
                  ? "Updating catalog..."
                  : `${pagination.totalItems} ${pagination.totalItems === 1 ? "product" : "products"}`}
              </p>
              {!isLoggedIn && (
                <p className="hidden text-xs text-white/35 sm:block">
                  Sign in to add products to an order.
                </p>
              )}
            </div>

            {error ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#1a1a1a] px-6 text-center">
                <PackageOpen className="mb-4 h-14 w-14 text-white/20" aria-hidden="true" />
                <h2 className="text-lg font-bold text-white">Catalog unavailable</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/45">{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-5 rounded-sm border border-[#999933]/50 bg-[#999933]/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#f2f2f2]"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-5">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="grid h-[41.5rem] grid-cols-1 items-stretch overflow-hidden rounded-lg border border-white/15 bg-[#1a1a1a] sm:h-[22rem] sm:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:h-[15.75rem]">
                    <div className="m-3 h-56 animate-pulse rounded-lg border border-white/10 bg-white/5 sm:h-auto xl:h-56 xl:self-start" />
                    <div className="space-y-3 p-4 sm:p-5 lg:p-6">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
                      <div className="h-6 w-4/5 animate-pulse rounded bg-white/10" />
                      <div className="h-20 animate-pulse rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="space-y-5">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      user={user}
                      isLoggedIn={isLoggedIn}
                      onAddToCart={handleAddToCart}
                      onRequireLogin={() => setIsLoginOpen(true)}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Catalog pagination">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={pagination.page === 1}
                      aria-label="Previous page"
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {visiblePages.map((item) =>
                      typeof item === "string" ? (
                        <span key={item} className="px-1 text-white/30" aria-hidden="true">...</span>
                      ) : (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setPage(item)}
                          aria-current={pagination.page === item ? "page" : undefined}
                          aria-label={`Go to page ${item}`}
                          className={`h-10 min-w-10 rounded-sm border px-3 text-xs font-bold transition-colors ${
                            pagination.page === item
                              ? "border-[#999933] bg-[#999933] text-white"
                              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.min(pagination.totalPages, current + 1))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      aria-label="Next page"
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#1a1a1a] px-6 text-center">
                <PackageOpen className="mb-4 h-14 w-14 text-white/20" aria-hidden="true" />
                <h2 className="text-lg font-bold text-white">No products found</h2>
                <p className="mt-2 text-sm text-white/45">Try adjusting or clearing the current filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 text-xs font-bold uppercase tracking-wider text-[#f2f2f2]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      {isImportOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="excel-import-title">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#999933]/35 bg-[#1a1a1a] shadow-2xl">
            <div className="border-b border-white/10 p-6 sm:p-8">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c58f]">Excel order · review</span>
              <h2 id="excel-import-title" className="mt-2 font-headline-lg text-2xl font-black text-white sm:text-3xl">Confirm products before adding them</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">The spreadsheet was matched against the live Maya catalog. Check these current products and quantities before they enter your cart.</p>
            </div>
            <div className="max-h-[48vh] overflow-y-auto p-5 sm:p-6">
              <div className="divide-y divide-white/10 rounded-lg border border-white/10">
                {importItems.map(({ product, optionIndex, quantity }) => <div key={`${product.id}:${product.options[optionIndex].sku}`} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{product.name}</p><p className="mt-1 text-xs text-white/50">{product.options[optionIndex].name} · SKU {product.options[optionIndex].sku}</p></div><span className="shrink-0 rounded-full border border-[#999933]/35 bg-[#999933]/10 px-3 py-1 text-xs font-black text-[#f2f2f2]">× {quantity}</span></div>)}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-5 sm:flex-row sm:justify-end sm:p-6"><button type="button" onClick={() => setIsImportOpen(false)} className="rounded-sm border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-wider text-white/75 hover:bg-white/5">Cancel</button><button type="button" onClick={confirmWorkbookImport} className="rounded-sm bg-[#cc6633] px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#b6532a]">Add {importItems.length} {importItems.length === 1 ? "item" : "items"} to cart</button></div>
          </div>
        </div>
      )}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
