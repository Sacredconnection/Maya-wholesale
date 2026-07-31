import { Jost, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import "./globals.css";

const futuraFallback = Jost({
  variable: "--font-maya-display",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const avenirFallback = Manrope({
  variable: "--font-maya-body",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://wholesale.mayaherbs.com"),
  title: "Maya Herbs Wholesale | Ethnobotanical B2B Portal",
  description:
    "Wholesale ethnobotanical herbs, plant extracts, superfoods, incense and traditional preparations for professional buyers.",
  applicationName: "Maya Herbs Wholesale",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${futuraFallback.variable} ${avenirFallback.variable} ${avenirFallback.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#171714] text-[#f2f2f2]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <BackToTop />
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
