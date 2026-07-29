import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#25362D] px-6 py-16 text-white">
      <section className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#121615] px-6 py-14 text-center shadow-2xl sm:px-12">
        <Compass aria-hidden="true" className="mx-auto mb-6 h-10 w-10 text-[#f2f2f2]" />
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#f2f2f2]">
          Error 404
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#D1D9D5]">
          The page may have moved or the address may be incorrect. Return to the
          homepage to continue exploring Maya Herbs Wholesale.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#999933] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#319786] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2f2f2]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>
      </section>
    </main>
  );
}
