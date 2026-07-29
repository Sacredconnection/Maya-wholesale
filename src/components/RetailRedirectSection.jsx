export default function RetailRedirectSection() {
  return (
    <section
      aria-label="Retail Store Redirection"
      className="theme-dark-zone relative isolate w-full overflow-hidden bg-[#111616] bg-[url('/banner/retail-sanctuary/retail-sanctuary-banner-mobile.webp')] bg-cover bg-center md:bg-[url('/banner/retail-sanctuary/retail-sanctuary-banner-desktop.webp')]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#131313]/88 via-[#131313]/48 to-[#131313]/8 md:bg-gradient-to-r md:from-[#131313]/90 md:via-[#131313]/65 md:to-[#131313]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-65 md:block"
      />

      <div className="relative z-10 mx-auto flex min-h-[430px] w-full max-w-7xl items-start px-4 pb-14 pt-8 sm:min-h-[380px] sm:px-6 sm:pb-16 sm:pt-10 md:items-center md:py-16 lg:min-h-[420px] lg:px-8 lg:py-20">
          <div className="mx-auto max-w-xl text-center md:mx-0 md:text-left">
            <p className="mb-3 font-label-sm text-xs font-bold uppercase tracking-[0.18em] text-[#f2f2f2]">
              Individual Orders &amp; Retail
            </p>

            <h2 className="font-headline-lg text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Shopping for yourself? Visit Maya Herbs retail.
            </h2>

            <p className="mt-5 max-w-lg font-body-md text-sm leading-7 text-neutral-300 sm:text-base">
              Browse Maya&apos;s full retail collection of herbs, plant
              extracts, superfoods, incense, Rapéh and ceremonial tools for
              individual orders.
            </p>

            <a
              href="https://mayaherbs.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Explore the Maya Herbs retail store in a new tab"
              className="absolute inset-x-4 bottom-6 mt-0 inline-flex items-center justify-center gap-2 rounded-lg border border-white bg-white px-6 py-3.5 font-label-sm text-xs font-bold uppercase tracking-[0.14em] text-[#131313] shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-[color,background-color,transform,box-shadow] duration-300 active:scale-[0.98] hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2f2f2] sm:static sm:mt-8 sm:w-auto sm:border-white/40 sm:bg-transparent sm:text-white sm:shadow-none sm:active:scale-100"
            >
              Explore Retail Store
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M8 16L16 8M10 8H16V14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
      </div>
    </section>
  );
}
