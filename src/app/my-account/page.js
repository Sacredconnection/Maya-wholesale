"use client";

/* eslint-disable @next/next/no-img-element -- User avatars may come from arbitrary account URLs. */

import { Fragment, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ApplicationModal from "@/components/ApplicationModal";
import {
  User,
  ShoppingBag,
  Download,
  MapPin,
  Settings,
  LogOut,
  ClipboardList,
  Check,
  Truck,
  AlertCircle,
  Save,
  Lock,
  Camera,
  CreditCard,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import {
  findCatalogProduct,
  findOptionIndex,
  isStockedOption,
  mapWithClientConcurrency,
} from "@/lib/reorder-utils";
import {
  BUNQ_CARD_PAYMENT,
  MANUAL_BANK_TRANSFER,
} from "@/lib/payment-methods";

// WooCommerce order status → UI label/color
const ORDER_STATUS_STYLES = {
  "on-hold": { label: "Awaiting Contact", className: "text-yellow-400" },
  pending: { label: "Pending", className: "text-yellow-400" },
  processing: { label: "Processing", className: "text-[#f2f2f2]" },
  completed: { label: "Completed", className: "text-emerald-400" },
  cancelled: { label: "Cancelled", className: "text-[#ffb4ab]" },
  refunded: { label: "Refunded", className: "text-white/50" },
  failed: { label: "Failed", className: "text-[#ffb4ab]" },
};

const orderStatusInfo = (status) =>
  ORDER_STATUS_STYLES[status] || { label: status, className: "text-white/60" };

const OPEN_ORDER_STATUSES = ["on-hold", "pending", "processing"];

const formatOrderDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function MyAccountPage() {
  const { isLoggedIn, user, loading, logout, updateUser } = useAuth();
  const { products, loading: productsLoading, resolveProduct } = useProducts();
  const { addSelectionsToCart } = useCart();
  const router = useRouter();
  const avatarInputRef = useRef(null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState("dashboard");

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarMessage("");
    setAvatarError("");
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(file.type)) {
      setAvatarError("Choose a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setAvatarError("The profile image must be 4 MB or smaller.");
      e.target.value = "";
      return;
    }
    setAvatarSaving(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The profile photo could not be saved.");
      updateUser(data.user);
      setAvatarLoadFailed(false);
      setAvatarMessage("Profile photo saved.");
    } catch (error) {
      setAvatarError(error.message || "The profile photo could not be saved.");
    } finally {
      setAvatarSaving(false);
      e.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarMessage("");
    setAvatarError("");
    setAvatarSaving(true);
    try {
      const response = await fetch("/api/account/avatar", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The profile photo could not be removed.");
      updateUser(data.user);
      setAvatarLoadFailed(false);
      setAvatarMessage("Profile photo removed.");
    } catch (error) {
      setAvatarError(error.message || "The profile photo could not be removed.");
    } finally {
      setAvatarSaving(false);
    }
  };


  // Modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Address edit toggles and form states
  const [editShipping, setEditShipping] = useState(false);
  const [shippingMessage, setShippingMessage] = useState("");
  const [shippingForm, setShippingForm] = useState({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });

  const [editBilling, setEditBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");
  const [billingForm, setBillingForm] = useState({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });

  // Account details form state
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    company: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [accountSuccess, setAccountSuccess] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  // Live orders registered in WooCommerce, looked up by billing email
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [reorderingOrderId, setReorderingOrderId] = useState("");
  const [reorderMessage, setReorderMessage] = useState("");
  const [reorderError, setReorderError] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const res = await fetch("/api/orders", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load orders.");
        if (!cancelled) setOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) setOrdersError(err.message || "Failed to load orders.");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const activeOrder = orders.find((o) => OPEN_ORDER_STATUSES.includes(o.status));

  // Sync state with user data once loaded
  useEffect(() => {
    if (!user) return;

    const syncTimer = window.setTimeout(() => {
      setShippingForm({ ...user.shippingAddress });
      setBillingForm({ ...user.billingAddress });
      setAccountForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        displayName: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1" && params.get("redirect")) {
      const openTimer = window.setTimeout(() => setIsLoginOpen(true), 0);
      return () => window.clearTimeout(openTimer);
    }
  }, [isLoggedIn]);

  // Handle Loading State
  if (loading) {
    return (
      <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />
        <div role="status" className="flex-grow flex items-center justify-center" aria-label="Loading account">
          <div className="w-10 h-10 border-4 border-[#999933] border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle Not Logged In State
  if (!isLoggedIn) {
    return (
      <div id="top" className="site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />

        <main className="site-content-shell flex flex-grow items-center justify-center py-16 sm:py-20 lg:py-24">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 sm:p-8 lg:p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#999933]/10 pointer-events-none rounded-full"></div>

            <div className="w-16 h-16 rounded-full bg-[#93000a]/10 border border-[#93000a]/30 flex items-center justify-center text-3xl mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-[#ffb4ab]" />
            </div>

            <h2 className="font-headline-md text-3xl font-bold text-white mb-3">
              Portal Access Restricted
            </h2>
            <p className="font-body-md text-sm text-white/60 leading-relaxed mb-8">
              You must be a registered and approved B2B partner to view wholesale account details. Log in using your credentials or apply for a wholesale partnership.
            </p>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider py-4 rounded transition-all cursor-pointer border-0 w-full shadow-lg shadow-[#cc6633]/15"
              >
                Access Portal Login
              </button>
              <button
                type="button"
                onClick={() => setIsApplyOpen(true)}
                className="bg-transparent hover:bg-white/5 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider py-4 rounded transition-all cursor-pointer border border-white/10 w-full"
              >
                Apply for Wholesale Account
              </button>
            </div>
          </div>
        </main>

        <Footer />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <ApplicationModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      </div>
    );
  }

  // Handle Logout Action
  const handleLogoutAction = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  // Handle Account Update
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountSuccess("");
    setAccountError("");

    const normalizedProfile = {
      firstName: accountForm.firstName.trim(),
      lastName: accountForm.lastName.trim(),
      displayName: accountForm.displayName.trim(),
      phone: accountForm.phone.trim(),
    };

    if (!normalizedProfile.firstName || !normalizedProfile.lastName || !normalizedProfile.displayName || !normalizedProfile.phone) {
      setAccountError("Please complete all required account fields.");
      return;
    }

    setAccountSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedProfile),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Account details could not be saved.");
      }

      updateUser(data.user);
      setAccountForm((prev) => ({
        ...prev,
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        displayName: data.user.displayName || "",
        phone: data.user.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setAccountSuccess("Account details saved.");
    } catch (error) {
      setAccountError(error.message || "Account details could not be saved.");
    } finally {
      setAccountSaving(false);
    }
  };

  const handleRepeatOrder = async (order) => {
    if (reorderingOrderId || productsLoading) return;
    setReorderingOrderId(order.id);
    setReorderMessage("");
    setReorderError("");

    try {
      const results = await mapWithClientConcurrency(
        order.items || [],
        4,
        async (item) => {
          const product = findCatalogProduct(products, item, order.storeId);
          if (!product) return { unavailable: item.name };
          try {
            const resolved = product.optionsLoaded
              ? product
              : await resolveProduct(product);
            const optionIndex = findOptionIndex(resolved, item);
            if (optionIndex < 0) return { unavailable: item.name };
            const option = resolved.options?.[optionIndex];
            const requestedQuantity = Math.max(1, Number(item.quantity) || 1);
            if (!isStockedOption(option, 1)) return { unavailable: item.name };
            const quantity =
              option.stockQuantity == null
                ? requestedQuantity
                : Math.min(requestedQuantity, Number(option.stockQuantity));
            if (!isStockedOption(option, quantity)) {
              return { unavailable: item.name };
            }
            return {
              selection: {
                product: resolved,
                optionIndex,
                quantity,
              },
              adjusted: quantity < requestedQuantity ? item.name : null,
            };
          } catch {
            return { unavailable: item.name };
          }
        }
      );

      const selections = results.flatMap((result) =>
        result.selection ? [result.selection] : []
      );
      const unavailable = results.flatMap((result) =>
        result.unavailable ? [result.unavailable] : []
      );
      const adjusted = results.flatMap((result) =>
        result.adjusted ? [result.adjusted] : []
      );
      if (selections.length === 0) {
        throw new Error(
          "None of the products from this order are currently available."
        );
      }

      addSelectionsToCart(selections);
      const notes = [];
      if (unavailable.length > 0) {
        notes.push(`${unavailable.length} unavailable product(s) were skipped.`);
      }
      if (adjusted.length > 0) {
        notes.push(`${adjusted.length} quantity value(s) were limited to current stock.`);
      }
      setReorderMessage(
        `Order #${order.number} was added to your cart. ${notes.join(" ")}`.trim()
      );
    } catch (repeatError) {
      setReorderError(
        repeatError.message || "This order could not be added again."
      );
    } finally {
      setReorderingOrderId("");
    }
  };

  // Handle Address Updates
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const normalizedAddress = Object.fromEntries(
      Object.entries(shippingForm).map(([key, value]) => [key, value.trim()]),
    );
    if (["street", "city", "state", "zip", "country"].some((key) => !normalizedAddress[key])) {
      setShippingMessage("Please complete all required shipping fields.");
      return;
    }
    updateUser({ shippingAddress: normalizedAddress });
    setShippingForm(normalizedAddress);
    setShippingMessage("Shipping address preview updated for this session.");
    setEditShipping(false);
  };

  const handleAccountFieldChange = (field) => (event) => {
    setAccountForm((prev) => ({ ...prev, [field]: event.target.value }));
    setAccountSuccess("");
    setAccountError("");
  };

  const handleBillingSubmit = (e) => {
    e.preventDefault();
    const normalizedAddress = Object.fromEntries(
      Object.entries(billingForm).map(([key, value]) => [key, value.trim()]),
    );
    if (["street", "city", "state", "zip", "country"].some((key) => !normalizedAddress[key])) {
      setBillingMessage("Please complete all required billing fields.");
      return;
    }
    updateUser({ billingAddress: normalizedAddress });
    setBillingForm(normalizedAddress);
    setBillingMessage("Billing address preview updated for this session.");
    setEditBilling(false);
  };

  return (
    <div id="top" className="account-page site-background-page bg-[#25362D] text-[#f2f2f2] min-h-screen flex flex-col font-sans antialiased justify-between">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Hero Header Section */}
      <section className="account-hero bg-white border-b border-[#999933] py-8 sm:py-10 lg:py-12 relative overflow-hidden">
        <div className="site-content-shell relative flex items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarSaving}
            aria-busy={avatarSaving}
            aria-label="Choose a new profile photo"
            className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white/20 hover:border-[#999933] cursor-pointer overflow-hidden group shrink-0 bg-[#131313] flex items-center justify-center transition-all p-0"
          >
            {user.avatar && !avatarLoadFailed ? (
              <img
                src={user.avatar}
                alt="Profile"
                onError={() => setAvatarLoadFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white/40">
                {(user.firstName || user.displayName || "?")[0]?.toUpperCase()}
              </span>
            )}
            <div className="account-avatar-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[9px] font-mono text-white uppercase">Change</span>
            </div>
          </button>
          <input
            ref={avatarInputRef}
            id="account-avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            disabled={avatarSaving}
            aria-describedby="avatar-upload-feedback"
            className="hidden"
          />

          <div className="min-w-0">
            <h1 className="account-hero-title type-page-title break-words font-headline-lg">
              My Account
            </h1>
            <p className="account-hero-meta break-words text-sm mt-1.5 font-mono">
              Welcome back, <span className="account-hero-name font-bold">{user.displayName}</span> · ID: {user.accountId}
            </p>
          </div>
        </div>
      </section>

      {/* Main Account Portal Area */}
      <main className="site-content-shell flex-grow py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 sm:gap-12 items-start">

          {/* Tabs Sidebar */}
          <aside className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 scrollbar-none">
            {[
              { id: "dashboard", label: "Dashboard", icon: User },
              { id: "orders", label: "Orders", icon: ShoppingBag },
              { id: "downloads", label: "Downloads", icon: Download },
              { id: "addresses", label: "Addresses", icon: MapPin },
              { id: "details", label: "Account Details", icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border-l-2 cursor-pointer text-left whitespace-nowrap lg:w-full select-none ${
                    active
                      ? "bg-[#999933]/15 text-[#f2f2f2] border-[#999933]"
                      : "text-white/60 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#f2f2f2]" : "text-white/50"}`} />
                  {tab.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleLogoutAction}
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-sm transition-all border-l-2 border-transparent text-[#ffb4ab] hover:text-[#ffb4ab] hover:bg-[#93000a]/10 cursor-pointer text-left whitespace-nowrap lg:w-full lg:mt-4"
            >
              <LogOut className="w-4 h-4 text-[#ffb4ab]" />
              Logout
            </button>
          </aside>

          {/* Tab Panel Content Area */}
          <div className="lg:col-span-3 flex flex-col gap-10 sm:gap-12">

            {/* 1. DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-10 sm:gap-12 animate-fade-in">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 md:p-8 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#999933]/5 pointer-events-none rounded-full"></div>

                  <h2 className="font-headline-md text-2xl font-bold text-white mb-4">
                    Hello, {user.firstName || user.displayName}!
                  </h2>

                  <p className="font-body-md text-sm text-white/70 leading-relaxed mb-6">
                    From your account dashboard, you can easily access your{" "}
                    <button type="button" onClick={() => setActiveTab("orders")} className="text-[#f2f2f2] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0">
                      recent orders
                    </button>
                    , manage your{" "}
                    <button type="button" onClick={() => setActiveTab("addresses")} className="text-[#f2f2f2] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0">
                      shipping and billing addresses
                    </button>
                    , and update your{" "}
                    <button type="button" onClick={() => setActiveTab("details")} className="text-[#f2f2f2] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0">
                      password and account details
                    </button>
                    .
                  </p>

                  <div className="h-px bg-white/10 my-6"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#131313] border border-white/5 p-4 rounded-lg flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Partner Discount</span>
                      <span className="text-xl font-bold text-[#f2f2f2]">{user.discountRate}% Off Base</span>
                      <span className="text-[10px] text-white/40 font-mono mt-0.5">Applied at wholesale checkout</span>
                    </div>

                    <div className="bg-[#131313] border border-white/5 p-4 rounded-lg flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Company Status</span>
                      <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-5 h-5 shrink-0" />
                        {user.status}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono mt-0.5">Verified wholesale buyer</span>
                    </div>
                  </div>
                </div>

                {/* Active Order Mini-Card */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-xl flex flex-col gap-4">
                  <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#f2f2f2]" />
                    Active Orders
                  </h3>
                  {activeOrder ? (
                    <div className="bg-[#131313] border border-white/5 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="break-all text-sm font-bold text-white">Order #{activeOrder.number}</span>
                          <span className="text-[10px] text-white/45">{activeOrder.storeName}</span>
                          <span className="text-[10px] font-mono bg-[#999933]/20 text-[#f2f2f2] border border-[#999933]/30 px-2 py-0.5 rounded">
                            {orderStatusInfo(activeOrder.status).label}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                          {activeOrder.items.map((i) => `${i.name} x ${i.quantity}`).join(" · ")}
                          {" · $"}{Number(activeOrder.total).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all shrink-0 cursor-pointer"
                      >
                        View Order Details
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 leading-relaxed">
                      {ordersLoading
                        ? "Loading your orders…"
                        : "No open orders at the moment. New wholesale orders appear here once submitted."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-10 sm:gap-12 animate-fade-in">
                {/* Active Order Tracker Detail */}
                {activeOrder && (
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-xl">
                    <h3 className="font-headline-md text-lg font-bold text-white mb-6 flex items-center gap-2.5">
                      <ClipboardList className="w-5 h-5 text-[#f2f2f2]" />
                      Active Order Tracking
                    </h3>

                    <div className="border border-white/5 bg-[#131313] rounded-lg p-6 flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <span className="text-[10px] font-mono text-white/50">Order Reference</span>
                          <p className="text-sm font-bold text-white mt-0.5">
                            Order #{activeOrder.number} · {activeOrder.storeName} · {formatOrderDate(activeOrder.dateCreated)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-white/50">Est. Total</span>
                          <p className="text-sm font-bold text-[#f2f2f2] mt-0.5">
                            ${Number(activeOrder.total).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Progress steps driven by the WooCommerce status */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="flex flex-col gap-2">
                          <div className="h-1.5 bg-[#999933] rounded-full"></div>
                          <span className="text-[9px] font-mono text-white/80 font-bold uppercase">1. Order Received</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className={`h-1.5 rounded-full ${activeOrder.status === "processing" ? "bg-[#999933]" : "bg-white/10"}`}></div>
                          <span className={`text-[9px] font-mono uppercase ${activeOrder.status === "processing" ? "text-[#f2f2f2] font-bold" : "text-white/40"}`}>
                            2. {activeOrder.paymentMethodTitle === MANUAL_BANK_TRANSFER.title
                              ? "Funds Cleared"
                              : activeOrder.paymentMethod === BUNQ_CARD_PAYMENT.id
                                ? "Payment Confirmed"
                              : "Payment Arranged"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="h-1.5 bg-white/10 rounded-full"></div>
                          <span className="text-[9px] font-mono text-white/40 uppercase">3. Shipped & Completed</span>
                        </div>
                      </div>

                      {OPEN_ORDER_STATUSES.slice(0, 2).includes(activeOrder.status) && (
                        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                          <p className="text-[11px] leading-relaxed text-white/50">
                            {activeOrder.paymentMethodTitle === MANUAL_BANK_TRANSFER.title
                              ? `Pay by manual bank transfer and use Order #${activeOrder.number} as the reference. The order ships after the funds clear and freight is confirmed.`
                              : activeOrder.paymentMethod === BUNQ_CARD_PAYMENT.id
                                ? "Complete the secure card payment to begin fulfillment. Card details are handled only by the WooCommerce payment page."
                                : "No online payment is required; our team will contact you to arrange payment and confirm shipping for this order."}
                          </p>
                          {activeOrder.paymentUrl && (
                            <a
                              href={activeOrder.paymentUrl}
                              className="inline-flex w-fit items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white no-underline transition-colors hover:bg-[#b6532a]"
                            >
                              Complete card payment
                              <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Orders List Table */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-xl">
                  <h3 className="font-headline-md text-lg font-bold text-white mb-4">
                    Order History
                  </h3>

                  {(reorderMessage || reorderError) && (
                    <div
                      role="status"
                      className={`mb-4 rounded border p-3 text-xs ${
                        reorderError
                          ? "border-red-300/20 bg-red-400/10 text-red-100"
                          : "border-[#f2f2f2]/25 bg-[#999933]/10 text-[#eadcae]"
                      }`}
                    >
                      {reorderError || reorderMessage}
                    </div>
                  )}

                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-[#999933] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : ordersError ? (
                    <div className="bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-4 rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {ordersError}
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-sm text-white/40 py-8 text-center">
                      No orders yet. Submit a wholesale order from the catalog and it will appear here.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-white/50 font-mono uppercase tracking-wider">
                            <th className="py-3 px-4 font-normal">Order</th>
                            <th className="py-3 px-4 font-normal">Date</th>
                            <th className="py-3 px-4 font-normal">Total</th>
                            <th className="py-3 px-4 font-normal">Status</th>
                            <th className="py-3 px-4 text-right font-normal">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-body-md text-white/80">
                          {orders.map((order) => (
                            <Fragment key={order.id}>
                              <tr>
                                <td className="py-4 px-4 font-bold text-white">
                                  <span className="block">#{order.number}</span>
                                  <span className="block text-[10px] font-normal text-white/40">{order.storeName}</span>
                                </td>
                                <td className="py-4 px-4">{formatOrderDate(order.dateCreated)}</td>
                                <td className="py-4 px-4">${Number(order.total).toFixed(2)}</td>
                                <td className="py-4 px-4">
                                  <span className={orderStatusInfo(order.status).className}>
                                    {orderStatusInfo(order.status).label}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex min-w-max items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                                      }
                                      className="text-[#f2f2f2] hover:underline font-bold bg-transparent border-0 cursor-pointer"
                                    >
                                      {expandedOrderId === order.id ? "Hide Details" : "View Details"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRepeatOrder(order)}
                                      disabled={Boolean(reorderingOrderId) || productsLoading}
                                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-white transition-colors hover:border-[#f2f2f2]/40 hover:bg-[#999933]/10 disabled:cursor-wait disabled:opacity-50"
                                    >
                                      {reorderingOrderId === order.id ? (
                                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      )}
                                      {reorderingOrderId === order.id ? "Adding" : "Reorder"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedOrderId === order.id && (
                                <tr>
                                  <td colSpan={5} className="py-4 px-4 bg-[#131313]">
                                    <div className="flex flex-col gap-2">
                                      {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px]">
                                          <span className="text-white/70">
                                            {item.name}
                                            {item.sku && (
                                              <span className="text-white/35 font-mono ml-2">{item.sku}</span>
                                            )}
                                          </span>
                                          <span className="text-white/70 font-mono shrink-0 ml-4">
                                            x{item.quantity} · ${Number(item.total).toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                      {order.paymentMethodTitle && (
                                        <p className="text-[10px] text-white/40 border-t border-white/5 pt-2 mt-1">
                                          Payment: {order.paymentMethodTitle}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. DOWNLOADS TAB */}
            {activeTab === "downloads" && (
              <div
                className="min-h-[32rem] rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl animate-fade-in"
                aria-label="Downloads"
              />
            )}

            {/* 4. ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <p className="text-xs text-white/50">
                  The following addresses will be used on the checkout order drafts by default.
                </p>

                <div className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-2">

                  {/* Shipping Address */}
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                      <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white">
                        Shipping Address
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditShipping(!editShipping);
                          setShippingMessage("");
                        }}
                        className="text-[10px] font-mono text-[#f2f2f2] hover:text-white font-bold bg-transparent border-0 cursor-pointer"
                      >
                        {editShipping ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    {shippingMessage && (
                      <p role={editShipping ? "alert" : "status"} className={`mb-3 text-xs ${editShipping ? "text-[#ffb4ab]" : "text-[#f2f2f2]"}`}>
                        {shippingMessage}
                      </p>
                    )}

                    {!editShipping ? (
                      <address className="not-italic text-xs text-white/70 leading-relaxed flex flex-col gap-1">
                        <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                        <p>{user.shippingAddress.street}</p>
                        <p>{user.shippingAddress.neighborhood}</p>
                        <p>{user.shippingAddress.city}, {user.shippingAddress.state} {user.shippingAddress.zip}</p>
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{user.shippingAddress.country}</p>
                      </address>
                    ) : (
                      <form onSubmit={handleShippingSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="shipping-street" className="text-[9px] font-mono uppercase text-white/50">Street Address</label>
                          <input
                            id="shipping-street"
                            name="shipping-street"
                            type="text"
                            autoComplete="shipping address-line1"
                            value={shippingForm.street}
                            onChange={(e) => setShippingForm(prev => ({ ...prev, street: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="shipping-neighborhood" className="text-[9px] font-mono uppercase text-white/50">Neighborhood (Optional)</label>
                          <input
                            id="shipping-neighborhood"
                            name="shipping-neighborhood"
                            type="text"
                            autoComplete="shipping address-line2"
                            value={shippingForm.neighborhood}
                            onChange={(e) => setShippingForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="shipping-city" className="text-[9px] font-mono uppercase text-white/50">City</label>
                            <input
                              id="shipping-city"
                              name="shipping-city"
                              type="text"
                              autoComplete="shipping address-level2"
                              value={shippingForm.city}
                              onChange={(e) => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="shipping-state" className="text-[9px] font-mono uppercase text-white/50">State / Region</label>
                            <input
                              id="shipping-state"
                              name="shipping-state"
                              type="text"
                              autoComplete="shipping address-level1"
                              value={shippingForm.state}
                              onChange={(e) => setShippingForm(prev => ({ ...prev, state: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="shipping-postal-code" className="text-[9px] font-mono uppercase text-white/50">Postal Code</label>
                            <input
                              id="shipping-postal-code"
                              name="shipping-postal-code"
                              type="text"
                              autoComplete="shipping postal-code"
                              value={shippingForm.zip}
                              onChange={(e) => setShippingForm(prev => ({ ...prev, zip: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="shipping-country" className="text-[9px] font-mono uppercase text-white/50">Country</label>
                            <input
                              id="shipping-country"
                              name="shipping-country"
                              type="text"
                              autoComplete="shipping country-name"
                              value={shippingForm.country}
                              onChange={(e) => setShippingForm(prev => ({ ...prev, country: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded mt-2 cursor-pointer border-0 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Apply Shipping Preview
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Billing Address */}
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                      <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white">
                        Billing Address
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditBilling(!editBilling);
                          setBillingMessage("");
                        }}
                        className="text-[10px] font-mono text-[#f2f2f2] hover:text-white font-bold bg-transparent border-0 cursor-pointer"
                      >
                        {editBilling ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    {billingMessage && (
                      <p role={editBilling ? "alert" : "status"} className={`mb-3 text-xs ${editBilling ? "text-[#ffb4ab]" : "text-[#f2f2f2]"}`}>
                        {billingMessage}
                      </p>
                    )}

                    {!editBilling ? (
                      <address className="not-italic text-xs text-white/70 leading-relaxed flex flex-col gap-1">
                        <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                        <p>{user.billingAddress.street}</p>
                        <p>{user.billingAddress.neighborhood}</p>
                        <p>{user.billingAddress.city}, {user.billingAddress.state} {user.billingAddress.zip}</p>
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">{user.billingAddress.country}</p>
                      </address>
                    ) : (
                      <form onSubmit={handleBillingSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="billing-street" className="text-[9px] font-mono uppercase text-white/50">Street Address</label>
                          <input
                            id="billing-street"
                            name="billing-street"
                            type="text"
                            autoComplete="billing address-line1"
                            value={billingForm.street}
                            onChange={(e) => setBillingForm(prev => ({ ...prev, street: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="billing-neighborhood" className="text-[9px] font-mono uppercase text-white/50">Neighborhood (Optional)</label>
                          <input
                            id="billing-neighborhood"
                            name="billing-neighborhood"
                            type="text"
                            autoComplete="billing address-line2"
                            value={billingForm.neighborhood}
                            onChange={(e) => setBillingForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="billing-city" className="text-[9px] font-mono uppercase text-white/50">City</label>
                            <input
                              id="billing-city"
                              name="billing-city"
                              type="text"
                              autoComplete="billing address-level2"
                              value={billingForm.city}
                              onChange={(e) => setBillingForm(prev => ({ ...prev, city: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="billing-state" className="text-[9px] font-mono uppercase text-white/50">State / Region</label>
                            <input
                              id="billing-state"
                              name="billing-state"
                              type="text"
                              autoComplete="billing address-level1"
                              value={billingForm.state}
                              onChange={(e) => setBillingForm(prev => ({ ...prev, state: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="billing-postal-code" className="text-[9px] font-mono uppercase text-white/50">Postal Code</label>
                            <input
                              id="billing-postal-code"
                              name="billing-postal-code"
                              type="text"
                              autoComplete="billing postal-code"
                              value={billingForm.zip}
                              onChange={(e) => setBillingForm(prev => ({ ...prev, zip: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="billing-country" className="text-[9px] font-mono uppercase text-white/50">Country</label>
                            <input
                              id="billing-country"
                              name="billing-country"
                              type="text"
                              autoComplete="billing country-name"
                              value={billingForm.country}
                              onChange={(e) => setBillingForm(prev => ({ ...prev, country: e.target.value }))}
                              className="bg-[#131313] border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-[#999933] outline-none"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded mt-2 cursor-pointer border-0 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Apply Billing Preview
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. ACCOUNT DETAILS TAB */}
            {activeTab === "details" && (
              <div className="flex flex-col gap-10 sm:gap-12 animate-fade-in">

                {/* Profile Photo Card */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 md:p-8 shadow-xl">
                  <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2 mb-6">
                    <Camera className="w-4 h-4 text-[#f2f2f2]" />
                    Profile Photo
                  </h3>
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarSaving}
                      aria-busy={avatarSaving}
                      aria-label="Choose a new profile photo"
                      className="relative w-20 h-20 rounded-full border-2 border-dashed border-white/20 hover:border-[#999933] cursor-pointer overflow-hidden group transition-all bg-[#131313] flex items-center justify-center shrink-0 p-0"
                    >
                      {user.avatar && !avatarLoadFailed ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          onError={() => setAvatarLoadFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white/30">
                          {(user.firstName || user.displayName || "?")[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </button>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarSaving}
                        className="bg-[#cc6633]/15 hover:bg-[#cc6633]/30 text-[#cc6633] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded border border-[#cc6633]/30 cursor-pointer transition-all"
                      >
                        {avatarSaving ? "Saving..." : "Upload New Photo"}
                      </button>
                      {user.avatar && (
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          disabled={avatarSaving}
                          className="text-[#ffb4ab] text-xs font-medium hover:underline bg-transparent border-0 cursor-pointer text-left"
                        >
                          Remove photo
                        </button>
                      )}
                      <span className="text-[10px] text-white/30 font-mono">JPG, PNG or WEBP · Max 4MB</span>
                    </div>
                  </div>
                  <div id="avatar-upload-feedback" className="mt-4" aria-live="polite">
                    {avatarMessage && <p className="text-xs text-[#f2f2f2]">{avatarMessage}</p>}
                    {avatarError && <p role="alert" className="text-xs text-[#ffb4ab]">{avatarError}</p>}
                  </div>
                </div>

                {/* Account Details Form */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 md:p-8 shadow-xl">
                <h3 className="font-headline-md text-lg font-bold text-white mb-6">
                  Account Details
                </h3>
                <p className="-mt-4 mb-6 text-xs leading-relaxed text-white/50">
                  Name and phone changes are saved to your wholesale account.
                </p>

                {accountSuccess && (
                  <div role="status" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-4 rounded mb-6 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{accountSuccess}</span>
                  </div>
                )}

                {accountError && (
                  <div role="alert" className="bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-4 rounded mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{accountError}</span>
                  </div>
                )}

                <form onSubmit={handleAccountSubmit} className="flex flex-col gap-6">

                  {/* General Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="account-first-name" className="text-[10px] font-mono uppercase text-white/50">First Name</label>
                      <input
                        id="account-first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        maxLength={80}
                        value={accountForm.firstName}
                        onChange={handleAccountFieldChange("firstName")}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="account-last-name" className="text-[10px] font-mono uppercase text-white/50">Last Name</label>
                      <input
                        id="account-last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        maxLength={80}
                        value={accountForm.lastName}
                        onChange={handleAccountFieldChange("lastName")}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="account-display-name" className="text-[10px] font-mono uppercase text-white/50">Display Name</label>
                      <input
                        id="account-display-name"
                        name="display-name"
                        type="text"
                        autoComplete="name"
                        maxLength={160}
                        value={accountForm.displayName}
                        onChange={handleAccountFieldChange("displayName")}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                        required
                      />
                      <span className="text-[10px] text-white/40 italic">This will be how your name is shown on headers and greetings.</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="account-email" className="text-[10px] font-mono uppercase text-white/50">Partner Email Address</label>
                      <input
                        id="account-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={accountForm.email}
                        disabled
                        className="cursor-not-allowed bg-[#131313]/60 border border-white/5 rounded px-4 py-3 text-sm text-white/50 outline-none"
                      />
                      <span className="text-[10px] text-white/40 italic">Contact support to change the account email.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="account-phone" className="text-[10px] font-mono uppercase text-white/50">Phone Number</label>
                      <input
                        id="account-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        maxLength={40}
                        value={accountForm.phone}
                        onChange={handleAccountFieldChange("phone")}
                        className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="account-company" className="text-[10px] font-mono uppercase text-white/50">Company Name</label>
                      <input
                        id="account-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        value={accountForm.company}
                        disabled
                        className="bg-[#131313]/60 border border-white/5 rounded px-4 py-3 text-sm text-white/50 cursor-not-allowed outline-none"
                      />
                      <span className="text-[10px] text-white/40 italic">Contact support to change company registration.</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/10 my-2"></div>

                  {/* Password Reset */}
                  <div className="rounded border border-white/10 bg-[#131313] p-4">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#f2f2f2]" />
                      Password Security
                    </h4>
                    <p className="mb-3 text-xs leading-relaxed text-white/60">
                      Password changes are handled by the secure account recovery page.
                    </p>
                    <a
                      href="/api/auth/forgot-password"
                      className="inline-flex text-xs font-bold text-[#f2f2f2] transition-colors hover:text-white hover:underline"
                    >
                      Open secure password management
                    </a>

                    <div className="hidden" aria-hidden="true">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase text-white/50">Current Password (leave blank to leave unchanged)</label>
                        <input
                          type="password"
                          value={accountForm.currentPassword}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="••••••••"
                          className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono uppercase text-white/50">New Password</label>
                          <input
                            type="password"
                            value={accountForm.newPassword}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono uppercase text-white/50">Confirm New Password</label>
                          <input
                            type="password"
                            value={accountForm.confirmPassword}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-[#131313] border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-[#999933] outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={accountSaving}
                    aria-busy={accountSaving}
                    className="bg-[#cc6633] hover:bg-[#b6532a] disabled:cursor-wait disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all border-0 shadow-lg shadow-[#cc6633]/15 hover:shadow-[#cc6633]/30 cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    {accountSaving ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {accountSaving ? "Saving Account Details..." : "Save Account Details"}
                  </button>

                  </form>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer />

      {/* Modals for restricted access actions */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ApplicationModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
    </div>
  );
}
