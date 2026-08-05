import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function SuggestedOrdersPreview() {
  return (
    <section
      id="suggested-orders"
      className="scroll-mt-28 overflow-hidden rounded-xl border border-[#999933] bg-white"
    >
      <div className="flex items-center justify-center p-6 md:p-8">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#999933]">
            <Sparkles className="h-4 w-4" />
            Suggested orders
          </span>
          <h2 className="mt-3 font-headline-md text-2xl font-bold text-[#2d2d2d] md:text-3xl">
            Smarter, ready-to-build wholesale orders
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#102b25]/70">
            Browse curated assortments and a personalized restock based on your
            history. Every list is checked against live inventory.
          </p>
          <Link
            href="/suggested-orders"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#cc6633] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white no-underline transition-colors hover:bg-[#f4f3e8] hover:text-[#2d2d2d]"
          >
            View suggested orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
