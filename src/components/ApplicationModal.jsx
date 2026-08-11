"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useDialogAccessibility } from '@/lib/use-dialog-accessibility';

export default function ApplicationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    taxId: '',
    email: '',
    phone: '',
    volume: 'medium',
    resaleIntent: 'retail',
    agreeEthical: false
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef(null);
  const fullNameInputRef = useRef(null);
  const submitTimerRef = useRef(null);

  useEffect(() => () => {
    if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.fullName.trim()) tempErrors.fullName = 'Full Name is required';
    if (!formData.businessName.trim()) tempErrors.businessName = 'Business Name is required';
    if (!formData.taxId.trim()) tempErrors.taxId = 'Business License/Tax ID is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) tempErrors.phone = 'Phone number is required';
    if (!formData.agreeEthical) tempErrors.agreeEthical = 'You must agree to represent product origins responsibly';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);

    // Brief client-side validation transition; no application is sent here.
    submitTimerRef.current = window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      submitTimerRef.current = null;
    }, 600);
  };

  const handleClose = () => {
    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    setSubmitting(false);
    setSubmitted(false);
    setFormData({
      fullName: '',
      businessName: '',
      taxId: '',
      email: '',
      phone: '',
      volume: 'medium',
      resaleIntent: 'retail',
      agreeEthical: false
    });
    setErrors({});
    onClose();
  };

  useDialogAccessibility(isOpen, handleClose, {
    containerRef: dialogRef,
    initialFocusRef: fullNameInputRef,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0c0c0c]/85 z-[60] flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-title"
        tabIndex={-1}
        className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-xl w-full shadow-2xl relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close wholesale application dialog"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white/70 hover:text-white flex items-center justify-center font-bold border border-white/10 hover:border-white/30 transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            aria-busy={submitting}
            className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-6"
          >

            {/* Header */}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#f2f2f2] uppercase flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" />
                Step 1 of 3: Vetting Application
              </span>
              <h3 id="application-title" className="font-headline-md text-2xl font-bold text-white">
                Apply for Wholesale Account
              </h3>
              <p className="text-sm text-white/50 font-body-md mt-1">
                Fill in the commercial details below. Applications are reviewed within 48 hours for ethical alignment.
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="application-full-name" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Authorized Contact Name
                </label>
                <input
                  ref={fullNameInputRef}
                  id="application-full-name"
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  maxLength={160}
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
                {errors.fullName && <span role="alert" className="text-xs text-[#ffb4ab]">{errors.fullName}</span>}
              </div>

              {/* Business Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="application-business-name" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Registered Business Name
                </label>
                <input
                  id="application-business-name"
                  type="text"
                  name="businessName"
                  autoComplete="organization"
                  maxLength={120}
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Forest Botanicals Ltd."
                  className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
                {errors.businessName && <span role="alert" className="text-xs text-[#ffb4ab]">{errors.businessName}</span>}
              </div>

              {/* Tax ID */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="application-tax-id" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                  Business License / Tax ID
                </label>
                <input
                  id="application-tax-id"
                  type="text"
                  name="taxId"
                  maxLength={80}
                  required
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="e.g. EIN-12-3456789"
                  className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                />
                {errors.taxId && <span role="alert" className="text-xs text-[#ffb4ab]">{errors.taxId}</span>}
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="application-email" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Work Email
                  </label>
                  <input
                    id="application-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                  />
                  {errors.email && <span role="alert" className="text-xs text-[#ffb4ab]">{errors.email}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="application-phone" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Phone Number
                  </label>
                  <input
                    id="application-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    maxLength={40}
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                  />
                  {errors.phone && <span role="alert" className="text-xs text-[#ffb4ab]">{errors.phone}</span>}
                </div>
              </div>

              {/* volume & intent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="application-volume" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Est. Monthly Ordering Volume
                  </label>
                  <select
                    id="application-volume"
                    name="volume"
                    value={formData.volume}
                    onChange={handleChange}
                    className="bg-[#131313] border border-[#3e4946] focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors appearance-none"
                  >
                    <option value="low">Under $1,000 / month</option>
                    <option value="medium">$1,000 - $5,000 / month</option>
                    <option value="high">$5,000 - $20,000 / month</option>
                    <option value="bulk">Over $20,000 / month</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="application-channel" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                    Resale Channel
                  </label>
                  <select
                    id="application-channel"
                    name="resaleIntent"
                    value={formData.resaleIntent}
                    onChange={handleChange}
                    className="bg-[#131313] border border-[#3e4946] focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors appearance-none"
                  >
                    <option value="retail">Physical Botanical/Wellness Shop</option>
                    <option value="online">Online E-Commerce store</option>
                    <option value="holistic">Holistic Practice / Therapist</option>
                    <option value="distribution">Regional Distribution</option>
                  </select>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 mt-2">
                <input
                  type="checkbox"
                  name="agreeEthical"
                  id="agreeEthical"
                  checked={formData.agreeEthical}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded text-[#999933] focus:ring-[#999933] bg-[#131313] border-white/10"
                />
                <label htmlFor="agreeEthical" className="text-xs text-white/70 leading-relaxed font-body-md cursor-pointer select-none">
                  I agree to represent the origin of these botanical blends responsibly and support the direct profit-sharing program for producer communities.
                </label>
              </div>
              {errors.agreeEthical && <span role="alert" className="text-xs text-[#ffb4ab]">{errors.agreeEthical}</span>}

            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4 pt-4 border-t border-white/5 sm:justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-sm transition-all border border-white/10 hover:border-white/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-lg shadow-[#cc6633]/15 hover:shadow-[#cc6633]/30 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Details...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Validate Application Details
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Success Screen */
          <div role="status" className="p-6 sm:p-10 flex flex-col items-center text-center gap-5 sm:gap-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#999933]/10 border border-[#999933]/20 flex items-center justify-center text-[#f2f2f2]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-2">
                Application Details Ready
              </h3>
              <p className="text-sm text-white/50 font-body-md max-w-sm mx-auto leading-relaxed">
                Your details were validated locally and have not been sent to an administrator. Continue to the secure registration page when you are ready.
              </p>
            </div>

            <div className="bg-[#131313] border border-white/5 rounded-sm p-4 w-full flex flex-col gap-2 font-mono text-left max-w-sm">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">FORM CHECK:</span>
                <span className="text-[#f2f2f2] font-bold">LOCAL VALIDATION</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">STATUS:</span>
                <span className="text-white font-bold uppercase">READY TO REGISTER</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">CONTACT EMAIL:</span>
                <span className="text-white">{formData.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase">
              <ShieldCheck className="w-4 h-4 text-[#f2f2f2]" />
              No administrative changes were made
            </div>

            <Link
              href="/register"
              onClick={handleClose}
              className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-sm transition-all border-0 cursor-pointer w-full max-w-sm shadow-md"
            >
              Continue to Secure Registration
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
