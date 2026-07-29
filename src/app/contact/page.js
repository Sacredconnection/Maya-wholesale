"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Check,
  Loader2,
  ArrowRight,
  Clock
} from "lucide-react";

export default function ContactPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    const normalizedForm = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    if (Object.values(normalizedForm).some((value) => !value)) {
      setError("Please complete all fields before opening your email application.");
      setSuccess(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedForm.email)) {
      setError("Please enter a valid business email address.");
      setSuccess(false);
      return;
    }

    setLoading(true);
    setError("");

    const subject = encodeURIComponent(`[B2B Support] ${normalizedForm.subject.slice(0, 120)}`);
    const body = encodeURIComponent(
      `Name: ${normalizedForm.name}\nEmail: ${normalizedForm.email}\n\n${normalizedForm.message}`
    );
    try {
      window.location.assign(`mailto:info@mayaherbs.com?subject=${subject}&body=${body}`);
      setSuccess(true);
    } catch {
      setError("Your email application could not be opened. Please email info@mayaherbs.com directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="top" className="site-background-page bg-[#25362D] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12">
        {/* Page Title */}
        <div className="border-b border-white/10 pb-6 sm:pb-8">
          <span className="inline-flex items-center gap-2 bg-[#989836]/15 border border-[#989836]/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#d8c58f] uppercase font-label-sm mb-3">
            Get In Touch
          </span>
          <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">
            B2B Support &amp; Contact
          </h1>
          <p className="font-body-md text-base text-white/60 max-w-2xl mt-2 leading-relaxed">
            Have questions about our catalog, order volumes, availability or
            international shipping? Our Haarlem team is here to help.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-12 items-start">

          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7 bg-[#1a1a1a] border border-white/10 rounded-xl p-5 sm:p-6 lg:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#989836]/5 blur-2xl pointer-events-none rounded-full"></div>

            <h2 className="font-headline-md text-2xl font-bold text-white mb-6">
              Send a Message
            </h2>

            {success && (
              <div role="status" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded mb-6 flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Email prepared successfully.</p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">Review and send it from your email application to contact our wholesale support team.</p>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="mb-6 rounded border border-[#ffb4ab]/20 bg-[#93000a]/15 p-4 text-sm text-[#ffb4ab]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} aria-busy={loading} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-[10px] font-mono uppercase text-white/55 font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    maxLength={160}
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="Your name"
                    className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#989836] outline-none transition-colors"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[10px] font-mono uppercase text-white/55 font-semibold">
                    Business Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    maxLength={254}
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="name@company.com"
                    className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#989836] outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-[10px] font-mono uppercase text-white/55 font-semibold">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  maxLength={120}
                  value={form.subject}
                  onChange={handleChange("subject")}
                  placeholder="How can we help you?"
                  className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#989836] outline-none transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-[10px] font-mono uppercase text-white/55 font-semibold">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  maxLength={2000}
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="Tell us about your store, volume requirements, or inquiry..."
                  rows="5"
                  className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#989836] outline-none transition-colors resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#cc6632] hover:bg-[#b6532a] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all border-0 shadow-lg shadow-[#cc6632]/15 hover:shadow-[#cc6632]/30 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Email App...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Open Email App
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Contact Cards & Info */}
          <div className="lg:col-span-5 flex flex-col gap-6 w-full">

            {/* Contact Details Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 sm:p-6 lg:p-8 shadow-xl flex flex-col gap-5 sm:gap-6">
              <h3 className="font-headline-md text-lg font-bold text-white border-b border-white/5 pb-3">
                Corporate Details
              </h3>

              <div className="flex flex-col gap-5">
                {/* Email */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded bg-[#989836]/10 border border-[#989836]/20 flex items-center justify-center text-[#d8c58f] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wide">Email</span>
                    <p className="mt-0.5">
                      <a href="mailto:info@mayaherbs.com" className="break-all text-sm font-bold text-white no-underline transition-colors hover:text-[#d8c58f] font-mono">
                        info@mayaherbs.com
                      </a>
                    </p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded bg-[#989836]/10 border border-[#989836]/20 flex items-center justify-center text-[#d8c58f] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wide">Phone</span>
                    <p className="mt-0.5">
                      <a href="tel:+31235325192" className="text-white hover:text-[#d8c58f] transition-colors text-sm font-bold no-underline font-mono">
                        +31 23 532 5192
                      </a>
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded bg-[#989836]/10 border border-[#989836]/20 flex items-center justify-center text-[#d8c58f] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wide">Headquarters</span>
                    <address className="not-italic text-sm font-body-md text-white/70 mt-1 leading-relaxed">
                      <p>Mollerusweg 66</p>
                      <p>2031 BZ Haarlem</p>
                      <p>The Netherlands</p>
                    </address>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 sm:p-6 lg:p-8 shadow-xl flex flex-col gap-4">
              <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d8c58f]" />
                Support Hours
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Our support desk assists partners with product questions,
                account access, fulfillment and international wholesale orders:
              </p>
              <div className="h-px bg-white/5 my-1"></div>
              <div className="flex flex-col gap-1 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between font-mono">
                <span>Monday – Friday</span>
                <span className="text-white">9:00 AM – 5:00 PM CET</span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between font-mono">
                <span>Saturday – Sunday</span>
                <span className="text-[#d8c58f] font-bold">Closed</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
