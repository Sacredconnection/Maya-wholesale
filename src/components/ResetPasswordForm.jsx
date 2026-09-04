"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import PasswordRecoveryShell from "@/components/PasswordRecoveryShell";

export default function ResetPasswordForm({ login, resetKey }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const hasResetCredentials = Boolean(login && resetKey);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (password.length < 12) {
      setError("Use a password with at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, key: resetKey, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Your password could not be updated.");
      setComplete(true);
      setPassword("");
      setConfirmation("");
    } catch (requestError) {
      setError(requestError.message || "Your password could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <PasswordRecoveryShell eyebrow="Password updated" title="Your access is restored" description="Your new password is active. You can now return to the secure partner login.">
        <div role="status" className="rounded-lg border border-[#999933]/40 bg-[#999933]/10 p-5">
          <CheckCircle2 className="mb-3 h-7 w-7 text-[#E5E791]" aria-hidden="true" />
          <p className="text-sm leading-6 text-white/80">The reset link has been used and cannot be used again.</p>
        </div>
        <Link href="/my-account?login=1&redirect=%2Fmy-account" className="mt-6 flex w-full items-center justify-center rounded-md bg-[#CC6633] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#B2592D]">
          Continue to login
        </Link>
      </PasswordRecoveryShell>
    );
  }

  return (
    <PasswordRecoveryShell eyebrow="Secure account recovery" title="Create a new password" description="Choose a strong password for your Maya wholesale account. The reset link can only be used once.">
      {!hasResetCredentials ? (
        <div>
          <div role="alert" className="flex gap-2 rounded-md border border-[#9A3232]/60 bg-[#9A3232]/15 p-4 text-sm leading-6 text-red-100">
            <ShieldAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            This password reset link is incomplete or invalid. Request a new link to continue.
          </div>
          <Link href="/forgot-password" className="mt-6 flex w-full items-center justify-center rounded-md bg-[#CC6633] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#B2592D]">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-5">
          {error && (
            <div role="alert" className="flex gap-2 rounded-md border border-[#9A3232]/60 bg-[#9A3232]/15 p-3 text-sm text-red-100">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} visible={showPassword} />
          <PasswordField id="confirm-password" label="Confirm new password" value={confirmation} onChange={setConfirmation} visible={showPassword} />

          <label className="flex cursor-pointer items-center gap-2 text-xs text-white/65">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-[#999933]" />
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            Show passwords
          </label>

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#CC6633] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#B2592D] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? "Updating password..." : "Update password"}
          </button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}

function PasswordField({ id, label, value, onChange, visible }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/65">{label}</label>
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        minLength={12}
        maxLength={256}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-white/20 bg-[#171813] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#E5E791] focus:ring-2 focus:ring-[#999933]/30"
      />
    </div>
  );
}
