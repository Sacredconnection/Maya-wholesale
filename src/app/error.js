"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#25362D] px-6 py-16 text-white">
      <section className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#121615] px-6 py-14 text-center shadow-2xl sm:px-12">
        <AlertTriangle aria-hidden="true" className="mx-auto mb-6 h-10 w-10 text-[#d8c58f]" />
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#d8c58f]">
          Temporary issue
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#D1D9D5]">
          We could not load this page right now. Please try again or return to
          the homepage.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#989836] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#319786] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c58f]"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/20 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c58f]"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
