"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import BotanicalCategories from '@/components/BotanicalCategories';
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
    <div id="top" className="site-background-page home-no-glass bg-white text-[#2D2D2D] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Hero Visual Section */}
      <Hero />

      {/* Trust & Verification Bar */}
      <TrustBar />

      {/* Main Page Area */}
      <main className="flex w-full flex-grow flex-col gap-12 bg-white pb-12 lg:gap-16 lg:pb-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:gap-16 lg:px-8">
          {!authLoading && isLoggedIn && <SuggestedOrdersPreview />}
          {/* B2B Onboarding Steps */}
          <Onboarding />

          {/* Maya's core wholesale ranges */}
          <BotanicalCategories categories={categories} />

        </div>

        {/* Secondary path for individual retail customers */}
        <RetailRedirectSection />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
