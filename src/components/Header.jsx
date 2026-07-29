"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import { useCart } from '@/components/CartContext';
import ThemeToggle from '@/components/ThemeToggle';
import { Menu, X, ArrowRight, LogOut, ShoppingBag } from 'lucide-react';

export default function Header({ onOpenLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const { cartTotalItems, setIsCartOpen } = useCart();

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
    <header className="site-header theme-dark-zone sticky top-0 z-50 w-full border-b-2 border-[#989836] bg-[#212121] shadow-lg shadow-black/15">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-7xl items-center justify-between px-4 sm:min-h-[5.5rem] sm:px-6 lg:min-h-24 lg:px-8">
        {/* Logotipo (Left) */}
        <Link className="group flex self-stretch shrink-0 items-center" href="/" onClick={handleHomeClick}>
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Herbs Wholesale"
            width={494}
            height={201}
            unoptimized
            className="h-11 w-auto transition-all duration-300 group-hover:opacity-90 sm:h-14 lg:h-[4.25rem]"
          />
        </Link>

        {/* Navigation Links (Center - Desktop Only) */}
        <nav aria-label="Primary navigation" className="hidden self-stretch items-center gap-4 text-sm font-medium tracking-wide text-white/70 xl:gap-6 font-body-md lg:flex">
          <Link
            className={`${pathname === '/' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#d8c58f] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/"
            onClick={handleHomeClick}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Home
          </Link>
          <Link className="relative inline-flex items-center justify-center py-2 leading-none hover:text-white transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:scale-x-0 after:bg-[#d8c58f] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none" href="/#tribes">
            Origins &amp; Partners
          </Link>
          <Link
            className={`${pathname === '/catalog' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#d8c58f] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/catalog"
            aria-current={pathname === '/catalog' ? 'page' : undefined}
          >
            Wholesale Catalog
          </Link>
          <Link
            className={`${pathname === '/contact' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative inline-flex items-center justify-center py-2 leading-none transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#d8c58f] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
          >
            Contact
          </Link>
        </nav>

        {/* CTA Actions (Right - Desktop Only) */}
        <div className="hidden self-stretch shrink-0 items-center gap-3 xl:gap-5 lg:flex">
          <ThemeToggle />

          {/* Cart Icon Trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open order sheet${cartTotalItems > 0 ? `, ${cartTotalItems} items` : ''}`}
            className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8c58f]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            {cartTotalItems > 0 && (
              <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 bg-[#989836] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-[#131313]">
                {cartTotalItems}
              </span>
            )}
          </button>

          <Link
            className={`${pathname === '/digital-catalog' ? 'border-[#d8c58f] bg-[#989836]/25 text-white' : 'border-[#989836]/50 bg-[#989836]/10 text-[#d8c58f] hover:border-[#d8c58f] hover:bg-[#989836]/20 hover:text-white'} inline-flex items-center justify-center rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300`}
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
                className={`text-sm font-medium ${pathname === '/my-account' ? 'text-white border-b-2 border-[#989836]' : 'text-[#d8c58f] hover:text-white'} pb-1 transition-colors`}
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
        <div className="flex items-center gap-2.5 sm:gap-3 lg:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open order sheet${cartTotalItems > 0 ? `, ${cartTotalItems} items` : ''}`}
            className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8c58f]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            {cartTotalItems > 0 && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 bg-[#989836] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#131313]">
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
            className="rounded-sm text-white/80 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c58f]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute top-[100%] left-0 z-40 flex max-h-[calc(100dvh-4.5rem)] w-full flex-col gap-5 overflow-y-auto border-b border-white/10 bg-[#212121] px-4 py-6 shadow-xl backdrop-blur-md animate-fade-in sm:max-h-[calc(100dvh-5.5rem)] sm:px-6 lg:hidden">
          <Link
            className={`${pathname === '/' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#d8c58f] hover:translate-x-1.5 motion-reduce:transform-none`}
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
            className="text-white/70 text-base font-medium transition-all duration-300 hover:text-[#d8c58f] hover:translate-x-1.5 motion-reduce:transform-none"
            href="/#tribes"
            onClick={() => setMobileMenuOpen(false)}
          >
            Origins &amp; Partners
          </Link>
          <Link
            className={`${pathname === '/catalog' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#d8c58f] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/catalog"
            aria-current={pathname === '/catalog' ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            Wholesale Catalog
          </Link>
          <Link
            className={`${pathname === '/contact' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#d8c58f] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/contact"
            aria-current={pathname === '/contact' ? 'page' : undefined}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <div className="h-px bg-white/10 my-2"></div>
          <Link
            className={`${pathname === '/digital-catalog' ? 'border-[#d8c58f] bg-[#989836]/25 text-white' : 'border-[#989836]/50 bg-[#989836]/10 text-[#d8c58f]'} rounded-sm border px-4 py-3 text-center text-sm font-bold uppercase tracking-wider transition-colors hover:border-[#d8c58f] hover:text-white`}
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
                className={`text-base font-medium ${pathname === '/my-account' ? 'text-white' : 'text-[#d8c58f] hover:text-white'} transition-colors`}
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
                className="bg-[#cc6632] hover:bg-[#b6532a] text-white text-center text-sm font-bold uppercase tracking-wider py-4 rounded-sm border-0 cursor-pointer w-full no-underline block transition-colors"
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
