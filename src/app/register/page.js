"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { COUNTRIES } from "@/lib/countries";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronLeft
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    vatNumber: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    state: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setForm((prev) => ({ ...prev, country }));
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (
      !form.email.trim() ||
      form.email.trim().length > 60 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      return "A valid email address with no more than 60 characters is required.";
    }
    if (!form.vatNumber.trim()) return "VAT Number is required.";
    if (!form.address.trim()) return "Address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state.trim()) return "State / Province is required.";
    if (!form.zip.trim()) return "Postcode / ZIP is required.";
    if (!form.country) return "Please select your Country.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        vatNumber: form.vatNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        country: form.country
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-background-page min-h-screen bg-[#0f0f0f] text-[#f2f2f2] flex flex-col antialiased">
      {/* Top Header */}
      <div className="theme-dark-zone w-full border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-[#131313] z-10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Herbs Wholesale"
            width={494}
            height={201}
            unoptimized
            className="h-14 w-auto opacity-90 transition-opacity hover:opacity-100"
          />
        </Link>
        <Link href="/" className="text-xs font-mono text-[#f2f2f2] hover:text-white transition-colors flex items-center gap-1 font-bold">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex items-center justify-center py-8 sm:py-10 lg:py-12 px-4 sm:px-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#999933]/5 blur-3xl pointer-events-none rounded-full" />

        <div className="w-full max-w-md z-10">
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              aria-busy={submitting}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 sm:p-8 shadow-2xl flex flex-col gap-5 sm:gap-6"
            >

              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#f2f2f2] uppercase block mb-1">
                  B2B Partner Portal
                </span>
                <h1 className="type-promo-title text-white font-headline-lg">
                  Wholesale Registration
                </h1>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Submit your details below to create your wholesale B2B account.
                </p>
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-3 rounded-sm animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-name" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Name
                  </label>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={160}
                    value={form.name}
                    onChange={set("name")}
                    placeholder="e.g. John Doe"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-email" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Email
                  </label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={60}
                    value={form.email}
                    onChange={set("email")}
                    placeholder="name@company.com"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* VAT Number */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-vat-number" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    VAT Number
                  </label>
                  <input
                    id="register-vat-number"
                    name="vat-number"
                    type="text"
                    autoComplete="off"
                    maxLength={64}
                    value={form.vatNumber}
                    onChange={set("vatNumber")}
                    placeholder="e.g. NL123456789B01"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-address" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Address
                  </label>
                  <input
                    id="register-address"
                    name="address"
                    type="text"
                    autoComplete="address-line1"
                    maxLength={160}
                    value={form.address}
                    onChange={set("address")}
                    placeholder="1234 Main St"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-city" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    City
                  </label>
                  <input
                    id="register-city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    maxLength={100}
                    value={form.city}
                    onChange={set("city")}
                    placeholder="New York"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* State / Province */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-state" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    State / Province
                  </label>
                  <input
                    id="register-state"
                    name="state"
                    type="text"
                    autoComplete="address-level1"
                    maxLength={100}
                    value={form.state}
                    onChange={set("state")}
                    placeholder="North Holland"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Postcode / ZIP */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-postal-code" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Postcode / ZIP
                  </label>
                  <input
                    id="register-postal-code"
                    name="postal-code"
                    type="text"
                    autoComplete="postal-code"
                    maxLength={24}
                    value={form.zip}
                    onChange={set("zip")}
                    placeholder="2031 BZ"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors w-full"
                    required
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="registration-country" className="text-[10px] font-mono uppercase text-white/60 tracking-wider font-label-sm">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      id="registration-country"
                      name="country"
                      autoComplete="country"
                      value={form.country}
                      onChange={handleCountryChange}
                      className="w-full appearance-none rounded-sm border border-white/10 bg-[#131313] px-4 py-3 pr-11 text-sm text-white outline-none transition-colors focus:border-[#999933] cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select a country</option>
                      {COUNTRIES.map(({ code, name }) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" aria-hidden="true" />
                  </div>
                </div>

              </div>

              <div className="text-center text-[11px] text-white/40 mt-1 font-body-md">
                Registration confirmation and account access instructions will be emailed to you.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-lg shadow-[#cc6633]/15 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </form>
          ) : (
            /* Success Screen */
            <div role="status" className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 sm:p-10 flex flex-col items-center text-center gap-5 sm:gap-6 shadow-2xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#999933]/10 border border-[#999933]/20 flex items-center justify-center text-[#f2f2f2]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-headline-md text-2xl font-bold text-white mb-2">
                  Registration Submitted!
                </h3>
                <p className="text-sm text-white/60 font-body-md max-w-sm mx-auto leading-relaxed">
                  Your wholesale account has been created and is <strong className="text-white">pending
                  approval by the administration</strong>.
                </p>
                <p className="text-xs text-white/40 font-body-md max-w-sm mx-auto leading-relaxed mt-2">
                  Our team will review your business profile and assign your wholesale
                  access level. You will be able to sign in once your account is approved.
                </p>
              </div>

              <div className="bg-[#131313] border border-white/5 rounded-lg p-4 w-full flex flex-col gap-2 font-mono text-left max-w-sm">
                <div className="flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
                  <span className="text-white/40">NAME:</span>
                  <span className="break-all text-[#f2f2f2] font-bold sm:text-right">{form.name}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
                  <span className="text-white/40">EMAIL:</span>
                  <span className="break-all text-white font-bold sm:text-right">{form.email}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
                  <span className="text-white/40">STATUS:</span>
                  <span className="text-yellow-400 font-bold uppercase sm:text-right">PENDING APPROVAL</span>
                </div>
              </div>

              <Link
                href="/"
                className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all border-0 cursor-pointer w-full max-w-sm shadow-md text-center no-underline"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
