"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { cartUnitPrice, optionPriceForUser } from "@/lib/pricing";
import { productImageForOption } from "@/lib/product-images";

const CartContext = createContext();
const MAYA_STORE_ID = "maya-herbs";

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartHydrated = useRef(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const storedCart = localStorage.getItem("sc_wholesale_cart");
        const parsedCart = storedCart ? JSON.parse(storedCart) : [];
        setCart(
          Array.isArray(parsedCart)
            ? parsedCart
                .filter((item) => !item.storeId || item.storeId === MAYA_STORE_ID)
                .map((item) => ({
                  ...item,
                  storeId: MAYA_STORE_ID,
                  storeName: "Maya Herbs",
                  cartKey: item.cartKey || `${MAYA_STORE_ID}:${item.sku}`,
                }))
            : []
        );
      } catch (error) {
        console.error("Failed to load cart from localStorage", error);
        setCart([]);
      } finally {
        cartHydrated.current = true;
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!cartHydrated.current) return;
    localStorage.setItem("sc_wholesale_cart", JSON.stringify(cart));
  }, [cart]);

  const cartItemFromSelection = (product, optionIndex, quantity) => {
    if (
      !product ||
      !Number.isInteger(optionIndex) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      return null;
    }

    const selectedOption = product.options?.[optionIndex];
    if (!selectedOption || selectedOption.inStock === false) return null;

    const storeId = product.storeId || MAYA_STORE_ID;
    if (storeId !== MAYA_STORE_ID) return null;

    const availableQuantity =
      selectedOption.stockQuantity == null
        ? null
        : Math.max(0, Math.floor(Number(selectedOption.stockQuantity)));
    if (availableQuantity === 0) return null;

    return {
      id: product.id,
      cartKey: `${storeId}:${selectedOption.sku}`,
      storeId,
      storeName: product.storeName || "Maya Herbs",
      name: product.name,
      sku: selectedOption.sku,
      optionName: selectedOption.name,
      category: product.category || "",
      price: optionPriceForUser(selectedOption, user, product.category),
      weightGrams: selectedOption.weightGrams,
      quantity: availableQuantity == null ? quantity : Math.min(quantity, availableQuantity),
      stockQuantity: availableQuantity,
      inStock: true,
      image: productImageForOption(product, selectedOption),
      wcProductId: product.wcId || null,
      wcVariationId: selectedOption.wcVariationId || null,
    };
  };

  const addSelectionsToCart = (selections) => {
    const incomingItems = (Array.isArray(selections) ? selections : [])
      .map(({ product, optionIndex, quantity = 1 }) =>
        cartItemFromSelection(product, optionIndex, Number(quantity))
      )
      .filter(Boolean);
    if (incomingItems.length === 0) return 0;

    setCart((previousCart) => {
      const nextCart = previousCart.map((item) => ({ ...item }));
      for (const incoming of incomingItems) {
        const existingItem = nextCart.find((item) => item.cartKey === incoming.cartKey);
        if (existingItem) {
          const requestedQuantity = existingItem.quantity + incoming.quantity;
          existingItem.quantity =
            incoming.stockQuantity == null
              ? requestedQuantity
              : Math.min(requestedQuantity, incoming.stockQuantity);
          existingItem.stockQuantity = incoming.stockQuantity;
          existingItem.inStock = true;
        } else {
          nextCart.push(incoming);
        }
      }
      return nextCart;
    });

    return incomingItems.length;
  };

  const addToCart = (product, optionIndex, quantity = 1) =>
    addSelectionsToCart([{ product, optionIndex, quantity }]);

  const updateQuantity = (cartKey, change) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item.cartKey !== cartKey) return item;
        const nextQuantity = item.quantity + change;
        const maximum =
          item.stockQuantity == null
            ? Number.POSITIVE_INFINITY
            : Math.max(1, Number(item.stockQuantity));
        return {
          ...item,
          quantity: Math.min(maximum, Math.max(1, nextQuantity)),
        };
      })
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((previousCart) => previousCart.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => setCart([]);

  const removeItemsByStore = (storeIds) => {
    const selectedStores = new Set(storeIds);
    setCart((previousCart) =>
      previousCart.filter((item) => !selectedStores.has(item.storeId))
    );
  };

  const cartTotalItems = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartTotalWeightGrams = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + (item.weightGrams || 0) * item.quantity,
        0
      ),
    [cart]
  );

  const pricedCart = useMemo(
    () =>
      cart.map((item) => ({
        ...item,
        price: cartUnitPrice(item, user, cartTotalWeightGrams),
      })),
    [cart, user, cartTotalWeightGrams]
  );

  const cartSubtotal = useMemo(
    () =>
      pricedCart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [pricedCart]
  );

  return (
    <CartContext.Provider
      value={{
        cart: pricedCart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        addSelectionsToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        removeItemsByStore,
        cartSubtotal,
        cartTotalItems,
        cartTotalWeightGrams,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
