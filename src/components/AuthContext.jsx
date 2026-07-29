"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await responseJson(response);
        if (!cancelled && response.ok && data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await responseJson(response);
    if (!response.ok) throw new Error(data.error || "Invalid B2B account credentials.");
    setUser(data.user);
    setIsLoggedIn(true);
    return data.user;
  };

  const register = async (userData) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await responseJson(response);
    if (!response.ok) throw new Error(data.error || "Registration failed. Please try again.");
    return data.user;
  };

  const invalidateSession = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      invalidateSession();
    }
  };

  // API mutations return the authoritative WooCommerce customer mapped to the
  // UI shape; merge it into the active session without a full page reload.
  const updateUser = (updatedFields) => {
    setUser((currentUser) =>
      currentUser ? { ...currentUser, ...updatedFields } : currentUser
    );
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, register, logout, invalidateSession, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
