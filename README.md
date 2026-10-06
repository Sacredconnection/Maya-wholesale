# Maya Herbs Wholesale

Welcome to **Maya Herbs Wholesale**. This Next.js application serves approved retailers, practitioners and distributors sourcing ethnobotanical herbs, Aya plants, Kratom, Rapéh, superfoods, incense and related botanical products.

---

## 🚀 Key Features

*   **Custom B2B Onboarding Flow:** An interactive, multi-step application wizard for retail stores, clinics, and facilitators to request wholesale accounts.
*   **Dynamic Product Catalog:** Live inventory simulation displaying product categories, tribal lineages, custom pricing tiers, weight options (5g sample to 1kg bulk), and live weight-based pricing calculations.
*   **Wholesale Cart & Checkout:** Persistent drawer-based cart with dynamic summaries, subtotal calculations, weight details, and a streamlined client-only checkout.
*   **NGO Integration (Conexão Ancestral):** A bespoke page section supporting the Conexão Ancestral NGO with high-quality visual assets, dynamic 5-photo collage mosaic, custom brand styling, and high-performance SVG watermarks.
*   **Client Dashboard (My Account):** A personalized client area detailing current B2B account limits, approved discount rates, shipping/billing records, and order history.

---

## 🛠️ Technology Stack

*   **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
*   **Runtime Library:** [React 19](https://react.dev/)
*   **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS
*   **Icons Library:** [Lucide React](https://lucide.dev/)
*   **State Management:** React Context API ([AuthContext](src/components/AuthContext.jsx), [CartContext](src/components/CartContext.jsx))

---

## 📂 Project Architecture

```bash
├── public/
│   ├── banner/        # Homepage and carousel banners
│   ├── ngo/           # Conexão Ancestral NGO assets (logo, watermark, collage)
│   ├── products/      # Product images organized by tribe/category
│   └── tribes/        # Tribal portrait visual cards
├── src/
│   ├── app/           # Next.js App Router (Layouts & Pages)
│   │   ├── catalog/   # Wholesale Catalog Page
│   │   ├── my-account/# Client Dashboard Profile Page
│   │   ├── product/   # Dynamic Product Details Page ([id])
│   │   ├── register/  # Onboarding/Registration Page
│   │   └── globals.css# Tailwind v4 configuration & Global styling
│   ├── components/    # Reusable React UI Components
│   │   ├── AuthContext.jsx # LocalStorage Authentication Context
│   │   ├── CartContext.jsx # LocalStorage Cart state provider
│   │   ├── NGOSection.jsx  # Customized NGO block with mosaic and watermark
│   │   └── ...
│   └── data/
│       └── products.js# Centralized product catalog mock data
```

---

## 💻 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   npm or yarn

### Installation

1. Clone or download the repository.
2. Open your terminal in the project root directory.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally (Development)

Start the local development server with Turbopack enabled:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Headless WooCommerce Backend

The catalog is sourced exclusively from Maya Herbs. Configuration is entirely server-side through environment variables (see [.env.example](.env.example)):

Production uses two separate HTTPS origins:

- Public Next.js portal: `https://wholesale.mayaherbs.com`
- WordPress/WooCommerce backend: `https://backend-wholesale.mayaherbs.com`

The browser calls same-origin `/api/...` routes on the public portal. Those
Route Handlers contact WordPress server-to-server, so the backend URL must not
be exposed through a `NEXT_PUBLIC_` variable and browser CORS is not required.

| Variable | Description |
| --- | --- |
| `WOOCOMMERCE_URL` | WordPress/WooCommerce backend URL: `https://backend-wholesale.mayaherbs.com` |
| `WOOCOMMERCE_CONSUMER_KEY` | Maya Herbs REST API key with Read/Write permission |
| `WOOCOMMERCE_CONSUMER_SECRET` | Maya Herbs REST API secret |
| `WC_REVALIDATE_SECONDS` | Optional server-side catalog cache TTL (default `300`) |
| `WC_WEBHOOK_SECRET` | Shared secret for signed product and customer webhooks |
| `RESEND_API_KEY` | Resend API key used for account and lead-time emails |
| `TRANSACTIONAL_EMAIL_FROM` | Verified sender, for example `Maya Herbs Wholesale <wholesale@mayaherbs.com>` |
| `TRANSACTIONAL_EMAIL_REPLY_TO` | Reply-to address for partner emails |
| `APPLICATION_NOTIFICATION_TO` | Internal recipient for new wholesale applications (defaults to `sales@mayaherbs.com`) |
| `LEAD_TIME_REQUEST_TO` | Internal sales recipient for lead-time requests (`sales@mayaherbs.com`) |
| `PORTAL_URL` | Public portal origin used by email action buttons: `https://wholesale.mayaherbs.com` |
| `SESSION_SECRET` | Required random secret (minimum 32 characters) used to sign authentication cookies |

*   **Local dev:** copy `.env.example` to `.env.local` and fill in the Maya Herbs keys (WP Admin → WooCommerce → Settings → Advanced → REST API).

For local UI access without a WordPress customer, set
`LOCAL_DEV_LOGIN_ENABLED=true`, `LOCAL_DEV_LOGIN_EMAIL` and
`LOCAL_DEV_LOGIN_PASSWORD` in `.env.local`. This development account is
accepted only on localhost, is always disabled in production, and has
read-only portal access: orders and account changes remain blocked. Set
`LOCAL_DEV_AUTO_LOGIN=true` to create the local session automatically and
open protected pages without the sign-in screen.

To keep the digital catalog available while the WooCommerce API is temporarily
blocked or offline, run `npm run catalog:snapshot` after the live catalog has
loaded once. Development automatically falls back to
`tmp/catalog-snapshot.json`; set `CATALOG_SNAPSHOT_PATH` to use another file.
*   **Vercel:** set `WOOCOMMERCE_URL` to exactly `https://backend-wholesale.mayaherbs.com` and `PORTAL_URL` to exactly `https://wholesale.mayaherbs.com` for Production (and Preview when applicable). Do not use HTTP. Regenerate a WooCommerce REST API key with **Read/Write** permission if the previous `WOOCOMMERCE_CONSUMER_KEY` / `WOOCOMMERCE_CONSUMER_SECRET` pair was not preserved by the migration, then redeploy so the security policy is rebuilt with the new origin.

**How it works:** [src/lib/commerce-stores.js](src/lib/commerce-stores.js) defines the server-only Maya Herbs backend. `/api/products` and `/api/catalog` load only that catalog. The cart preserves the product source, and `/api/orders` validates every item against Maya Herbs before creating the WooCommerce order. Authentication, the buyer profile, and order history remain authoritative in Maya Herbs.

Out-of-stock formats below 250g show the short production notice (1–3 days).
Formats of 250g or more show the bulk lead time (1–4 weeks) and allow an
authenticated partner to send the required quantity to the sales team. The
API reloads the current WooCommerce product before sending the email. Install
Install [`maya-wholesale-core.zip`](maya-wholesale-core.zip). This flat archive
is compatible with hosts that create the plugin directory from the ZIP name.
It combines the administrative wholesale tools and branded Next.js password
recovery. Keep all legacy Maya wholesale plugin copies deactivated.
in WordPress to override the automatic policy from **Product data → Inventory**
or from an individual variation's inventory panel. A variation override takes
priority over the product-level setting.

PDF exports always bypass the WooCommerce data cache, so every generated file uses the published products, current variations, stock returned at generation time. When generated from an authenticated wholesale session, the PDF includes the customer's current price for each available format. Normal catalog browsing keeps the short `WC_REVALIDATE_SECONDS` cache for performance.

Create active WooCommerce webhooks for **Product created**, **Product updated**, **Product deleted**, **Product restored**, **Customer created**, and **Customer updated**. Use `https://wholesale.mayaherbs.com/api/webhooks/woocommerce` as the delivery URL and the exact `WC_WEBHOOK_SECRET` value as the secret for every webhook. Product events expire the tagged catalog cache and customer events retry the application-received email.

New portal accounts receive the real `pending` role and pending approval
metadata. Access requires explicit approval in WordPress; a default `customer`
role alone never grants portal access. Manual approval synchronizes
`sc_approval_status`, `maya_account_status` and New User Approve `pw_user_status`.

1. Upload [`maya-wholesale-core.zip`](maya-wholesale-core.zip) in **WP Admin → Plugins → Add Plugin → Upload Plugin** and activate it.
2. Deactivate older Maya approval snippets or the standalone Admin Tools plugin before enabling Core; the two Maya plugins should not run together.
3. In **WooCommerce → Settings → Advanced → Webhooks**, add an active webhook named `Maya Portal - Customer Approved`.
4. Select topic **Action** and enter `woocommerce_sacred_wholesale_customer_approved` in **Action event**.
5. Use `https://wholesale.mayaherbs.com/api/webhooks/woocommerce` as the delivery URL, the exact `WC_WEBHOOK_SECRET` value as the secret, and **WP REST API Integration v3** as the API version.

Administrators can approve a pending account by changing its role, using the
row action **Approve as Customer**, or selecting **Approve as Customer** from
the bulk actions menu in WordPress. Profile updates and plugin upgrades never
approve applications. Existing portal accounts with unresolved approval markers
are returned to Pending approval during the upgrade. Previously approved records
are retained; accounts incorrectly approved by older versions require manual review.
The
action webhook sends the approval email once; repeated deliveries are
idempotent and invalid signatures are rejected.

The sender domain in `TRANSACTIONAL_EMAIL_FROM` must be verified in Resend before customer emails can be delivered. Configure the email variables in Vercel before activating the customer webhooks; WooCommerce may automatically disable a webhook after repeated failed deliveries.

After a domain migration, also verify that WordPress Address, Site Address,
media URLs, and payment gateway return/callback URLs use
`https://backend-wholesale.mayaherbs.com`. Webhook delivery stays on the public
portal URL above because its receiver is a Next.js Route Handler.

> Product route IDs combine store ID and WooCommerce slug, so equal slugs and SKUs can coexist across the two catalogs. Digital-catalog filters use real WooCommerce categories, subcategories, and product attributes, and only expose combinations that still return products.

### Building for Production

Compile the production bundle:
```bash
npm run build
```
Start the production server:
```bash
npm run start
```

---

## B2B Authentication

Authentication is verified against WordPress/WooCommerce. The application then
stores only a signed, short-lived session in an `HttpOnly` cookie; passwords and
authentication state are never stored in browser `localStorage`.


### Security update: registration and authentication

Install **Maya Wholesale Core 1.0.3** from [maya-wholesale-core-v1.0.3.zip](maya-wholesale-core-v1.0.3.zip) before deploying the updated portal. Keep Core and standalone Admin Tools mutually exclusive. Admin Tools 1.4.3 includes the shared counters and session revocation, but Core is the recommended package because it also provides the password-recovery bridge.

Configure existing server secrets `WP_ADMIN_USER`, `WP_APP_PASSWORD` (administrator with `manage_options`), `SESSION_SECRET`, WooCommerce credentials and transactional email. These values stay server-side. Authentication and protected write endpoints return 503 if the shared rate-limit service is missing or unavailable; they never silently disable throttling.

Registration returns HTTP 202 and the same public body for new, existing and backend-rejected accounts. Next.js `after()` processes creation and sends the appropriate email after the response. It has a 120-second route budget and relies on the hosting platform's support for `after`/`waitUntil`; this is not a durable queue. Monitor processing failures and mail delivery. New users remain pending; changing their role from pending to customer in WordPress still grants approval.

The shared WordPress counters use atomic database writes. Per-client/per-account limits are: registration 10/3 per 15 minutes, login 40/10 per 15 minutes, recovery 10/3 per 15 minutes, reset 30/10 per 15 minutes, avatar 30/10 per 15 minutes, lead-time requests 30/5 per minute and orders 60/20 per 15 minutes. Expired counters are removed by the daily `maya_wholesale_security_cleanup` WP-Cron event. Ensure WP-Cron is running.

Vercel's protected client-IP header is used automatically. For other hosts, configure `TRUSTED_CLIENT_IP_HEADER` only when the reverse proxy overwrites it and direct access to the application is blocked. Without a trusted valid IP, requests share a conservative bucket. Account identifiers and IPs are HMAC-hashed before being sent to the limiter.

Every account-backed route rechecks identity, approval and the session version. Password changes/reset in WordPress revoke previous portal cookies. The development-only login remains disabled in production. Photo uploads and webhook bodies are capped while streaming; photos are decoded and re-encoded before storage.

Run `npm test`, `npm run lint`, `npm run build`, and `npm audit`. Set `PHP_BINARY` to a PHP executable to include the PHP hook tests (otherwise those tests explicitly skip). The ExcelJS-scoped UUID override retains its v4 API and is covered by an XLSX export/read regression.

See [the security review](docs/security-review-2026-09-08.md) for findings, verification and remaining limitations.
