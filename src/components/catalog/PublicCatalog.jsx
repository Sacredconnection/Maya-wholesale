"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductCard from "@/components/catalog/ProductCard";
import { categoryLabel } from "@/lib/catalog-organization.mjs";
export default function PublicCatalog() {
  const [loginOpen,setLoginOpen]=useState(false);
  const [data,setData]=useState({products:[],filters:{categories:[]},pagination:{totalPages:1}});
  const [category,setCategory]=useState("");
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(20);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);setError("");
      try {
        const params=new URLSearchParams({q:search,category,page:String(page),pageSize:String(pageSize)});
        const response=await fetch("/api/catalog?"+params,{signal:controller.signal});
        const result=await response.json();
        if(!response.ok)throw Error(result.error || "Could not load catalog.");
        setData(result);
      }catch(failure){if(!controller.signal.aborted)setError(failure.message);}
      finally{if(!controller.signal.aborted)setLoading(false);}
    },250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[search,category,page,pageSize]);
  return <div className="site-background-page min-h-screen bg-[#1a1a1a] text-white"><Header onOpenLogin={()=>setLoginOpen(true)} /><main className="site-content-shell space-y-8 py-10"><section><h1 className="type-page-title">Explore our wholesale catalog</h1><p className="mt-4 max-w-3xl leading-7 text-white/75">Browse the Maya Herbs collection. Approved clients can sign in to see wholesale prices, place orders and create personalized PDF catalogs.</p></section><div className="flex flex-wrap gap-4"><label className="flex flex-1 flex-col gap-2">Search<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="rounded border border-[#999933]/40 bg-[#f0ecdf] p-3" /></label><label className="flex flex-col gap-2">Category<select value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}} className="rounded border border-[#999933]/40 bg-[#f0ecdf] p-3"><option value="">All categories</option>{data.filters.categories.map(name=><option key={name} value={name}>{categoryLabel(name)}</option>)}</select></label><label className="flex flex-col gap-2">Products per page<select aria-label="Products per page" value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} className="rounded border border-[#999933]/40 bg-[#f0ecdf] p-3">{[10,20,50,100].map(size=><option key={size}>{size}</option>)}</select></label></div>{error&&<p role="alert">{error}</p>}<section aria-busy={loading} className="space-y-5">{loading?<p role="status">Loading catalog…</p>:data.products.map(product=><ProductCard key={product.id} product={product} mode="browse" />)}</section>{data.pagination.totalPages>1&&<nav aria-label="Catalog pages" className="flex items-center justify-center gap-5"><button disabled={page===1} onClick={()=>setPage(page-1)} className="rounded border p-3 disabled:opacity-40">Previous</button><span>Page {page} of {data.pagination.totalPages}</span><button disabled={page>=data.pagination.totalPages} onClick={()=>setPage(page+1)} className="rounded border p-3 disabled:opacity-40">Next</button></nav>}</main><Footer /><LoginModal isOpen={loginOpen} onClose={()=>setLoginOpen(false)} /></div>;
}
