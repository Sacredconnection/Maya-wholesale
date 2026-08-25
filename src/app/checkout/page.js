"use client";

/* eslint-disable @next/next/no-img-element -- Cart images use WooCommerce runtime URLs. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  LockKeyhole,
  Loader2,
  MessageCircleMore,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import CheckoutHeader from "@/components/CheckoutHeader";
import AuthGate from "@/components/AuthGate";
import BankTransferDetails from "@/components/BankTransferDetails";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { COUNTRIES } from "@/lib/countries";
import {
  BUNQ_CARD_PAYMENT,
  MANUAL_BANK_TRANSFER,
} from "@/lib/payment-methods";
import styles from "./checkout.module.css";

const EMPTY_ADDRESS = {
  street: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

const STEPS = ["Contact", "Delivery", "Review"];
const BUNQ_CARD_PAYMENT_VISIBLE = false;
const ORDER_SUBMISSION_STAGES = [
  {
    title: "Securing your order request",
    detail: "Protecting this submission against duplicates.",
  },
  {
    title: "Validating customer and delivery",
    detail: "Confirming your wholesale account and delivery details.",
  },
  {
    title: "Checking products and quantities",
    detail: "Verifying live availability and wholesale pricing.",
  },
  {
    title: "Registering your order",
    detail: "Saving your request securely in our order system.",
  },
  {
    title: "Preparing the next step",
    detail: "Finalizing confirmation and secure payment details.",
  },
];
const ORDER_STAGE_DELAYS = [900, 2_400, 4_800, 8_000];
const ORDER_STAGE_PROGRESS = [18, 38, 60, 82, 92];

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
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-white/60">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-sm border border-[#727349] bg-[#262019] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/60 focus:border-[#E5E791] focus:ring-2 focus:ring-[#E5E791]/25 disabled:cursor-not-allowed disabled:border-[#727349] disabled:bg-[#362E24] disabled:text-[#BFC079]"
        {...props}
      />
    </div>
  );
}

function OrderStageIllustration({ stage }) {
  if (stage === 1) {
    return (
      <div className="order-visual-card" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="order-visual-check-row"
            style={{ animationDelay: `${row * 280}ms` }}
          >
            <span><Check className="h-2.5 w-2.5" /></span>
            <i className={row === 1 ? "w-7" : "w-10"} />
          </div>
        ))}
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="order-visual-package" aria-hidden="true">
        <span className="order-visual-package-lid" />
        <span className="order-visual-package-body">
          <i />
          <Check className="h-4 w-4" />
        </span>
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div className="order-visual-register" aria-hidden="true">
        <span className="order-visual-register-sheet"><i /><i /><i /></span>
        <span className="order-visual-register-stamp">
          <Check className="h-4 w-4" />
        </span>
      </div>
    );
  }

  if (stage === 4) {
    return (
      <div className="order-visual-waiting" aria-hidden="true">
        <span /><span /><span />
      </div>
    );
  }

  return (
    <div className="order-visual-secure" aria-hidden="true">
      <span />
      <LockKeyhole className="relative h-7 w-7 text-[#f2f2f2]" />
    </div>
  );
}

function OrderSubmissionOverlay({ stage }) {
  const activeStage =
    ORDER_SUBMISSION_STAGES[stage] || ORDER_SUBMISSION_STAGES.at(-1);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#111812]/92 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-progress-title"
      aria-describedby="order-progress-description"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#f2f2f2]/25 bg-[#171a18] shadow-2xl shadow-black/60">
        <div className="relative overflow-hidden border-b border-white/10 bg-[#242f27] px-6 py-7 text-center sm:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_top,#999933_0,transparent_62%)]" />
          <div className="relative mx-auto mb-4 grid h-20 w-24 place-items-center">
            <OrderStageIllustration stage={stage} />
          </div>
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f2f2f2]">
              Order confirmation in progress
            </p>
            <h2 id="order-progress-title" className="mt-2 text-2xl font-black text-white">
              {activeStage.title}
            </h2>
            <p
              id="order-progress-description"
              className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60"
            >
              {activeStage.detail}
            </p>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Order confirmation progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={ORDER_STAGE_PROGRESS[stage]}
          >
            <div
              className="h-full rounded-full bg-[#f2f2f2] transition-[width] duration-700 ease-out"
              style={{ width: `${ORDER_STAGE_PROGRESS[stage]}%` }}
            />
          </div>

          <p className="sr-only" aria-live="polite">
            {activeStage.title}. {activeStage.detail}
          </p>

          <ol className="mt-6 space-y-1">
            {ORDER_SUBMISSION_STAGES.map((item, index) => {
              const complete = index < stage;
              const active = index === stage;
              return (
                <li
                  key={item.title}
                  className={`flex gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    active ? "bg-[#999933]/12" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                      complete
                        ? "border-[#f2f2f2] bg-[#999933] text-white"
                        : active
                          ? "border-[#f2f2f2]/60 text-[#f2f2f2]"
                          : "border-white/15 text-white/25"
                    }`}
                  >
                    {complete ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : active ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${active || complete ? "text-white" : "text-white/30"}`}>
                      {item.title}
                    </p>
                    {active && (
                      <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.025] px-4 py-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#f2f2f2]" />
            <p className="text-[11px] leading-relaxed text-white/45">
              Keep this page open and avoid submitting again. No payment is being collected.
            </p>
          </div>
        </div>
      </div>
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
        <label htmlFor={`${prefix}-country`} className="text-[10px] font-bold uppercase tracking-wider text-white/60">
          Country / Region
        </label>
        <div className="relative">
          <select
            id={`${prefix}-country`}
            name={`${prefix}-country`}
            autoComplete={`${prefix} country`}
            value={value.country}
            onChange={set("country")}
            className="w-full appearance-none rounded-sm border border-[#727349] bg-[#262019] px-4 py-3 pr-10 text-sm text-white outline-none transition-colors focus:border-[#E5E791] focus:ring-2 focus:ring-[#E5E791]/25"
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
    setIsCartOpen,
    cartSubtotal,
    cartTotalItems,
    cartTotalWeightGrams,
  } = useCart();
  const initializedForUser = useRef(null);
  const orderIdempotencyKey = useRef("");
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
  });
  const [shippingAddress, setShippingAddress] = useState(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState(EMPTY_ADDRESS);
  const [billingMatchesShipping, setBillingMatchesShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(MANUAL_BANK_TRANSFER.id);
  const [cardPaymentStatus, setCardPaymentStatus] = useState({
    loading: true,
    available: false,
    reason: "",
  });
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState(0);

  useEffect(() => {
    if (!user || initializedForUser.current === user.email) return;
    initializedForUser.current = user.email;
    setContact({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      company: user.company || "",
      email: user.email || "",
    });
    setShippingAddress({ ...EMPTY_ADDRESS, ...(user.shippingAddress || {}) });
    setBillingAddress({ ...EMPTY_ADDRESS, ...(user.billingAddress || {}) });
  }, [user]);

  useEffect(() => {
    if (!isSubmitting) return undefined;
    const timers = ORDER_STAGE_DELAYS.map((delay, index) =>
      window.setTimeout(() => setSubmissionStage(index + 1), delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isSubmitting]);

  useEffect(() => {
    if (!isLoggedIn || !BUNQ_CARD_PAYMENT_VISIBLE) return undefined;
    let active = true;

    fetch("/api/payment-methods", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Payment methods unavailable.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        const cardMethod = (data.methods || []).find(
          (method) => method.id === BUNQ_CARD_PAYMENT.id
        );
        setCardPaymentStatus({
          loading: false,
          available: cardMethod?.available === true,
          reason: cardMethod?.unavailableReason || "",
        });
        if (cardMethod?.available !== true) {
          setPaymentMethod((current) =>
            current === BUNQ_CARD_PAYMENT.id
              ? MANUAL_BANK_TRANSFER.id
              : current
          );
        }
      })
      .catch(() => {
        if (!active) return;
        setCardPaymentStatus({
          loading: false,
          available: false,
          reason: "Card payment is temporarily unavailable.",
        });
        setPaymentMethod((current) =>
          current === BUNQ_CARD_PAYMENT.id
            ? MANUAL_BANK_TRANSFER.id
            : current
        );
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  if (loading || !isLoggedIn || !user) return <AuthGate loading={loading} />;

  const discountPercentage = user.discountRate || 0;
  const discountAmount = cartSubtotal * (discountPercentage / 100);
  const finalTotal = cartSubtotal - discountAmount;
  const effectiveBillingAddress = billingMatchesShipping ? shippingAddress : billingAddress;

  const validateAddress = (address) =>
    Boolean(address.street.trim() && address.city.trim() && address.zip.trim() && address.country);

  const goForward = () => {
    setError("");
    if (step === 0 && (!contact.firstName.trim() || !contact.lastName.trim())) {
      setError("Enter the contact name to continue.");
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
    let navigationStarted = false;
    setSubmissionStage(0);
    setIsSubmitting(true);
    setError("");

    try {
      if (!orderIdempotencyKey.current) {
        orderIdempotencyKey.current = crypto.randomUUID();
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": orderIdempotencyKey.current,
        },
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
            shippingAddress,
            billingAddress: effectiveBillingAddress,
          },
          paymentMethod,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!data.uncertain) orderIdempotencyKey.current = "";
        throw new Error(data.error || "Order submission failed. Please try again.");
      }

      const completedStoreIds = (data.orders || []).map((order) => order.storeId);
      if (data.failures?.length) {
        removeItemsByStore(completedStoreIds);
        const uncertainStores = data.failures
          .filter((failure) => failure.uncertain)
          .map((failure) => failure.storeName);
        if (uncertainStores.length === 0) orderIdempotencyKey.current = "";
        throw new Error(
          uncertainStores.length
            ? `Orders were confirmed for ${data.orders.map((order) => order.storeName).join(", ")}, but confirmation is still uncertain for ${uncertainStores.join(", ")}. Check My Account before submitting again.`
            : `Orders were created for ${data.orders.map((order) => order.storeName).join(", ")}, but failed for ${data.failures.map((failure) => failure.storeName).join(", ")}. The remaining items are still in your cart.`
        );
      }

      if (paymentMethod === BUNQ_CARD_PAYMENT.id) {
        const paymentUrl = data.orders?.[0]?.paymentUrl || "";
        let securePaymentUrl;
        try {
          securePaymentUrl = new URL(paymentUrl);
          if (securePaymentUrl.protocol !== "https:") throw new Error("Invalid protocol.");
        } catch {
          removeItemsByStore(completedStoreIds);
          throw new Error(
            "Your order was created, but the secure card payment page could not be opened. Check My Account before submitting again."
          );
        }

        orderIdempotencyKey.current = "";
        clearCart();
        navigationStarted = true;
        window.location.assign(securePaymentUrl.toString());
        return;
      }

      orderIdempotencyKey.current = "";
      clearCart();
      const orderSummary = data.orders
        .map((order) => `${order.storeName} #${order.number}`)
        .join(" · ");
      const orderTotal = data.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      router.push(
        `/order-received?orders=${encodeURIComponent(orderSummary)}&total=${encodeURIComponent(orderTotal.toFixed(2))}&payment=${MANUAL_BANK_TRANSFER.id}`
      );
      navigationStarted = true;
    } catch (submissionError) {
      setError(submissionError.message || "Order submission failed. Please try again.");
    } finally {
      if (!navigationStarted) setIsSubmitting(false);
    }
  };

  const setContactField = (field) => (event) => {
    setContact((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  return (
    <div id="top" className={`${styles.page} theme-dark-zone site-background-page min-h-screen`}>
      {isSubmitting && <OrderSubmissionOverlay stage={submissionStage} />}
      <CheckoutHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/catalog" className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-sm text-xs font-bold text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5E791]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to catalog
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2f2f2]">
              Secure wholesale request
            </span>
            <h1 className="type-page-title mt-2 font-headline-lg text-white">
              Checkout
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Three short steps to confirm your wholesale order request.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        <ol aria-label="Checkout progress" className="mb-6 flex items-center">
          {STEPS.map((label, index) => {
            const complete = index < step;
            const active = index === step;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={`flex min-w-0 flex-1 items-center ${
                  active ? "text-white" : complete ? "text-[#f2f2f2]" : "text-white/30"
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
                  active || complete
                    ? "border-[#f2f2f2]/60 bg-[#999933]/20"
                    : "border-white/15"
                }`}>
                  {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="ml-2 truncate text-[10px] font-bold uppercase tracking-wider sm:text-xs">
                  {label}
                </span>
                {index < STEPS.length - 1 && (
                  <span className={`mx-2 h-px min-w-3 flex-1 sm:mx-4 ${
                    complete ? "bg-[#f2f2f2]/50" : "bg-white/10"
                  }`} />
                )}
              </li>
            );
          })}
        </ol>

        {cart.length === 0 ? (
          <section className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-white/15 bg-[#362E24] px-6 py-14 text-center shadow-2xl">
            <ShoppingBag className="h-12 w-12 text-white/25" />
            <h2 className="mt-5 text-xl font-bold text-white">Your cart is empty</h2>
            <p className="mt-2 text-sm text-white/50">Add products from the wholesale catalog before starting checkout.</p>
            <Link href="/catalog" className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#984C27] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#7D3E20] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5E791]">
              Browse catalog
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
            <section className="rounded-xl border border-white/15 bg-[#362E24] p-5 shadow-xl shadow-black/15 sm:p-7">
              {error && (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-sm border border-[#9A3232] bg-[#4C1919] px-4 py-3 text-xs leading-relaxed text-white">
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
                    <Field id="checkout-company" label="Company (optional)" autoComplete="organization" maxLength={160} value={contact.company} onChange={setContactField("company")} className="sm:col-span-2" />
                    <Field id="checkout-email" label="Account email" type="email" autoComplete="email" value={contact.email} disabled className="sm:col-span-2" />
                  </div>
                  <p className="flex items-center gap-2 text-[11px] text-white/40">
                    <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-[#f2f2f2]" />
                    Your verified account email is used for this order.
                  </p>
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
                  <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#727349] bg-[#262019] p-4 focus-within:border-[#E5E791] focus-within:ring-2 focus-within:ring-[#E5E791]/25">
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
                        <button type="button" onClick={() => setStep(0)} className="rounded-sm border-0 bg-transparent text-[10px] font-bold uppercase text-[#E5E791] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791]">Edit</button>
                      </div>
                      <p className="text-sm font-bold text-white">{contact.firstName} {contact.lastName}</p>
                      {contact.company && <p className="mt-1 text-xs text-white/55">{contact.company}</p>}
                      <p className="mt-1 break-all text-xs text-white/55">{contact.email}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#131313] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#f2f2f2]">Delivery</h3>
                        <button type="button" onClick={() => setStep(1)} className="rounded-sm border-0 bg-transparent text-[10px] font-bold uppercase text-[#E5E791] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791]">Edit</button>
                      </div>
                      <p className="text-xs leading-relaxed text-white/65">{addressLine(shippingAddress)}</p>
                      {!billingMatchesShipping && <p className="mt-3 border-t border-white/5 pt-3 text-[10px] text-white/40">Separate billing address provided.</p>}
                    </div>
                  </div>

                  <fieldset className="rounded-xl border border-[#BFC079] bg-[#473D2E] p-4 sm:p-5">
                    <legend className="px-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#f2f2f2]">
                      Payment method
                    </legend>
                    <div className={`grid gap-3 ${BUNQ_CARD_PAYMENT_VISIBLE ? "sm:grid-cols-2" : ""}`}>
                      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-[#E5E791]/35 ${
                        paymentMethod === MANUAL_BANK_TRANSFER.id
                          ? "border-[#E5E791] bg-[#474618]"
                          : "border-[#999A61] bg-[#262019] hover:border-[#E5E791]"
                      }`}>
                        <input
                          type="radio"
                          name="payment-method"
                          value={MANUAL_BANK_TRANSFER.id}
                          checked={paymentMethod === MANUAL_BANK_TRANSFER.id}
                          onChange={() => {
                            setPaymentMethod(MANUAL_BANK_TRANSFER.id);
                            setConfirmed(false);
                            setError("");
                          }}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#999933]"
                        />
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#f2f2f2]">
                          <Landmark className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-white">
                            {MANUAL_BANK_TRANSFER.title}
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-white/50">
                            Pay directly from your bank account.
                          </span>
                        </span>
                      </label>

                      {BUNQ_CARD_PAYMENT_VISIBLE && (
                        <label className={`flex items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-[#E5E791]/35 ${
                          cardPaymentStatus.available
                            ? "cursor-pointer"
                            : "cursor-not-allowed"
                        } ${
                          paymentMethod === BUNQ_CARD_PAYMENT.id
                            ? "border-[#E5E791] bg-[#474618]"
                            : cardPaymentStatus.available
                              ? "border-[#999A61] bg-[#262019] hover:border-[#E5E791]"
                              : "border-[#727349] bg-[#262019] text-white/65"
                        }`}>
                          <input
                            type="radio"
                            name="payment-method"
                            value={BUNQ_CARD_PAYMENT.id}
                            checked={paymentMethod === BUNQ_CARD_PAYMENT.id}
                            disabled={!cardPaymentStatus.available}
                            onChange={() => {
                              setPaymentMethod(BUNQ_CARD_PAYMENT.id);
                              setConfirmed(false);
                              setError("");
                            }}
                            className="mt-1 h-4 w-4 shrink-0 accent-[#999933]"
                          />
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#f2f2f2]">
                            <CreditCard className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-white">
                              {BUNQ_CARD_PAYMENT.title}
                            </span>
                            <span className="mt-1 block text-[11px] font-bold text-white/55">
                              Securely via {BUNQ_CARD_PAYMENT.provider}
                            </span>
                            {!cardPaymentStatus.available && (
                              <span className="mt-2 block text-[10px] font-bold leading-relaxed text-[#E5E791]">
                                {cardPaymentStatus.loading
                                  ? "Checking availability..."
                                  : cardPaymentStatus.reason}
                              </span>
                            )}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-5">
                      {paymentMethod === MANUAL_BANK_TRANSFER.id ? (
                        <BankTransferDetails showTitle={false} />
                      ) : (
                        <div className="flex items-start gap-3 rounded-lg border border-[#f2f2f2]/20 bg-white/[0.035] p-4">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f2f2f2]" />
                          <div>
                            <h3 className="text-xs font-black text-white">
                              Secure hosted card payment
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-white/55">
                              After the order is registered, you will continue to the secure
                              WooCommerce payment page powered by {BUNQ_CARD_PAYMENT.provider}.
                              This portal never receives or stores your card details.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </fieldset>

                  <div className="flex items-start gap-3 rounded-lg border border-[#999933]/25 bg-[#999933]/10 p-4">
                    <MessageCircleMore className="mt-0.5 h-4 w-4 shrink-0 text-[#f2f2f2]" />
                    <div>
                      <h3 className="text-xs font-bold text-white">What happens next?</h3>
                      <p className="mt-1 text-xs leading-relaxed text-white/55">
                        {paymentMethod === MANUAL_BANK_TRANSFER.id
                          ? "After submitting, use your Order Number as the bank transfer reference. Your order ships after the funds clear and freight is confirmed."
                          : "After submitting, you will be redirected to the secure card payment page. The order is prepared after payment is confirmed."}
                      </p>
                    </div>
                  </div>

                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-[#E5E791]/35 ${
                    confirmed
                      ? "border-[#E5E791] bg-[#474618]"
                      : "border-[#999A61] bg-[#262019]"
                  }`}>
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
                      I have reviewed my contact, delivery, payment, and order details. I understand
                      that shipping is calculated separately and fulfillment begins after payment
                      is confirmed.
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
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/5 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791] disabled:cursor-not-allowed disabled:border-[#675943] disabled:bg-[#262019] disabled:text-[#BFC079]"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : <span />}

                <div className="flex flex-col gap-2 sm:min-w-64">
                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={goForward}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#984C27] px-7 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#7D3E20] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791]"
                    >
                      {step === 0 ? "Continue to delivery" : "Review order"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={submitOrder}
                        disabled={isSubmitting || !confirmed}
                        aria-busy={isSubmitting}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#984C27] px-7 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#7D3E20] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791] disabled:cursor-not-allowed disabled:bg-[#63311A] disabled:text-[#E5E791] disabled:shadow-none"
                      >
                        {isSubmitting ? (
                          <>Submitting order <Loader2 className="h-4 w-4 animate-spin" /></>
                        ) : paymentMethod === BUNQ_CARD_PAYMENT.id ? (
                          <>Continue to secure payment <CreditCard className="h-4 w-4" /></>
                        ) : (
                          <>Submit order request <PackageCheck className="h-4 w-4" /></>
                        )}
                      </button>
                      <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/60">
                        <LockKeyhole className="h-3 w-3 text-[#f2f2f2]" />
                        {paymentMethod === BUNQ_CARD_PAYMENT.id
                          ? "Card details are handled only by the secure payment provider"
                          : "Bank transfer is completed outside this website"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>

            <aside className="rounded-xl border border-white/15 bg-[#362E24] shadow-xl shadow-black/15 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <ShoppingBag className="h-4 w-4 text-[#f2f2f2]" />
                <h2 className="text-sm font-bold text-white">Order summary</h2>
                <span className="ml-auto text-xs text-white/45">{cartTotalItems} items</span>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="rounded-sm border-0 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#E5E791] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791]"
                >
                  Edit
                </button>
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
                <div className="mt-3 flex items-start gap-2 rounded-sm border border-white/10 bg-[#262019] px-3 py-2.5 text-[10px] leading-relaxed text-white/60">
                  <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f2f2f2]" />
                  {paymentMethod === BUNQ_CARD_PAYMENT.id
                    ? `Secure card payment via ${BUNQ_CARD_PAYMENT.provider}.`
                    : "Manual bank transfer. Use the Order Number as the payment reference."}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

    </div>
  );
}
