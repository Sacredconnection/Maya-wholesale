"use client";

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { optionPriceForUser, cartUnitPrice } from '@/lib/pricing';

const CartContext = createContext();
const MAYA_STORE_ID = "maya-herbs";

export function CartProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartHydrated = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const storedCart = localStorage.getItem('sc_wholesale_cart');
        const parsedCart = storedCart ? JSON.parse(storedCart) : [];
        setCart(
          Array.isArray(parsedCart)
            ? parsedCart
                .filter(
                  (item) =>
                    !item.storeId || item.storeId === MAYA_STORE_ID
                )
                .map((item) => ({
                  ...item,
                  storeId: MAYA_STORE_ID,
                  storeName: "Maya Herbs",
                  cartKey:
                    item.cartKey ||
                    `${MAYA_STORE_ID}:${item.sku}`,
                }))
            : []
        );
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
        setCart([]);
      } finally {
        cartHydrated.current = true;
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!cartHydrated.current) return;
    localStorage.setItem('sc_wholesale_cart', JSON.stringify(cart));
  }, [cart]);

  // Add to cart helper
  const addToCart = (product, optionIndex, quantity = 1) => {
    if (quantity <= 0) return;
    const selectedOption = product.options[optionIndex];
    if (!selectedOption) return;

    setCart((prevCart) => {
      const storeId = product.storeId || MAYA_STORE_ID;
      if (storeId !== MAYA_STORE_ID) return prevCart;
      const cartKey = `${storeId}:${selectedOption.sku}`;
      const existingItemIndex = prevCart.findIndex((item) => item.cartKey === cartKey);

      if (existingItemIndex > -1) {
        // Update existing item quantity immutably
        return prevCart.map((item, idx) => {
          if (idx === existingItemIndex) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        // Add new item
        return [
          ...prevCart,
          {
            id: product.id,
            cartKey,
            storeId,
            storeName: product.storeName || "Maya Herbs",
            name: product.name,
            sku: selectedOption.sku,
            optionName: selectedOption.name,
            // Category picks the progressive tier table (indigenous/shamanic)
            category: product.category || "",
            // Price for the buyer's access level (role-based pricing)
            price: optionPriceForUser(selectedOption, user, product.category),
            weightGrams: selectedOption.weightGrams,
            quantity: quantity,
            image: product.image,
            // WooCommerce ids (present when the item came from the live
            // catalog) — used to register the order via /api/orders.
            wcProductId: product.wcId || null,
            wcVariationId: selectedOption.wcVariationId || null
          }
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (cartKey, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.quantity + change;
            return { ...item, quantity: Math.max(1, nextQty) };
          }
          return item;
        })
    );
  };

  // Remove item from cart
  const removeFromCart = (cartKey) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartKey !== cartKey));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  const removeItemsByStore = (storeIds) => {
    const selectedStores = new Set(storeIds);
    setCart((prevCart) => prevCart.filter((item) => !selectedStores.has(item.storeId)));
  };

  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartTotalWeightGrams = useMemo(() => {
    return cart.reduce((total, item) => total + (item.weightGrams || 0) * item.quantity, 0);
  }, [cart]);

  // Effective prices: New Customer items are re-rated by the total order
  // weight tier (progressive per-gram pricing); other levels keep the price
  // captured when the item was added.
  const pricedCart = useMemo(() => {
    return cart.map((item) => ({
      ...item,
      price: cartUnitPrice(item, user, cartTotalWeightGrams),
    }));
  }, [cart, user, cartTotalWeightGrams]);

  const cartSubtotal = useMemo(() => {
    return pricedCart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [pricedCart]);

  return (
    <CartContext.Provider value={{
      cart: pricedCart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      removeItemsByStore,
      cartSubtotal,
      cartTotalItems,
      cartTotalWeightGrams
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
