"use client";

/* eslint-disable @next/next/no-img-element -- Cart images come from WooCommerce. */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Package, Plus, ShoppingBag, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import LoginModal from "./LoginModal";
import ProductRecommendations from "./ProductRecommendations";
import {
  NEW_CUSTOMER_ROLE,
  progressivePerGramRate,
  progressiveTableKeyFor,
} from "@/lib/pricing";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

export default function CartDrawer() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartTotalItems,
    cartTotalWeightGrams,
  } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeCart = () => setIsCartOpen(false);

  useDialogAccessibility(isCartOpen && !isLoginOpen, closeCart, {
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isCartOpen && !isLoginOpen) return null;

  const perGramRates =
    isLoggedIn && user?.role === NEW_CUSTOMER_ROLE
      ? [...new Set(
          cart
            .filter((item) => item.weightGrams > 0)
            .map((item) => progressiveTableKeyFor(item.category))
        )]
          .map((tableKey) => ({
            tableKey,
            label: tableKey === "shamanic" ? "SHAMANIC" : "INDIGENOUS",
            rate: progressivePerGramRate(cartTotalWeightGrams, tableKey),
          }))
          .filter(({ rate }) => rate != null)
      : [];

  const discountPercentage = isLoggedIn && user ? user.discountRate : 0;
  const discountAmount = cartSubtotal * (discountPercentage / 100);
  const finalTotal = cartSubtotal - discountAmount;

  const handleCheckout = () => {
    if (!isLoggedIn || !user) {
      setIsLoginOpen(true);
      return;
    }
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            aria-hidden="true"
            onClick={closeCart}
            className="absolute inset-0 bg-black/60"
          />

          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#1a1a1a] shadow-2xl animate-fade-in-left"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-[#131313] px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-[#f2f2f2]" aria-hidden="true" />
                <h2 id="cart-drawer-title" className="font-headline-md text-xl font-bold text-white">
                  Cart
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close cart"
                onClick={closeCart}
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-none">
              {cart.length > 0 ? (
                <div className="flex flex-col">
                  <div className="flex flex-col gap-5 divide-y divide-white/5 px-5 py-5 sm:px-8 sm:py-6">
                    {cart.map((item, index) => (
                      <div
                        key={item.cartKey}
                        className={`flex flex-col items-start justify-between gap-4 sm:flex-row ${
                          index > 0 ? "pt-5" : ""
                        }`}
                      >
                        <div className="flex w-full min-w-0 flex-grow gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-white/5 text-[#f2f2f2]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <Package className="h-4 w-4" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold leading-snug text-white">
                              {item.name}
                            </h3>
                            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                              <span className="rounded-sm border border-[#999933]/30 bg-[#999933]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f2f2f2]">
                                {item.optionName}
                              </span>
                              <span className="break-all font-mono text-[10px] text-white/35">
                                {item.sku}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 sm:w-auto sm:min-w-[100px] sm:flex-col sm:items-end">
                          <span className="font-mono text-sm font-bold text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <div className="flex items-center rounded-sm border border-white/10 bg-[#131313]">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              onClick={() => updateQuantity(item.cartKey, -1)}
                              className="cursor-pointer border-0 bg-transparent p-1.5 text-white/50 hover:text-white"
                            >
                              <Minus className="h-3 w-3" aria-hidden="true" />
                            </button>
                            <span className="w-7 text-center font-mono text-xs font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              onClick={() => updateQuantity(item.cartKey, 1)}
                              disabled={
                                item.stockQuantity != null &&
                                item.quantity >= item.stockQuantity
                              }
                              className="cursor-pointer border-0 bg-transparent p-1.5 text-white/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartKey)}
                            className="cursor-pointer border-0 bg-transparent text-[10px] font-semibold uppercase tracking-wider text-white/35 transition-colors hover:text-[#cc6633]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-y border-[#999933]/25 bg-[#242f27] px-5 py-6 sm:px-8">
                    <ProductRecommendations
                      eyebrow="Optional add-ons"
                      title="You may also like"
                      description="These suggestions are separate from your current order and are added only when you select Add."
                      variant="drawer"
                      limit={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-4 px-5 text-center text-white/30 sm:px-8">
                  <ShoppingBag className="h-12 w-12 stroke-[1.5]" aria-hidden="true" />
                  <p className="text-sm font-semibold">Your cart is currently empty.</p>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="cursor-pointer border-0 bg-transparent text-xs font-bold uppercase tracking-widest text-[#f2f2f2] hover:underline"
                  >
                    Browse catalog
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 border-t border-white/10 bg-[#131313] px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/50">
                  <span>Total items</span>
                  <span className="font-mono font-bold text-white">{cartTotalItems}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-xs text-white/50">
                  <span>EST. WEIGHT</span>
                  <span className="font-bold text-white">
                    {cartTotalWeightGrams >= 1000
                      ? `${(cartTotalWeightGrams / 1000).toFixed(2)} kg`
                      : `${Math.round(cartTotalWeightGrams)} g`}
                  </span>
                </div>
                {perGramRates.map(({ tableKey, label, rate }) => (
                  <div key={tableKey} className="flex items-center justify-between font-mono text-xs text-[#f2f2f2]">
                    <span>VOLUME RATE: {label}</span>
                    <span className="font-bold">${rate.toFixed(2)}/g</span>
                  </div>
                ))}
                {isLoggedIn && user && (
                  <div className="mt-1 flex items-center justify-between font-mono text-xs text-[#f2f2f2]">
                    <span>B2B DISCOUNT ({user.discountRate}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="my-2 h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-widest text-white">
                    Est. partner total
                  </span>
                  <span className="font-headline-lg text-2xl font-black text-[#f2f2f2]">
                    ${(isLoggedIn && user ? finalTotal : cartSubtotal).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-sm border-0 bg-[#cc6633] py-5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#cc6633]/20 transition-all hover:bg-[#b6532a] hover:shadow-[#cc6633]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoggedIn ? "Proceed to checkout" : "Sign in to submit order"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
