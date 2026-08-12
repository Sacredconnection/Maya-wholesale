"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/AuthContext";

const ShelfContext = createContext(null);

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function ShelfProvider({ children }) {
  const { isLoggedIn, loading: authLoading, user, invalidateSession } = useAuth();
  const [productIds, setProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!isLoggedIn) {
      const resetTimer = window.setTimeout(() => {
        setProductIds([]);
        setLoading(false);
        setSaving(false);
        setError("");
        savingRef.current = false;
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const controller = new AbortController();

    async function loadShelf() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/account/shelf", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await responseJson(response);
        if (!response.ok) {
          if (response.status === 401) invalidateSession();
          throw new Error(data.error || "My Shelf could not be loaded.");
        }
        setProductIds(Array.isArray(data.productIds) ? data.productIds : []);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setProductIds([]);
          setError(loadError.message || "My Shelf could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadShelf();
    return () => controller.abort();
  }, [authLoading, invalidateSession, isLoggedIn, user?.wcCustomerId]);

  const saveProductIds = useCallback(
    async (nextProductIds) => {
      if (!isLoggedIn || savingRef.current) return false;

      const previousProductIds = productIds;
      savingRef.current = true;
      setSaving(true);
      setError("");
      setProductIds(nextProductIds);

      try {
        const response = await fetch("/api/account/shelf", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: nextProductIds }),
        });
        const data = await responseJson(response);
        if (!response.ok) {
          if (response.status === 401) invalidateSession();
          throw new Error(data.error || "My Shelf could not be saved.");
        }
        setProductIds(Array.isArray(data.productIds) ? data.productIds : nextProductIds);
        return true;
      } catch (saveError) {
        setProductIds(previousProductIds);
        setError(saveError.message || "My Shelf could not be saved.");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [invalidateSession, isLoggedIn, productIds]
  );

  const shelfSet = useMemo(() => new Set(productIds), [productIds]);
  const isOnShelf = useCallback((productId) => shelfSet.has(productId), [shelfSet]);
  const toggleProduct = useCallback(
    (productId) => {
      if (shelfSet.has(productId)) {
        return saveProductIds(productIds.filter((id) => id !== productId));
      }
      return saveProductIds([...productIds, productId]);
    },
    [productIds, saveProductIds, shelfSet]
  );

  const value = useMemo(
    () => ({
      productIds,
      count: productIds.length,
      loading,
      saving,
      error,
      isOnShelf,
      toggleProduct,
      replaceProductIds: saveProductIds,
      clearError: () => setError(""),
    }),
    [error, isOnShelf, loading, productIds, saveProductIds, saving, toggleProduct]
  );

  return <ShelfContext.Provider value={value}>{children}</ShelfContext.Provider>;
}

export function useShelf() {
  const context = useContext(ShelfContext);
  if (!context) throw new Error("useShelf must be used within a ShelfProvider");
  return context;
}
