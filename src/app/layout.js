import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
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
      className={`${roboto.variable} ${roboto.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#25362D] text-[#f2f2f2]"
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
