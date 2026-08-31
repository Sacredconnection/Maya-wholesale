"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import BankTransferDetails from "@/components/BankTransferDetails";
import { Check, ClipboardList } from "lucide-react";

function OrderReceivedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("number");
  const orderSummary = searchParams.get("orders");
  const total = searchParams.get("total");

  return (
    <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col items-center text-center gap-10 sm:gap-12">
      <div className="w-20 h-20 rounded-full bg-[#999933]/20 border border-[#999933]/45 flex items-center justify-center animate-fade-in">
        <Check className="w-10 h-10 text-[#f2f2f2]" />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="type-page-title font-headline-lg text-white">
          Order Received
        </h1>
        {(orderSummary || orderNumber) && (
          <p className="text-sm font-mono text-white/50">
            {orderSummary ? "Orders: " : "Order number: "}
            <span className="text-[#f2f2f2] font-bold">
              {orderSummary || `#${orderNumber}`}
            </span>
            {total && (
              <>
                {" "}· Est. total:{" "}
                <span className="text-white font-bold">€{Number(total).toFixed(2)}</span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-xl border border-[#999933]/35 bg-[#1a1a1a] p-5 text-left sm:p-8">
        <BankTransferDetails orderReference={orderSummary || (orderNumber ? `#${orderNumber}` : "")} />
        {(orderSummary || orderNumber) && (
          <div className="rounded-lg border border-[#999933]/35 bg-[#999933]/10 px-4 py-3 text-xs leading-relaxed text-white/70">
            Payment reference:{" "}
            <strong className="font-mono text-white">
              {orderSummary || `#${orderNumber}`}
            </strong>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/my-account"
          className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 no-underline"
        >
          <ClipboardList className="w-4 h-4" />
          View My Orders
        </Link>
        <Link
          href="/catalog"
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 no-underline"
        >
          Continue Browsing
        </Link>
      </div>
    </main>
  );
}

export default function OrderReceivedPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <Suspense fallback={<main className="flex-grow" />}>
        <OrderReceivedContent />
      </Suspense>
      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
