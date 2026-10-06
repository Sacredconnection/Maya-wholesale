"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { useShelf } from "@/components/ShelfContext";
import { Menu, X, Bookmark, LogOut, ShoppingBag } from "lucide-react";
export default function Header({ onOpenLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const { cartSubtotal, cartTotalItems, setIsCartOpen } = useCart();
  const { count: shelfCount } = useShelf();
  const cartTotal = cartSubtotal * (1 - Number(user?.discountRate || 0) / 100);
  const actionClass = "header-action-button inline-flex min-h-11 items-center justify-center gap-2 rounded border border-[#999933]/45 px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#999933]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#707026]";
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);
  const closeMenu = () => setMobileMenuOpen(false);
  const handleLogo = (event) => {
    if (isLoggedIn || pathname === "/") {
      event.preventDefault(); closeMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const actions = <>
    {isLoggedIn ? <>
      <Link href="/my-shelf" onClick={closeMenu} className={actionClass}>
        <Bookmark className={"h-4 w-4 " + (shelfCount ? "fill-current" : "")} aria-hidden="true" /> My Shelf {shelfCount > 0 && "(" + shelfCount + ")"}
      </Link>
      <Link href="/my-account" onClick={closeMenu} className={actionClass}>My Account</Link>
      <button type="button" onClick={() => { closeMenu(); setIsCartOpen(true); }} className={actionClass} aria-label={"Open cart, " + cartTotalItems + " items"}>
        <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Cart · €{cartTotal.toFixed(2)}
      </button>
      <button type="button" className={actionClass} onClick={async () => { closeMenu(); await logout(); router.push("/"); router.refresh(); }}>
        <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
      </button>
    </> : <>
      <button type="button" className={actionClass} onClick={() => { closeMenu(); onOpenLogin?.(); }}>Client Login</button>
      <Link href="/register" onClick={closeMenu} className={actionClass + " bg-[#984C27] text-white hover:bg-[#7D3E20]"}>Register Account</Link>
    </>}
  </>;
  return <header className="site-header sticky top-0 z-50 w-full border-b-[6px] border-[#999933] bg-white text-[#262019] shadow-sm">
    <div className="site-content-shell flex h-20 items-center justify-between gap-5 sm:h-24 xl:h-28">
      <Link href={isLoggedIn ? pathname : "/"} onClick={handleLogo} className="shrink-0" aria-label={isLoggedIn ? "Maya Herbs — back to top" : "Maya Herbs home"}>
        <Image src="/banner/maya-wholesale/logo-maya-wholesale.svg" alt="Maya Herbs Wholesale" width={494} height={201} unoptimized className="h-12 w-auto sm:h-16 xl:h-[4.5rem]" />
      </Link>
      <nav aria-label="Primary navigation" className="hidden items-center gap-3 xl:flex">{actions}</nav>
      <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" className={actionClass + " xl:hidden"}>
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
    {mobileMenuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute top-full flex max-h-[75dvh] w-full flex-col gap-3 overflow-y-auto border-b border-[#999933] bg-white p-5 shadow-xl xl:hidden">{actions}</nav>}
  </header>;
}
