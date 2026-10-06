"use client";
import { useEffect, useMemo, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthGate from "@/components/AuthGate";
import ProductCard from "@/components/catalog/ProductCard";
import { useAuth } from "@/components/AuthContext";
import { downloadDigitalCatalogPdf } from "@/lib/catalog-export";
import { categoryLabel, compareCategories, compareCatalogProducts } from "@/lib/catalog-organization.mjs";

export default function CreateCatalogPage() {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [format, setFormat] = useState("detailed");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);
  useEffect(() => {
    if (authLoading || !isLoggedIn) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/catalog?export=true", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The catalog could not be loaded.");
        setProducts((data.products || []).sort(compareCatalogProducts));
      } catch (failure) { if (!controller.signal.aborted) setError(failure.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [authLoading, isLoggedIn, retry]);
  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(compareCategories), [products]);
  const filtered = useMemo(() => products.filter(p => (!category || p.category === category) && (p.name + " " + p.sku).toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const toggleProduct = (id) => setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const toggleCategory = (name) => {
    const ids = products.filter(p => p.category === name).map(p => p.id);
    setSelectedIds(current => ids.every(id => current.includes(id)) ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };
  const generate = async () => {
    setGenerating(true); setError("");
    try { await downloadDigitalCatalogPdf({ selectedIds, format, includePrices: true, user, filterLabel: selectedIds.length ? "Personalized catalog" : "Complete catalog" }); }
    catch (failure) { setError(failure.message || "The PDF could not be generated."); }
    finally { setGenerating(false); }
  };
  if (authLoading || !isLoggedIn) return <AuthGate loading={authLoading} />;
  return <div id="top" className="site-background-page flex min-h-screen flex-col bg-[#1a1a1a] text-white">
    <Header />
    <main className="site-content-shell flex-grow space-y-8 py-10">
      <section className="space-y-4 rounded-xl border border-[#999933]/40 bg-[#1a1a1a] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#707026]">Create Catalog</p>
        <h1 className="type-page-title">Create your own catalog</h1>
        <p className="max-w-3xl leading-7 text-white/75">Choose individual products or entire categories to create a catalog tailored to your needs. Download a PDF to save, share or print.</p>
        <p className="max-w-3xl leading-7 text-white/75">Choose a format, select what you would like to include, then click Generate catalog. With no selection, the complete catalog will be generated. Products are organized by category and subcategory. Filters help you find products; only the Include checkboxes change your selection.</p>
        <fieldset className="grid gap-4 pt-3 sm:grid-cols-2"><legend className="mb-3 font-bold">Catalog format</legend>
          {[ ["detailed", "Detailed catalog", "Product photos, descriptions, available sizes and price ranges."], ["compact", "Compact price list", "SKU, product name, available sizes and price ranges. No photos or descriptions."] ].map(([value, title, description]) => <label key={value} className="flex items-start gap-3 rounded-lg border border-white/20 p-4"><input type="radio" name="catalog-format" value={value} checked={format === value} onChange={() => setFormat(value)} className="mt-1 accent-[#999933]" /><span><strong className="block">{title}</strong><span className="mt-1 block text-sm text-white/70">{description}</span></span></label>)}
        </fieldset>
        <p className="text-xs text-white/60">Prices are in EUR. Account and volume pricing follow the online catalog; final quantities, shipping and applicable taxes are confirmed on your invoice.</p>
      </section>
      {error && <div role="alert" className="rounded border border-[#D9962B] p-4">{error} {products.length === 0 && <button onClick={() => setRetry(retry + 1)} className="ml-3 underline">Try again</button>}</div>}
      <fieldset disabled={loading || generating} className="rounded-lg border border-white/15 p-5"><legend className="px-2 font-bold">Include entire categories</legend><div className="flex flex-wrap gap-5">{categories.map(name => <label key={name} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={products.filter(p => p.category === name).every(p => selectedIds.includes(p.id))} onChange={() => toggleCategory(name)} className="h-4 w-4 accent-[#999933]" />{categoryLabel(name)}</label>)}</div><p className="mt-4 text-xs text-white/60">Sacred Snuff is our own Hapé brand.</p></fieldset>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-52 flex-1 flex-col gap-2 text-sm">Find products<input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="rounded border border-[#999933]/40 bg-[#f0ecdf] p-3" /></label>
        <label className="flex flex-col gap-2 text-sm">Category<select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="rounded border border-[#999933]/40 bg-[#f0ecdf] p-3"><option value="">All categories</option>{categories.map(name => <option key={name} value={name}>{categoryLabel(name)}</option>)}</select></label>
        <label className="flex flex-col gap-2 text-sm">Products per page<select aria-label="Products per page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded border border-[#999933]/40 bg-[#f0ecdf] p-3">{[10,20,50,100].map(size => <option key={size}>{size}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#999933]/40 p-5"><p aria-live="polite">{selectedIds.length ? selectedIds.length + (selectedIds.length === 1 ? " product selected" : " products selected") : "No selection — generate the complete catalog"}</p><div className="flex flex-wrap gap-4"><button type="button" onClick={() => setSelectedIds([])} disabled={!selectedIds.length || generating} className="text-sm underline disabled:opacity-40">Clear selection</button><button type="button" onClick={generate} disabled={loading || generating || !products.length} className="catalog-primary-action inline-flex items-center gap-2 rounded bg-[#984C27] px-5 py-3 font-bold text-white hover:bg-[#7D3E20] disabled:opacity-50">{generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{generating ? "Generating catalog…" : "Generate catalog"}</button></div></div>
      {generating && <p role="status">Preparing your PDF. Please keep this page open.</p>}
      <section aria-label="Choose catalog products" aria-busy={loading} className="space-y-5">{loading ? <p role="status">Loading products and available sizes…</p> : visible.length ? visible.map(product => <ProductCard key={product.id} product={product} user={user} isLoggedIn mode="select" selected={selectedIds.includes(product.id)} onSelect={() => toggleProduct(product.id)} />) : <p>No products match your search.</p>}</section>
      {pages > 1 && <nav aria-label="Catalog selection pages" className="flex items-center justify-center gap-5"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded border p-3 disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded border p-3 disabled:opacity-40">Next</button></nav>}
    </main><Footer />
  </div>;
}
