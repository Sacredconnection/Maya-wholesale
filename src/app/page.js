import HomeClient from "@/components/HomeClient";
import { getCategories } from "@/lib/woocommerce";

export const metadata = {
  title: "Maya Herbs Wholesale | Ethnobotanical B2B Portal",
  description: "Wholesale ethnobotanical herbs, Aya plants, Kratom, Rapéh, superfoods and incense for approved professional buyers.",
  keywords: [
    "maya herbs",
    "ethnobotanical wholesale",
    "wholesale herbs",
    "Aya plants wholesale",
    "Kratom wholesale",
    "Rapéh wholesale",
    "incense wholesale",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Maya Herbs Wholesale | Ethnobotanical B2B Portal",
    description: "A professional wholesale source for authentic ethnobotanical herbs, plant extracts, superfoods and incense.",
    type: "website",
    locale: "en_US",
    siteName: "Maya Herbs Wholesale",
    url: "https://wholesale.mayaherbs.com",
    images: [
      {
        url: "/banner/maya-wholesale/maya-wholesale-banner-desktop.webp",
        alt: "Maya Herbs Wholesale ethnobotanical sourcing",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maya Herbs Wholesale | Ethnobotanical B2B Portal",
    description: "Ethnobotanical herbs, plant extracts, superfoods and incense for approved wholesale partners.",
    images: ["/banner/maya-wholesale/maya-wholesale-banner-desktop.webp"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

const categoryDescriptionText = (description = "") =>
  description
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

async function getHomeCategories() {
  try {
    const categories = await getCategories(undefined, { parent: 0 });

    return categories
      .filter(
        (category) =>
          ![category.name, category.slug].some(
            (value) => String(value || "").trim().toLowerCase() === "cbd"
          )
      )
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: categoryDescriptionText(category.description),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    console.error("Could not load parent categories for the home page:", error);
    return [];
  }
}

export default async function Page() {
  const categories = await getHomeCategories();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://wholesale.mayaherbs.com/#organization",
      "name": "Maya Herbs Wholesale",
      "url": "https://wholesale.mayaherbs.com",
      "logo": "https://wholesale.mayaherbs.com/banner/maya-wholesale/logo-maya-wholesale.svg",
      "description": "Wholesale ethnobotanical herbs, plant extracts, superfoods and incense for approved professional buyers.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "B2B Support",
        "email": "info@mayaherbs.com"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://wholesale.mayaherbs.com/#website",
      "name": "Maya Herbs Wholesale | Ethnobotanical B2B Portal",
      "url": "https://wholesale.mayaherbs.com"
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomeClient categories={categories} />
    </>
  );
}
