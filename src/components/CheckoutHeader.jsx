import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function CheckoutHeader() {
  return (
    <header className="brand-contrast-zone sticky top-0 z-40 border-b border-white/15 bg-[#262019]/95">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:min-h-[4.5rem] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            aria-label="Go to Maya Herbs Wholesale home"
            className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5E791]"
          >
            <Image
              src="/banner/maya-wholesale/logo-maya-wholesale.svg"
              alt="Maya Herbs Wholesale"
              width={494}
              height={201}
              priority
              unoptimized
              className="h-9 w-auto sm:h-10"
            />
          </Link>
          <div className="hidden items-center gap-2 border-l border-white/10 pl-4 text-xs font-bold text-white/65 sm:flex">
            <LockKeyhole className="h-4 w-4 text-[#E5E791]" aria-hidden="true" />
            Secure checkout
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-white/60 md:inline">Need help?</span>
          <Link
            href="/contact"
            className="rounded-sm text-xs font-bold text-[#E5E791] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5E791]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </header>
  );
}
