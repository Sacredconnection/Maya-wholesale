"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import { useCart } from '@/components/CartContext';
import { Menu, X, ArrowRight, LogOut, ShoppingBag } from 'lucide-react';

export default function Header({ onOpenLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const { cartSubtotal, cartTotalItems, setIsCartOpen } = useCart();
  const cartTotal =
    cartSubtotal * (1 - (isLoggedIn ? Number(user?.discountRate || 0) : 0) / 100);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleHomeClick = (e) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHeaderLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="site-header sticky top-0 z-50 w-full border-t border-[#2d2d2d] bg-white text-[#1e1e1e] shadow-[0_8px_24px_rgba(45,45,45,0.08)]">
      <div className="site-content-shell flex h-20 items-center justify-between gap-5 sm:h-24 xl:h-28 xl:gap-7">
        {/* Logotipo (Left) */}
        <Link className="group flex self-stretch shrink-0 items-center" href="/" onClick={handleHomeClick}>
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Herbs Wholesale"
            width={494}
            height={201}
            unoptimized
            className="h-12 w-auto transition-opacity duration-300 group-hover:opacity-85 sm:h-16 xl:h-[4.5rem]"
          />
        </Link>

        {/* Navigation Links (Center - Desktop Only) */}
        <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 self-stretch items-center justify-center gap-5 whitespace-nowrap text-[0.9375rem] font-semibold tracking-[0.01em] text-[#2d2d2d]/75 font-body-md xl:flex 2xl:gap-7">
          <Link
            className={`${pathname === '/' ? 'text-[#2d2d2d] after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-3 leading-none transition-colors duration-300 after:absolute after:bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-center after:transition-transform after:duration-300 after:content-['']`}
            href="/"
            onClick={handleHomeClick}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Home
          </Link>
          <Link
            className={`${pathname === '/catalog' ? 'text-[#2d2d2d] after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-3 leading-none transition-colors duration-300 after:absolute after:bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-center after:transition-transform after:duration-300 after:content-['']`}
            href="/catalog"
            aria-current={pathname === '/catalog' ? 'page' : undefined}
          >
            Wholesale Catalog
          </Link>
          <Link
            className={`${pathname === '/contact' ? 'text-[#2d2d2d] after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-3 leading-none transition-colors duration-300 after:absolute after:bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-center after:transition-transform after:duration-300 after:content-['']`}
            href="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
          >
            Contact
          </Link>
        </nav>

        {/* CTA Actions (Right - Desktop Only) */}
        <div className="hidden shrink-0 items-center justify-center gap-4 self-stretch xl:flex">
          {/* Cart Icon Trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open order sheet${cartTotalItems > 0 ? `, ${cartTotalItems} items` : ''}`}
            className="header-action-button header-cart-button header-desktop-outline-button relative order-4 flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded border px-2.5 text-[#2d2d2d] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#999933]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="header-cart-label whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.07em]">
              Cart · ${cartTotal.toFixed(2)}
            </span>
            {cartTotalItems > 0 && (
              <span aria-hidden="true" className="header-cart-count absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {cartTotalItems}
              </span>
            )}
          </button>

          <Link
            className={`${pathname === '/digital-catalog' ? 'border-[#999933] bg-[#999933]/20' : 'border-[#999933]/45 bg-[#999933]/10 hover:border-[#999933] hover:bg-[#999933]/15'} header-action-button order-1 inline-flex h-9 items-center justify-center rounded border px-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#2d2d2d] transition-colors duration-300`}
            href="/digital-catalog"
            aria-current={pathname === '/digital-catalog' ? 'page' : undefined}
          >
            Digital Catalog
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/my-account"
                aria-current={pathname === '/my-account' ? 'page' : undefined}
                className={`order-2 px-2 py-3 text-[0.9375rem] font-semibold ${pathname === '/my-account' ? 'border-b-2 border-[#999933]' : ''} transition-colors`}
              >
                My Account
              </Link>
              <button
                type="button"
                onClick={handleHeaderLogout}
                className="header-action-button header-desktop-outline-button order-3 flex h-9 cursor-pointer items-center gap-1.5 rounded border border-[#93000a]/25 bg-[#93000a]/10 px-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#93000a] transition-colors duration-300 hover:border-[#93000a]/45 hover:bg-[#93000a]/15"
              >
                Exit Portal
                <LogOut className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenLogin}
                className="header-action-button header-login-button order-2 flex h-9 cursor-pointer items-center rounded border border-[#2d2d2d]/20 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.09em] text-[#2d2d2d] transition-colors duration-300 hover:border-[#999933]/70 hover:bg-[#f7f7f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#999933] font-label-sm"
              >
                Client Login
              </button>
              <Link
                href="/register"
                className="header-action-button order-3 flex h-9 cursor-pointer items-center gap-1.5 rounded border border-[#cc6633] bg-[#cc6633] px-3 text-[10px] font-bold uppercase tracking-[0.09em] text-white no-underline transition-colors duration-300 hover:border-[#b6532a] hover:bg-[#b6532a] font-label-sm"
              >
                Register Account
                <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Cart and Hamburger Container (Mobile Only) */}
        <div className="flex items-center gap-2.5 sm:gap-3 xl:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open order sheet${cartTotalItems > 0 ? `, ${cartTotalItems} items` : ''}`}
            className="header-cart-button relative flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded border px-3 text-[#2d2d2d] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#999933]"
          >
            <ShoppingBag className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            <span className="header-cart-label hidden text-xs font-bold sm:inline">${cartTotal.toFixed(2)}</span>
            {cartTotalItems > 0 && (
              <span aria-hidden="true" className="header-cart-count absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {cartTotalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded border border-[#2d2d2d]/15 text-[#2d2d2d] transition-colors hover:border-[#999933] hover:text-[#999933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#999933]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="h-1.5 w-full bg-[#999933]" />

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute left-0 top-[100%] z-40 flex max-h-[calc(100dvh-6rem)] w-full flex-col gap-5 overflow-y-auto border-b border-[#999933] bg-[#2d2d2d] px-4 py-6 shadow-xl animate-fade-in sm:max-h-[calc(100dvh-7rem)] sm:px-6 xl:hidden">
          <Link
            className={`${pathname === '/' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#f2f2f2] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleHomeClick(e);
            }}
          >
            Home
          </Link>
          <Link
            className={`${pathname === '/catalog' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#f2f2f2] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/catalog"
            aria-current={pathname === '/catalog' ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            Wholesale Catalog
          </Link>
          <Link
            className={`${pathname === '/contact' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#f2f2f2] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <div className="h-px bg-white/10 my-2"></div>
          <Link
            className={`${pathname === '/digital-catalog' ? 'border-[#f2f2f2] bg-[#999933]/25 text-white' : 'border-[#999933]/50 bg-[#999933]/10 text-[#f2f2f2]'} rounded-sm border px-4 py-3 text-center text-sm font-bold uppercase tracking-wider transition-colors hover:border-[#f2f2f2] hover:text-white`}
            href="/digital-catalog"
            aria-current={pathname === '/digital-catalog' ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            Open Digital Catalog
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/my-account"
                aria-current={pathname === '/my-account' ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium ${pathname === '/my-account' ? 'text-white' : 'text-[#f2f2f2] hover:text-white'} transition-colors`}
              >
                My Account
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleHeaderLogout();
                }}
                className="flex items-center gap-2 text-left text-[#ffb4ab] text-base font-medium py-2 bg-transparent border-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Exit Portal
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="text-left text-white/80 hover:text-white text-base font-medium py-2 bg-transparent border-0 cursor-pointer"
              >
                Client Login
              </button>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-center text-sm font-bold uppercase tracking-wider py-4 rounded-sm border-0 cursor-pointer w-full no-underline block transition-colors"
              >
                Register Account
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
