import { Roboto } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { ProductsProvider } from "@/components/ProductsContext";
import { ShelfProvider } from "@/components/ShelfContext";
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
  title: "Maya Herbs Wholesale | Ethnobotanical B2B Supply",
  description:
    "Wholesale ethnobotanical herbs, plant extracts, superfoods, incense and traditional preparations for professional buyers.",
  applicationName: "Maya Herbs Wholesale",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${roboto.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col text-[#2D2D2D]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ProductsProvider>
            <ShelfProvider>
              <CartProvider>
                {children}
                <CartDrawer />
                <BackToTop />
              </CartProvider>
            </ShelfProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
