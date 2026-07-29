"use client";

/* eslint-disable @next/next/no-img-element -- Cart images use WooCommerce runtime URLs. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Loader2,
  MapPin,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductRecommendations from "@/components/ProductRecommendations";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { COUNTRIES } from "@/lib/countries";
import { MIN_ORDER_GRAMS } from "@/lib/pricing";

const EMPTY_ADDRESS = {
  street: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

const STEPS = [
  { label: "Contact", icon: UserRound },
  { label: "Delivery", icon: MapPin },
  { label: "Review", icon: ClipboardCheck },
];

const addressLine = (address) =>
  [
    address.street,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(", "),
    address.zip,
    COUNTRIES.find((country) => country.code === address.country)?.name || address.country,
  ]
    .filter(Boolean)
    .join(" · ");

function Field({ id, label, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-white/55">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-sm border border-white/10 bg-[#131313] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#f2f2f2] disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
    </div>
  );
}

function AddressFields({ prefix, value, onChange }) {
  const set = (field) => (event) => onChange({ ...value, [field]: event.target.value });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        id={`${prefix}-street`}
        label="Address line 1"
        name={`${prefix}-street`}
        autoComplete={`${prefix} address-line1`}
        maxLength={160}
        value={value.street}
        onChange={set("street")}
        placeholder="Street and number"
        className="sm:col-span-2"
        required
      />
      <Field
        id={`${prefix}-neighborhood`}
        label="Address line 2 (optional)"
        name={`${prefix}-neighborhood`}
        autoComplete={`${prefix} address-line2`}
        maxLength={160}
        value={value.neighborhood}
        onChange={set("neighborhood")}
        placeholder="Suite, unit, neighborhood"
        className="sm:col-span-2"
      />
      <Field
        id={`${prefix}-city`}
        label="City"
        name={`${prefix}-city`}
        autoComplete={`${prefix} address-level2`}
        maxLength={100}
        value={value.city}
        onChange={set("city")}
        required
      />
      <Field
        id={`${prefix}-state`}
        label="State / Region"
        name={`${prefix}-state`}
        autoComplete={`${prefix} address-level1`}
        maxLength={100}
        value={value.state}
        onChange={set("state")}
      />
      <Field
        id={`${prefix}-zip`}
        label="Postcode / ZIP"
        name={`${prefix}-zip`}
        autoComplete={`${prefix} postal-code`}
        maxLength={24}
        value={value.zip}
        onChange={set("zip")}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${prefix}-country`} className="text-[10px] font-bold uppercase tracking-wider text-white/55">
          Country / Region
        </label>
        <div className="relative">
          <select
            id={`${prefix}-country`}
            name={`${prefix}-country`}
            autoComplete={`${prefix} country`}
            value={value.country}
            onChange={set("country")}
            className="w-full appearance-none rounded-sm border border-white/10 bg-[#131313] px-4 py-3 pr-10 text-sm text-white outline-none transition-colors focus:border-[#f2f2f2]"
            required
          >
            <option value="" disabled>Select a country</option>
            {COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, user, loading } = useAuth();
  const {
    cart,
    clearCart,
    removeItemsByStore,
    cartSubtotal,
    cartTotalItems,
    cartTotalWeightGrams,
  } = useCart();
  const initializedForUser = useRef(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
  });
  const [shippingAddress, setShippingAddress] = useState(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState(EMPTY_ADDRESS);
  const [billingMatchesShipping, setBillingMatchesShipping] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || initializedForUser.current === user.email) return;
    initializedForUser.current = user.email;
    setContact({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      company: user.company || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setShippingAddress({ ...EMPTY_ADDRESS, ...(user.shippingAddress || {}) });
    setBillingAddress({ ...EMPTY_ADDRESS, ...(user.billingAddress || {}) });
  }, [user]);

  if (loading || !isLoggedIn || !user) return <AuthGate loading={loading} />;

  const discountPercentage = user.discountRate || 0;
  const discountAmount = cartSubtotal * (discountPercentage / 100);
  const finalTotal = cartSubtotal - discountAmount;
  const meetsMinimumWeight = cartTotalWeightGrams >= MIN_ORDER_GRAMS;
  const effectiveBillingAddress = billingMatchesShipping ? shippingAddress : billingAddress;

  const validateAddress = (address) =>
    Boolean(address.street.trim() && address.city.trim() && address.zip.trim() && address.country);

  const goForward = () => {
    setError("");
    if (step === 0 && (!contact.firstName.trim() || !contact.lastName.trim() || !contact.phone.trim())) {
      setError("Enter the contact name and phone number to continue.");
      return;
    }
    if (step === 1) {
      if (!validateAddress(shippingAddress)) {
        setError("Complete the required delivery address fields to continue.");
        return;
      }
      if (!billingMatchesShipping && !validateAddress(billingAddress)) {
        setError("Complete the required billing address fields to continue.");
        return;
      }
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitOrder = async () => {
    if (isSubmitting) return;
    if (!confirmed) {
      setError("Confirm that the order details are correct before placing the order.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ sku, quantity, wcProductId, wcVariationId, storeId }) => ({
            sku,
            storeId,
            quantity,
            wcProductId,
            wcVariationId,
          })),
          checkout: {
            firstName: contact.firstName.trim(),
            lastName: contact.lastName.trim(),
            company: contact.company.trim(),
            phone: contact.phone.trim(),
            shippingAddress,
            billingAddress: effectiveBillingAddress,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Order submission failed. Please try again.");
      }

      const completedStoreIds = (data.orders || []).map((order) => order.storeId);
      if (data.failures?.length) {
        removeItemsByStore(completedStoreIds);
        throw new Error(
          `Orders were created for ${data.orders.map((order) => order.storeName).join(", ")}, but failed for ${data.failures.map((failure) => failure.storeName).join(", ")}. The remaining items are still in your cart.`
        );
      }

      clearCart();
      const orderSummary = data.orders
        .map((order) => `${order.storeName} #${order.number}`)
        .join(" · ");
      const orderTotal = data.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      router.push(
        `/order-received?orders=${encodeURIComponent(orderSummary)}&total=${encodeURIComponent(orderTotal.toFixed(2))}`
      );
    } catch (submissionError) {
      setError(submissionError.message || "Order submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setContactField = (field) => (event) => {
    setContact((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  return (
    <div id="top" className="site-background-page min-h-screen bg-[#25362D] text-[#f2f2f2]">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-7">
          <Link href="/catalog" className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#f2f2f2] transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Return to catalog
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2f2f2]">
              Secure wholesale request
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Checkout
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              Confirm your details and review the order before sending it to our wholesale team.
              No payment is collected online.
            </p>
          </div>
        </div>

        <ol aria-label="Checkout progress" className="mb-8 grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-[#171717]">
          {STEPS.map(({ label, icon: Icon }, index) => {
            const complete = index < step;
            const active = index === step;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={`relative flex min-w-0 items-center justify-center gap-2 border-r border-white/10 px-2 py-4 last:border-r-0 sm:gap-3 sm:px-5 ${
                  active ? "bg-[#999933]/20 text-white" : complete ? "text-[#f2f2f2]" : "text-white/35"
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active || complete ? "border-[#f2f2f2]/50 bg-[#999933]/20" : "border-white/15"}`}>
                  {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="truncate text-[10px] font-bold uppercase tracking-wider sm:text-xs">
                  <span className="hidden sm:inline">{index + 1}. </span>{label}
                </span>
                {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#f2f2f2]" />}
              </li>
            );
          })}
        </ol>

        {cart.length === 0 ? (
          <section className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-white/10 bg-[#1a1a1a] px-6 py-14 text-center shadow-2xl">
            <ShoppingBag className="h-12 w-12 text-white/25" />
            <h2 className="mt-5 text-xl font-bold text-white">Your order sheet is empty</h2>
            <p className="mt-2 text-sm text-white/50">Add products from the wholesale catalog before starting checkout.</p>
            <Link href="/catalog" className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#cc6633] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white">
              Browse catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl sm:p-7 lg:p-8">
              {error && (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-sm border border-[#ffb4ab]/25 bg-[#93000a]/20 px-4 py-3 text-xs leading-relaxed text-[#ffb4ab]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Contact information</h2>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      We will use these details to confirm availability, freight, and payment.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="checkout-first-name" label="First name" autoComplete="given-name" maxLength={80} value={contact.firstName} onChange={setContactField("firstName")} required />
                    <Field id="checkout-last-name" label="Last name" autoComplete="family-name" maxLength={80} value={contact.lastName} onChange={setContactField("lastName")} required />
                    <Field id="checkout-company" label="Company (optional)" autoComplete="organization" maxLength={160} value={contact.company} onChange={setContactField("company")} />
                    <Field id="checkout-phone" label="Phone number" type="tel" autoComplete="tel" maxLength={40} value={contact.phone} onChange={setContactField("phone")} required />
                    <Field id="checkout-email" label="Account email" type="email" autoComplete="email" value={contact.email} disabled className="sm:col-span-2" />
                  </div>
                  <div className="flex items-start gap-3 rounded-sm border border-[#999933]/25 bg-[#999933]/10 p-4">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#f2f2f2]" />
                    <p className="text-xs leading-relaxed text-white/60">
                      Your account email identifies the approved wholesale buyer and cannot be changed during checkout.
                    </p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-7">
                  <div>
                    <h2 className="text-xl font-bold text-white">Delivery address</h2>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Shipping is calculated after the request is reviewed by our team.
                    </p>
                  </div>
                  <AddressFields prefix="shipping" value={shippingAddress} onChange={setShippingAddress} />
                  <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-white/10 bg-[#131313] p-4">
                    <input
                      type="checkbox"
                      checked={billingMatchesShipping}
                      onChange={(event) => setBillingMatchesShipping(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#999933]"
                    />
                    <span>
                      <span className="block text-sm font-bold text-white">Billing address is the same as delivery</span>
                      <span className="mt-1 block text-xs text-white/45">Uncheck to provide a separate billing address.</span>
                    </span>
                  </label>
                  {!billingMatchesShipping && (
                    <div className="border-t border-white/10 pt-7">
                      <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">Billing address</h3>
                      <AddressFields prefix="billing" value={billingAddress} onChange={setBillingAddress} />
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-7">
                  <div>
                    <h2 className="text-xl font-bold text-white">Review and confirm</h2>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      This is the final step. Your order is created only after you confirm below.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-[#131313] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#f2f2f2]">Contact</h3>
                        <button type="button" onClick={() => setStep(0)} className="border-0 bg-transparent text-[10px] font-bold uppercase text-white/45 hover:text-white">Edit</button>
                      </div>
                      <p className="text-sm font-bold text-white">{contact.firstName} {contact.lastName}</p>
                      {contact.company && <p className="mt-1 text-xs text-white/55">{contact.company}</p>}
                      <p className="mt-1 break-all text-xs text-white/55">{contact.email}</p>
                      <p className="mt-1 text-xs text-white/55">{contact.phone}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#131313] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#f2f2f2]">Delivery</h3>
                        <button type="button" onClick={() => setStep(1)} className="border-0 bg-transparent text-[10px] font-bold uppercase text-white/45 hover:text-white">Edit</button>
                      </div>
                      <p className="text-xs leading-relaxed text-white/65">{addressLine(shippingAddress)}</p>
                      {!billingMatchesShipping && <p className="mt-3 border-t border-white/5 pt-3 text-[10px] text-white/40">Separate billing address provided.</p>}
                    </div>
                  </div>

                  <ProductRecommendations
                    eyebrow="Order bump"
                    title="Complete your order"
                    description="Frequently purchased products you can add before confirming the order."
                    variant="checkout"
                    limit={2}
                  />

                  <div className="flex items-start gap-3 rounded-sm border border-[#999933]/30 bg-[#999933]/10 p-4">
                    <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-[#f2f2f2]" />
                    <p className="text-xs leading-relaxed text-white/65">
                      No online payment is taken. Maya Herbs will contact you to confirm stock,
                      calculate shipping, and arrange payment.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-white/10 p-4">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(event) => {
                        setConfirmed(event.target.checked);
                        setError("");
                      }}
                      className="mt-0.5 h-4 w-4 accent-[#999933]"
                    />
                    <span className="text-xs leading-relaxed text-white/65">
                      I confirm that the contact, delivery, and order details are correct and understand
                      that the displayed total excludes shipping and remains subject to final confirmation.
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep((current) => current - 1);
                    }}
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : <span />}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goForward}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-7 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#b6532a]"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitOrder}
                    disabled={isSubmitting || !confirmed || !meetsMinimumWeight}
                    aria-busy={isSubmitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-7 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#b6532a] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isSubmitting ? (
                      <>Placing order <Loader2 className="h-4 w-4 animate-spin" /></>
                    ) : (
                      <>Place wholesale order <PackageCheck className="h-4 w-4" /></>
                    )}
                  </button>
                )}
              </div>
            </section>

            <aside className="rounded-xl border border-white/10 bg-[#171717] shadow-2xl lg:sticky lg:top-28">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <ShoppingBag className="h-4 w-4 text-[#f2f2f2]" />
                <h2 className="text-sm font-bold text-white">Order summary</h2>
                <span className="ml-auto text-xs text-white/45">{cartTotalItems} items</span>
              </div>
              <div className="max-h-72 divide-y divide-white/5 overflow-y-auto px-5">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex gap-3 py-4">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded border border-white/10 bg-white/5">
                      {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{item.name}</p>
                      <p className="mt-1 text-[10px] text-white/40">{item.optionName} · Qty {item.quantity}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-5 text-xs">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-[#f2f2f2]"><span>B2B discount ({discountPercentage}%)</span><span>-${discountAmount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-white/50">
                  <span>Est. weight</span>
                  <span>{cartTotalWeightGrams >= 1000 ? `${(cartTotalWeightGrams / 1000).toFixed(2)} kg` : `${Math.round(cartTotalWeightGrams)} g`}</span>
                </div>
                <div className="flex justify-between text-white/50"><span>Shipping</span><span>Calculated later</span></div>
                <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-4">
                  <span className="font-bold uppercase tracking-wider text-white">Estimated total</span>
                  <span className="text-2xl font-black text-[#f2f2f2]">${finalTotal.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] leading-relaxed text-white/35">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#f2f2f2]" />
                  Final freight and availability are confirmed by our team.
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
