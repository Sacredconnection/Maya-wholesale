import Image from "next/image";
import Link from "next/link";
import { KeyRound, LockKeyhole } from "lucide-react";

export default function PasswordRecoveryShell({ eyebrow, title, description, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171813] px-4 py-12 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "url('/patterns/maya-brand-pattern.svg')", backgroundSize: "440px" }}
      />
      <div aria-hidden="true" className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#999933]/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#CC6633]/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-[#262019]/95 p-6 shadow-2xl shadow-black/40 sm:p-10">
        <Link href="/" aria-label="Maya Herbs Wholesale home" className="mb-9 inline-block">
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Herbs Wholesale"
            width={190}
            height={72}
            priority
            className="h-auto w-40 sm:w-48"
          />
        </Link>

        <div className="mb-7">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E5E791]">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{description}</p>
        </div>

        {children}

        <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-white/50">
          <LockKeyhole className="h-4 w-4 text-[#999933]" aria-hidden="true" />
          Your password is securely managed by your wholesale account.
        </div>
      </section>
    </main>
  );
}
