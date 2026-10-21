"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState("all");
  const [generated, setGenerated] = useState(false);
  const stepTitle = useRef(null);
  const changeStep = (next) => { setStep(next); setGenerated(false); };
  useEffect(() => { stepTitle.current?.focus({ preventScroll: true }); }, [step]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
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
  const subcategories = useMemo(() => [...new Set(products.filter(p => p.category === category).map(p => p.subcategory).filter(Boolean))].sort(compareCategories), [products, category]);
  const filtered = useMemo(() => products.filter(p => (!category || p.category === category) && (!subcategory || p.subcategory === subcategory) && (p.name + " " + p.sku).toLowerCase().includes(search.toLowerCase())), [products, category, subcategory, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const toggleProduct = (id) => setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  const toggleCategory = (name, subcategory = "") => {
    const ids = products.filter(p => p.category === name && (!subcategory || p.subcategory === subcategory)).map(p => p.id);
    setSelectedIds(current => ids.every(id => current.includes(id)) ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };
  const generate = async () => {
    setGenerating(true); setError(""); setGenerated(false);
    try { await downloadDigitalCatalogPdf({ selectedIds: scope === "all" ? [] : selectedIds, format, includePrices: true, user, filterLabel: scope === "custom" && selectedIds.length ? "Personalized catalog" : "Complete catalog" }); setGenerated(true); }
    catch (failure) { setError(failure.message || "The PDF could not be generated."); }
    finally { setGenerating(false); }
  };
  if (authLoading || !isLoggedIn) return <AuthGate loading={authLoading} />;
  const allProducts = scope === "all" || selectedIds.length === 0;
  const count = allProducts ? products.length : selectedIds.length;
  const primary = "catalog-primary-action inline-flex min-h-12 items-center justify-center gap-2 rounded bg-[#984C27] px-6 py-3 font-bold hover:bg-[#7D3E20] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#707026] disabled:opacity-50";
  const secondary = "inline-flex min-h-12 items-center justify-center rounded border border-[#999A61] bg-white px-5 py-3 font-semibold text-[#4C4C31] hover:bg-[#999933]/10 disabled:opacity-50";
  const choice = (active) => "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-5 transition-colors " + (active ? "border-[#707026] bg-[#999933]/10" : "border-[#999A61]/30 bg-white hover:border-[#707026]");
  return <div id="top" className="site-background-page flex min-h-screen flex-col text-[#262019]">
    <Header />
    <main className="site-content-shell flex-grow space-y-7 py-8 sm:py-12">
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#707026]">Your wholesale collection</p>
        <h1 className="type-page-title">Create your catalog</h1>
        <p className="leading-7 text-[#574B39]">Build a PDF to save, share or print. Choose a format, decide what to include, then download.</p>
      </header>
      <nav aria-label="Catalog creation steps" className="rounded-lg border border-[#999A61]/40 bg-white">
        <ol className="grid grid-cols-3">{["Format", "Products", "Review & download"].map((label, index) => <li key={label} className="min-w-0"><button type="button" disabled={generating || index + 1 > step} onClick={() => changeStep(index + 1)} aria-current={step === index + 1 ? "step" : undefined} className={"flex h-full w-full flex-col items-start gap-2 border-b-4 px-3 py-4 text-left text-sm sm:flex-row sm:items-center sm:gap-3 sm:px-6 " + (step === index + 1 ? "border-[#984C27] font-bold text-[#262019]" : "border-transparent text-[#574B39]")}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#999A61] text-xs">{index + 1}</span>{label}</button></li>)}</ol>
      </nav>
      {loading && <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-lg border border-[#999A61]/50 bg-white p-5 text-[#4C4C31]"><LoaderCircle className="mt-0.5 h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /><div><p className="font-bold">Loading products and prices...</p><p className="mt-1 text-sm leading-6">This may take a moment. You can choose your format and catalog type now. Product selection and review will be available when loading finishes.</p></div></div>}
      {error && <div role="alert" className="rounded border border-[#D9962B] bg-white p-4 text-[#6F4C16]">{error} {products.length === 0 && <button onClick={() => setRetry(retry + 1)} className="ml-3 underline">Try again</button>}</div>}
      <section aria-labelledby="catalog-step-title" className="space-y-6 rounded-xl border border-[#999A61]/40 bg-white p-5 sm:p-8">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#707026]">Step {step} of 3</p><h2 id="catalog-step-title" ref={stepTitle} tabIndex={-1} className="text-2xl font-bold outline-none">{step === 1 ? "Choose your format" : step === 2 ? "What would you like to include?" : "Your catalog is ready to generate"}</h2></div>
        {step === 1 && <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Catalog format</legend>{[["detailed", "Detailed catalog", "Product photos and descriptions, with available sizes and price ranges."], ["compact", "Compact price list", "A concise list of SKUs, product names, sizes and price ranges. No photos or descriptions."]].map(([value, title, description]) => <label key={value} className={choice(format === value)}><input type="radio" name="catalog-format" checked={format === value} onChange={() => setFormat(value)} className="mt-1 h-4 w-4 shrink-0 accent-[#707026]" /><span><strong className="block text-lg">{title}</strong><span className="mt-2 block text-sm leading-6 text-[#574B39]">{description}</span></span></label>)}</fieldset>}
        {step === 2 && <>
          <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Products to include</legend>{[["all", "Complete catalog", "Include all available products. No selection needed."], ["custom", "Choose products", "Select categories, subcategories or individual products."]].map(([value, title, description]) => <label key={value} className={choice(scope === value)}><input type="radio" name="catalog-scope" checked={scope === value} onChange={() => setScope(value)} className="mt-1 h-4 w-4 shrink-0 accent-[#707026]" /><span><strong className="block">{title}</strong><span className="mt-1 block text-sm leading-6 text-[#574B39]">{description}</span></span></label>)}</fieldset>
          {loading ? <div aria-busy="true" className="rounded-lg bg-[#999933]/10 p-5 text-sm text-[#4C4C31]">{scope === "custom" ? "Your product list is loading. Categories, search and product checkboxes will appear here shortly." : "We are loading the full catalog. The product count will appear here when it is ready."}</div> : scope === "all" ? <p className="rounded-lg bg-[#999933]/10 p-5 text-[#4C4C31]">All {products.length} products will be included, organized by category and subcategory.</p> : <div className="space-y-6">
            <fieldset className="space-y-3"><legend className="mb-2 font-bold">Select categories or subcategories</legend><p className="text-sm text-[#574B39]">Tick a category to include all its products, or expand it to choose specific subcategories.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.map(name => {
              const items = products.filter(p => p.category === name);
              const selected = items.filter(p => selectedIds.includes(p.id)).length;
              const children = [...new Set(items.map(p => p.subcategory).filter(Boolean))].sort(compareCategories);
              return <div key={name} className="self-start rounded border border-[#999A61]/50 p-3"><label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={selected === items.length} ref={el => { if (el) el.indeterminate = selected > 0 && selected < items.length; }} onChange={() => toggleCategory(name)} className="h-4 w-4 accent-[#707026]" />{categoryLabel(name)} <span className="font-normal text-[#574B39]">({selected}/{items.length})</span></label>
                {children.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-sm text-[#574B39]">Subcategories of {categoryLabel(name)} ({children.length})</summary><div className="mt-3 space-y-3 border-l border-[#999A61]/40 pl-3">{children.map(child => { const subset = items.filter(p => p.subcategory === child); const count = subset.filter(p => selectedIds.includes(p.id)).length; return <label key={child} className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" checked={count === subset.length} ref={el => { if (el) el.indeterminate = count > 0 && count < subset.length; }} onChange={() => toggleCategory(name, child)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#707026]" /><span>{categoryLabel(child)} <span className="text-[#574B39]">({count}/{subset.length})</span></span></label>; })}</div></details>}
              </div>;
            })}</div></fieldset>
            <div className="space-y-4 border-t border-[#999A61]/30 pt-5"><div><h3 className="font-bold">Select individual products</h3><p className="mt-1 text-sm leading-6 text-[#574B39]">Search or filter the list, then tick Include on the products you want. Searching does not change your selection.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><label className="flex min-w-0 flex-col gap-2 text-sm">Search by name or SKU<input type="search" placeholder="Type a product name or SKU" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="min-w-0 rounded border border-[#999A61]/50 bg-white p-3" /></label><label className="flex flex-col gap-2 text-sm">Filter by category<select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); setPage(1); }} className="rounded border border-[#999A61]/50 bg-white p-3"><option value="">All categories</option>{categories.map(name => <option key={name} value={name}>{categoryLabel(name)}</option>)}</select></label><label className="flex min-w-0 flex-col gap-2 text-sm">Filter by subcategory<select value={subcategory} disabled={!category || !subcategories.length} onChange={e => { setSubcategory(e.target.value); setPage(1); }} className="min-w-0 rounded border border-[#999A61]/50 bg-white p-3 disabled:opacity-50"><option value="">{category ? "All subcategories" : "Choose a category first"}</option>{subcategories.map(name => <option key={name} value={name}>{categoryLabel(name)}</option>)}</select></label><label className="flex flex-col gap-2 text-sm">Products per page<select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded border border-[#999A61]/50 bg-white p-3">{[10,20,50,100].map(size => <option key={size}>{size}</option>)}</select></label></div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p aria-live="polite">{filtered.length} results · {selectedIds.length} selected</p><button type="button" disabled={!selectedIds.length} onClick={() => setSelectedIds([])} className="text-[#574B39] underline disabled:opacity-40">Clear selection</button></div>
              <section aria-label="Choose catalog products" className="space-y-4">{visible.length ? visible.map(product => <ProductCard key={product.id} product={product} user={user} isLoggedIn mode="select" selected={selectedIds.includes(product.id)} onSelect={() => toggleProduct(product.id)} />) : <p className="py-6 text-[#574B39]">No products match. Try another name or clear the category filter.</p>}</section>
              {pages > 1 && <nav aria-label="Catalog selection pages" className="flex flex-wrap items-center justify-center gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)} className={secondary}>Previous</button><span className="text-sm">Page {page} of {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} className={secondary}>Next</button></nav>}
            </div>
          </div>}
        </>}
        {step === 3 && <>
          <dl className="grid gap-6 rounded-lg bg-[#999933]/10 p-5 sm:grid-cols-3"><div><dt className="text-sm text-[#574B39]">Format</dt><dd className="mt-2 font-bold">{format === "detailed" ? "Detailed catalog" : "Compact price list"}</dd></div><div><dt className="text-sm text-[#574B39]">Products included</dt><dd className="mt-2 font-bold">{count} products · {allProducts ? "Complete catalog" : "Custom selection"}</dd></div><div><dt className="text-sm text-[#574B39]">Download</dt><dd className="mt-2 font-bold">PDF · Prices in EUR</dd></div></dl>
          {scope === "custom" && !selectedIds.length && <p className="text-sm text-[#6F4C16]">You have not selected any products, so your PDF will include the complete catalog. Go back to choose specific products.</p>}
          {!allProducts && <details className="rounded border border-[#999A61]/40 p-4"><summary className="cursor-pointer font-semibold">Review selected products ({count})</summary><ul className="mt-4 space-y-2 text-sm text-[#574B39]">{products.filter(p => selectedIds.includes(p.id)).map(p => <li key={p.id}>{p.name}</li>)}</ul></details>}
          <p className="text-sm leading-6 text-[#574B39]">Available sizes and price ranges follow the online catalog. Final quantities, shipping and applicable taxes are confirmed on your invoice.</p>
          {generated && <p role="status" className="rounded bg-[#999933]/10 p-4 font-semibold text-[#4C4C31]">Your PDF has opened in a new tab. Use the PDF viewer to save or print it.</p>}
          {generating && <p role="status">Preparing your PDF. Please keep this page open.</p>}
        </>}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-4 border-t border-[#999A61]/30 bg-white py-4">
          {step > 1 ? <button type="button" onClick={() => changeStep(step - 1)} disabled={generating} className={secondary}>Back</button> : <span className="text-sm text-[#574B39]">You can change these choices before downloading.</span>}
          {step < 3 ? <button type="button" onClick={() => changeStep(step + 1)} disabled={step === 2 && (loading || !products.length)} className={primary}>{step === 2 && loading && <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}{step === 1 ? "Continue to products" : loading ? "Loading products..." : "Review catalog"}</button> : <button type="button" onClick={generate} disabled={loading || generating || !products.length} className={primary}>{generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{generating ? "Generating catalog..." : "Generate catalog"}</button>}
        </div>
      </section>
    </main><Footer />
  </div>;
}
