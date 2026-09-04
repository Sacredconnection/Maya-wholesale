"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldAlert } from "lucide-react";
import PasswordRecoveryShell from "@/components/PasswordRecoveryShell";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Password recovery is unavailable.");
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || "Password recovery is unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PasswordRecoveryShell
      eyebrow="Secure account recovery"
      title={sent ? "Check your inbox" : "Reset your password"}
      description={sent
        ? "If a wholesale account matches that email, we have sent a secure reset link."
        : "Enter the email connected to your wholesale account. We will send you a time-limited reset link."}
    >
      {sent ? (
        <div role="status" className="rounded-lg border border-[#999933]/40 bg-[#999933]/10 p-5">
          <CheckCircle2 className="mb-3 h-7 w-7 text-[#E5E791]" aria-hidden="true" />
          <p className="text-sm leading-6 text-white/80">
            Please check your inbox and spam folder. For privacy, this confirmation is the same whether or not an account exists.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-5">
          {error && (
            <div role="alert" className="flex gap-2 rounded-md border border-[#9A3232]/60 bg-[#9A3232]/15 p-3 text-sm text-red-100">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/65">
              Partner email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-md border border-white/15 bg-[#171813] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#999933] focus:ring-2 focus:ring-[#999933]/20"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#CC6633] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#B2592D] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      )}

      <Link href="/my-account?login=1&redirect=%2Fmy-account" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#E5E791] hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to login
      </Link>
    </PasswordRecoveryShell>
  );
}
