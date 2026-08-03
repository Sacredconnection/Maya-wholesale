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
    <header className="site-header theme-dark-zone sticky top-0 z-50 w-full border-b-2 border-[#999933] bg-[#212121] shadow-lg shadow-black/15">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-[96rem] items-center justify-between gap-5 px-4 sm:min-h-[5.5rem] sm:px-6 2xl:min-h-24 2xl:px-8">
        {/* Logotipo (Left) */}
        <Link className="group flex self-stretch shrink-0 items-center" href="/" onClick={handleHomeClick}>
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Herbs Wholesale"
            width={494}
            height={201}
            unoptimized
            className="h-11 w-auto max-w-[10rem] transition-all duration-300 group-hover:opacity-90 sm:h-14 sm:max-w-[11rem] 2xl:h-[3.75rem] 2xl:max-w-[12rem]"
          />
        </Link>

        {/* Navigation Links (Center - Desktop Only) */}
        <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 self-stretch items-center justify-center gap-5 whitespace-nowrap text-xs font-medium tracking-wide text-white/70 font-body-md 2xl:flex">
          <Link
            className={`${pathname === '/' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#f2f2f2] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/"
            onClick={handleHomeClick}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Home
          </Link>
          <Link
            className={`${pathname === '/catalog' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#f2f2f2] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/catalog"
            aria-current={pathname === '/catalog' ? 'page' : undefined}
          >
            Wholesale Catalog
          </Link>
          {isLoggedIn && (
            <Link
              className={`${pathname === '/suggested-orders' ? 'text-white after:scale-x-100' : 'text-[#f2f2f2] after:scale-x-0 hover:text-white hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-[#f2f2f2] after:transition-transform after:duration-300 after:content-['']`}
              href="/suggested-orders"
              aria-current={pathname === '/suggested-orders' ? 'page' : undefined}
            >
              Suggested Orders
            </Link>
          )}
          <Link
            className={`${pathname === '/contact' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#f2f2f2] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
          >
            Contact
          </Link>
        </nav>

        {/* CTA Actions (Right - Desktop Only) */}
        <div className="hidden shrink-0 self-stretch items-center gap-3 whitespace-nowrap 2xl:flex">
          {/* Cart Icon Trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart${cartTotalItems > 0 ? `, ${cartTotalItems} items, $${cartTotal.toFixed(2)}` : ''}`}
            className="relative flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-3 py-2.5 text-white transition-all hover:border-white/20 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Cart · ${cartTotal.toFixed(2)}
            </span>
            {cartTotalItems > 0 && (
              <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 bg-[#999933] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-[#131313]">
                {cartTotalItems}
              </span>
            )}
          </button>

          <Link
            className={`${pathname === '/digital-catalog' ? 'border-[#f2f2f2] bg-[#999933]/25 text-white' : 'border-[#999933]/50 bg-[#999933]/10 text-[#f2f2f2] hover:border-[#f2f2f2] hover:bg-[#999933]/20 hover:text-white'} inline-flex items-center justify-center rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300`}
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
                className={`text-sm font-medium ${pathname === '/my-account' ? 'text-white border-b-2 border-[#999933]' : 'text-[#f2f2f2] hover:text-white'} pb-1 transition-colors`}
              >
                My Account
              </Link>
              <button
                type="button"
                onClick={handleHeaderLogout}
                className="bg-[#93000a]/15 hover:bg-[#93000a]/30 text-[#ffb4ab] text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-sm border border-[#93000a]/30 hover:border-[#ffb4ab]/40 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                Exit Portal
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors font-body-md bg-transparent border-0 cursor-pointer text-left"
              >
                Client Login
              </button>
              <Link
                href="/register"
                className="bg-white/10 hover:bg-white text-white hover:text-[#212121] text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-sm border border-white/10 hover:border-white transition-all duration-300 flex items-center gap-2 font-label-sm cursor-pointer no-underline"
              >
                Register Account
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Cart and Hamburger Container (Mobile Only) */}
        <div className="flex items-center gap-2.5 sm:gap-3 2xl:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart${cartTotalItems > 0 ? `, ${cartTotalItems} items, $${cartTotal.toFixed(2)}` : ''}`}
            className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-2.5 py-2.5 text-white transition-all hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2f2f2]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span className="hidden text-[9px] font-bold sm:inline">${cartTotal.toFixed(2)}</span>
            {cartTotalItems > 0 && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 bg-[#999933] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#131313]">
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
            className="rounded-sm text-white/80 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2f2f2]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute top-[100%] left-0 z-40 flex max-h-[calc(100dvh-4.5rem)] w-full flex-col gap-5 overflow-y-auto border-b border-white/10 bg-[#212121] px-4 py-6 shadow-xl backdrop-blur-md animate-fade-in sm:max-h-[calc(100dvh-5.5rem)] sm:px-6 2xl:hidden">
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
          {isLoggedIn && (
            <Link
              className={`${pathname === '/suggested-orders' ? 'text-white' : 'text-[#f2f2f2]'} text-base font-medium transition-all duration-300 hover:translate-x-1.5 hover:text-white motion-reduce:transform-none`}
              href="/suggested-orders"
              aria-current={pathname === '/suggested-orders' ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Suggested Orders
            </Link>
          )}
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
