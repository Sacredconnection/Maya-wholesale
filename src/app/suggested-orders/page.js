"use client";

import { useState } from "react";
import AuthGate from "@/components/AuthGate";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import SuggestedOrders from "@/components/SuggestedOrders";
import { useAuth } from "@/components/AuthContext";

export default function SuggestedOrdersPage() {
  const { isLoggedIn, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  if (loading || !isLoggedIn) return <AuthGate loading={loading} />;

  return (
    <div className="site-background-page flex min-h-screen flex-col bg-[#25362D] text-[#e5e2e1]">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d8c58f]">
            Stock-aware assortments
          </span>
          <h1 className="mt-3 font-headline-lg text-3xl font-black tracking-tight text-white sm:text-4xl">
            Suggested wholesale orders
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
            Explore curated order templates and a smart restock based on your
            purchase history. Every selectable list is rebuilt against current
            inventory before it reaches your cart.
          </p>
        </header>
        <SuggestedOrders />
      </main>
      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
