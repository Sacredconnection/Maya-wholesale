"use client";

// Preloads the Maya Herbs catalog as soon as authentication is restored.
// Keeping this provider above the pages lets /catalog reuse the loaded data.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

const ProductsContext = createContext(null);
const CLIENT_CATALOG_TIMEOUT_MS = 35000;

export function ProductsProvider({ children }) {
  const { isLoggedIn, loading: authLoading, invalidateSession } = useAuth();
  const pathname = usePathname();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const productRequests = useRef(new Map());

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const resolveProduct = useCallback(async (product) => {
    if (!product || product.optionsLoaded) return product;
    if (productRequests.current.has(product.id)) {
      return productRequests.current.get(product.id);
    }

    const request = (async () => {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) invalidateSession();
          throw new Error(data.error || "Could not load product options.");
        }
        setProducts((currentProducts) =>
          currentProducts.map((entry) => (entry.id === data.product.id ? data.product : entry))
        );
        return data.product;
      } catch (loadError) {
        if (loadError.name === "TimeoutError") {
          throw new Error("The product options took too long to load. Please try again.");
        }
        throw loadError;
      } finally {
        productRequests.current.delete(product.id);
      }
    })();

    productRequests.current.set(product.id, request);
    return request;
  }, [invalidateSession]);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return () => {};
    // The public digital catalog owns its own complete, price-free data flow.
    // Do not preload the authenticated purchasing catalog on this route.
    if (pathname === "/digital-catalog") {
      const clearTimer = window.setTimeout(() => {
        setError("");
        setWarning("");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }
    if (!isLoggedIn) {
      const clearTimer = window.setTimeout(() => {
        setProducts([]);
        setError("");
        setWarning("");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }

    async function loadCatalog() {
      setLoading(true);
      setError("");
      setWarning("");

      try {
        const response = await fetch("/api/products", {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(CLIENT_CATALOG_TIMEOUT_MS),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) {
            invalidateSession();
            return;
          }
          throw new Error(data.error || "Could not load the Maya Herbs catalog.");
        }
        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (catalogError) {
        if (!cancelled) {
          setProducts([]);
          setError(
            catalogError.name === "TimeoutError"
              ? "The Maya Herbs catalog took too long to load. Please try again."
              : catalogError.message
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [authLoading, invalidateSession, isLoggedIn, pathname, reloadKey]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, warning, reload, resolveProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts must be used within a ProductsProvider");
  return context;
}
