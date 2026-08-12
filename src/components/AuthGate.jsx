"use client";

// Full-page lock screen for partner-only routes (catalog, product pages).
// Render it instead of the page content while auth is loading or when the
// visitor is not signed in.

import { useState } from "react";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import LoginModal from "./LoginModal";
import { Lock } from "lucide-react";

export default function AuthGate({ loading = false }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="site-background-page bg-[#131313] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      <main className="site-content-shell flex flex-grow items-center justify-center py-16 sm:py-20 lg:py-24">
        {loading ? (
          <div className="w-10 h-10 border-4 border-[#999933] border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 sm:p-8 lg:p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl animate-fade-in">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#999933]/10 pointer-events-none rounded-full"></div>

            <div className="w-16 h-16 rounded-full bg-[#999933]/15 border border-[#999933]/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-7 h-7 text-[#f2f2f2]" />
            </div>

            <h1 className="type-promo-title font-headline-lg text-white mb-3">
              Wholesale Access Only
            </h1>
            <p className="font-body-md text-sm text-white/60 leading-relaxed mb-8 max-w-sm mx-auto">
              The product catalog and wholesale pricing are visible to approved
              partners only. Sign in to your B2B account, or apply for a
              wholesale partnership.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-sm transition-all duration-300 cursor-pointer border-0 w-full flex items-center justify-center gap-2 shadow-lg shadow-[#cc6633]/15"
              >
                Sign In to Your Account
              </button>
              <Link
                href="/register"
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-sm transition-all duration-300 w-full no-underline flex items-center justify-center"
              >
                Apply for Wholesale Access
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
