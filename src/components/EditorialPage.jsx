import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import PublicPageShell from '@/components/PublicPageShell';

export function EditorialSection({ id, number, title, children }) {
  return (
    <section id={id} className="editorial-section scroll-mt-28 border-t border-white/10 py-10 first:border-t-0 first:pt-0 sm:py-12">
      <div className="mb-5 flex items-start gap-4">
        <span className="editorial-section-number mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#f2f2f2]/30 bg-[#999933]/10 font-label-sm text-[11px] font-bold text-[#f2f2f2]">
          {number}
        </span>
        <h2 className="type-content-title font-headline-md text-white">
          {title}
        </h2>
      </div>
      <div className="editorial-copy pl-0 text-base leading-8 text-white/65 sm:pl-12">
        {children}
      </div>
    </section>
  );
}

export function EditorialNotice({ title, children }) {
  return (
    <aside className="editorial-notice my-7 border-l-2 border-[#f2f2f2] bg-[#999933]/10 px-5 py-5 sm:px-6">
      <p className="mb-2 font-label-sm text-xs font-bold uppercase tracking-[0.16em] text-[#f2f2f2]">{title}</p>
      <div className="text-sm leading-7 text-white/65">{children}</div>
    </aside>
  );
}

export function EditorialContact({ children }) {
  return (
    <div className="editorial-contact mt-8 rounded-lg border border-[#f2f2f2]/25 bg-[#1a1a1a] p-6 sm:p-8">
      <div className="mb-3 flex items-center gap-2 font-label-sm text-xs font-bold uppercase tracking-[0.16em] text-[#f2f2f2]">
        Contact our team
      </div>
      <div className="text-base leading-7 text-white/65">{children}</div>
    </div>
  );
}

export default function EditorialPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  updated,
  navigation,
  bannerImage,
  bannerPosition = 'center',
  children,
}) {
  const bannerStyle = bannerImage
    ? {
        '--editorial-banner-image': `url("${bannerImage}")`,
        '--editorial-banner-position': bannerPosition,
      }
    : undefined;

  return (
    <PublicPageShell>
      <main>
        <header
          className="editorial-hero theme-dark-zone relative isolate overflow-hidden"
          style={bannerStyle}
        >
          <div className="site-content-shell relative py-14 sm:py-20 lg:py-24">
            <Link
              href="/"
              className="mb-12 inline-flex items-center gap-2 font-label-sm text-xs font-bold uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-[#f2f2f2]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>

            <div className="max-w-4xl">
              <div className="mb-6 flex items-center gap-3 text-[#f2f2f2]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f2f2f2]/30 bg-[#999933]/10">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="type-eyebrow font-label-sm">{eyebrow}</span>
              </div>
              <h1 className="type-page-title max-w-3xl font-headline text-white">
                {title}
              </h1>
              <p className="type-body-lead mt-7 max-w-3xl font-body-md text-white/60">
                {description}
              </p>
              {updated && (
                <div className="mt-8 flex items-center gap-2 font-label-sm text-xs uppercase tracking-[0.12em] text-white/40">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Last updated: {updated}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="editorial-content">
          <div className="site-content-shell grid gap-10 py-10 sm:gap-12 sm:py-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <article className="editorial-card min-w-0 rounded-xl border border-white/10 bg-[#1a1a1a] p-6 sm:p-10 lg:p-12">
              {children}
            </article>

            <aside className="order-first lg:order-last">
              <nav aria-label="On this page" className="editorial-toc rounded-xl border border-white/10 bg-[#1a1a1a] p-6 lg:sticky lg:top-28">
                <p className="mb-5 font-label-sm text-xs font-bold uppercase tracking-[0.18em] text-white/40">On this page</p>
                <ol className="space-y-3">
                  {navigation.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="group flex gap-3 text-sm leading-6 text-white/55 transition-colors hover:text-[#f2f2f2]"
                      >
                        <span className="font-label-sm text-[10px] font-bold text-[#f2f2f2]/70">{String(index + 1).padStart(2, '0')}</span>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
