"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import BotanicalCategories from '@/components/BotanicalCategories';
import LineageShowcase from '@/components/LineageShowcase';
import Onboarding from '@/components/Onboarding';
import NGOSection from '@/components/NGOSection';
import RetailRedirectSection from '@/components/RetailRedirectSection';
import MayaWholesaleBanner from '@/components/MayaWholesaleBanner';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import SuggestedOrdersPreview from '@/components/SuggestedOrdersPreview';
import { useAuth } from '@/components/AuthContext';

export default function HomeClient({ categories = [] }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isLoggedIn, loading: authLoading } = useAuth();

  return (
    <div id="top" className="site-background-page maya-home-pattern home-no-glass bg-[#171714] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Hero Visual Section */}
      <Hero />

      {/* Trust & Verification Bar */}
      <TrustBar />

      {/* Main Page Area */}
      <main className="flex-grow w-full bg-[#25362D] pb-12 sm:pb-14 lg:pb-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-10 pt-10 sm:gap-12 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8">
          {!authLoading && isLoggedIn && <SuggestedOrdersPreview />}

          {/* B2B Onboarding Steps */}
          <Onboarding />

          {/* Maya's core wholesale ranges */}
          <BotanicalCategories categories={categories} />

          {/* Rapéh producer lineage details */}
          <LineageShowcase />
        </div>

        {/* Secondary path for individual retail customers */}
        <RetailRedirectSection />

        <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          {/* NGO Partnership Details */}
          <NGOSection />
        </div>
      </main>

      {/* Wholesale conversion banner */}
      <MayaWholesaleBanner />

      {/* Footer Details */}
      <Footer />

      {/* Client Dashboard / Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
