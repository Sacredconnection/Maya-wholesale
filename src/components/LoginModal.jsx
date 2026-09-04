"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Key, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { useDialogAccessibility } from '@/lib/use-dialog-accessibility';

function loginRedirectTarget() {
  const requestedPath = new URLSearchParams(window.location.search).get('redirect');
  if (!requestedPath || !requestedPath.startsWith('/') || requestedPath.startsWith('//')) {
    return '/catalog';
  }

  try {
    const target = new URL(requestedPath, window.location.origin);
    if (target.origin !== window.location.origin) return '/catalog';
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return '/catalog';
  }
}

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const emailInputRef = useRef(null);

  useDialogAccessibility(isOpen, onClose, {
    containerRef: dialogRef,
    initialFocusRef: emailInputRef,
  });

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(normalizedEmail, password);
      onClose();
      router.push(loginRedirectTarget());
    } catch (err) {
      setError(err.message || 'Invalid B2B Account credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0c0c0c]/85 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1a] shadow-2xl animate-fade-in-up sm:max-h-[calc(100dvh-2rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#999933]/15 pointer-events-none rounded-full"></div>

        {/* Close Button */}
        <button
          type="button"
          aria-label="Close login dialog"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white/70 hover:text-white flex items-center justify-center font-bold border border-white/10 hover:border-white/30 transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          aria-busy={submitting}
          className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-6"
        >
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#f2f2f2] uppercase flex items-center gap-1.5 mb-1">
              <Key className="w-3.5 h-3.5" />
              Secure Portal Access
            </span>
            <h3 id="login-title" className="font-headline-md text-2xl font-bold text-white">
              Client Login
            </h3>
          </div>

          {error && (
            <div role="alert" className="bg-[#93000a]/15 border border-[#ffb4ab]/20 text-[#ffb4ab] text-xs p-3 rounded-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                Partner Email
              </label>
              <input
                ref={emailInputRef}
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="name@company.com"
                className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="login-password" className="text-[10px] font-mono text-white/60 uppercase tracking-wider font-label-sm">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  maxLength={256}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="bg-[#131313] border border-white/10 focus:border-[#999933] text-sm text-white px-4 py-3 pr-10 rounded-sm outline-none transition-colors w-full"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-[#f2f2f2] transition-colors hover:text-white hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#cc6633] hover:bg-[#b6532a] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-lg shadow-[#cc6633]/15 hover:shadow-[#cc6633]/30 disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Access Portal'
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="px-5 sm:px-8 pb-5 sm:pb-6 text-center">
          <p className="text-xs text-white/30">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              onClick={onClose}
              className="text-[#f2f2f2] hover:text-white font-semibold transition-colors"
            >
              Register as a wholesale partner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
