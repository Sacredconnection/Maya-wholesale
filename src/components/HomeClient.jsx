"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import BotanicalCategories from '@/components/BotanicalCategories';
import Onboarding from '@/components/Onboarding';
import NGOSection from '@/components/NGOSection';
import RetailRedirectSection from '@/components/RetailRedirectSection';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';

export default function HomeClient({ categories = [] }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
        <div className="home-content-shell flex flex-col gap-12 lg:gap-16">
          {/* B2B Onboarding Steps */}
          <Onboarding />
          <section className="rounded-lg border border-[#999933]/30 bg-[#999933]/5 p-6">
            <h2 className="text-xl font-bold">A catalog tailored to your business</h2>
            <p className="mt-2 text-sm leading-6">Registered clients can sign in to choose individual products or entire categories and create a personalized PDF catalog to save, share or print.</p>
          </section>

          {/* Maya's core wholesale ranges */}
          <BotanicalCategories categories={categories} />

        </div>

        {/* Secondary path for individual retail customers */}
        <RetailRedirectSection />

        <div className="home-content-shell">
          {/* NGO Partnership Details */}
          <NGOSection />
        </div>
      </main>

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
