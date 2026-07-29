import HomeClient from "@/components/HomeClient";

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
        url: "/banner/hero-banner.webp",
        alt: "Maya Herbs Wholesale ethnobotanical sourcing",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maya Herbs Wholesale | Ethnobotanical B2B Portal",
    description: "Ethnobotanical herbs, plant extracts, superfoods and incense for approved wholesale partners.",
    images: ["/banner/hero-banner.webp"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function Page() {
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
      <HomeClient />
    </>
  );
}
