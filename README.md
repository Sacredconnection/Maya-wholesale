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

| Variable | Description |
| --- | --- |
| `WOOCOMMERCE_URL` | Maya Herbs WooCommerce base URL |
| `WOOCOMMERCE_CONSUMER_KEY` | Maya Herbs REST API key with Read/Write permission |
| `WOOCOMMERCE_CONSUMER_SECRET` | Maya Herbs REST API secret |
| `WC_REVALIDATE_SECONDS` | Optional server-side catalog cache TTL (default `300`) |
| `WC_WEBHOOK_SECRET` | Shared secret for signed product and customer webhooks |
| `RESEND_API_KEY` | Resend API key used for account and lead-time emails |
| `TRANSACTIONAL_EMAIL_FROM` | Verified sender, for example `Maya Herbs Wholesale <wholesale@mayaherbs.com>` |
| `TRANSACTIONAL_EMAIL_REPLY_TO` | Reply-to address for partner emails |
| `LEAD_TIME_REQUEST_TO` | Internal sales recipient for lead-time requests (`sales@mayaherbs.com`) |
| `PORTAL_URL` | Public portal origin used by email action buttons |
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
*   **Vercel:** add all variables for Production and Preview, then redeploy.

**How it works:** [src/lib/commerce-stores.js](src/lib/commerce-stores.js) defines the server-only Maya Herbs backend. `/api/products` and `/api/catalog` load only that catalog. The cart preserves the product source, and `/api/orders` validates every item against Maya Herbs before creating the WooCommerce order. Authentication, the buyer profile, and order history remain authoritative in Maya Herbs.

Out-of-stock formats below 250g show the short production notice (1–3 days).
Formats of 250g or more show the bulk lead time (1–4 weeks) and allow an
authenticated partner to send the required quantity to the sales team. The
API reloads the current WooCommerce product before sending the email. Install
[`maya-wholesale-admin-tools-v1.3.0.zip`](maya-wholesale-admin-tools-v1.3.0.zip)
in WordPress to override the automatic policy from **Product data → Inventory**
or from an individual variation's inventory panel. A variation override takes
priority over the product-level setting.

PDF exports always bypass the WooCommerce data cache, so every generated file uses the published products, current variations, stock returned at generation time. When generated from an authenticated wholesale session, the PDF includes the customer's current price for each available format. Normal catalog browsing keeps the short `WC_REVALIDATE_SECONDS` cache for performance.

Create active WooCommerce webhooks for **Product created**, **Product updated**, **Product deleted**, **Product restored**, **Customer created**, and **Customer updated**. Use `https://YOUR_DOMAIN/api/webhooks/woocommerce` as the delivery URL and the exact `WC_WEBHOOK_SECRET` value as the secret for every webhook. Product events expire the tagged catalog cache and customer events retry the application-received email.

WordPress role changes do not trigger WooCommerce's standard **Customer updated** topic. To send the approval email when an administrator changes a portal account from `pending` to an approved category:

1. In **WP Admin → WPCode → Add Snippet → Add Your Custom Code**, create a PHP snippet named `Maya Wholesale - Role approval webhook`.
2. Paste the contents of [`integrations/wordpress/maya-wholesale-role-webhook.php`](integrations/wordpress/maya-wholesale-role-webhook.php), excluding the opening `<?php` if WPCode already supplies it. Set the insertion method to **Auto Insert**, location to **Run Everywhere**, and activate it.
3. In **WooCommerce → Settings → Advanced → Webhooks**, add an active webhook named `Maya Portal - Customer Approved`.
4. Select topic **Action** and enter `woocommerce_sacred_wholesale_customer_approved` in **Action event**.
5. Use `https://YOUR_DOMAIN/api/webhooks/woocommerce` as the delivery URL, the exact `WC_WEBHOOK_SECRET` value as the secret, and **WP REST API Integration v3** as the API version.

The action sends the WordPress user ID in WooCommerce's `arg` payload field. The portal then fetches the current customer, verifies that it originated in the wholesale portal and still has a pending approval marker, sends the approval email, and marks it as sent. Repeated deliveries therefore do not duplicate the email. Invalid webhook signatures are rejected.

The sender domain in `TRANSACTIONAL_EMAIL_FROM` must be verified in Resend before customer emails can be delivered. Configure the email variables in Vercel before activating the customer webhooks; WooCommerce may automatically disable a webhook after repeated failed deliveries.

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
