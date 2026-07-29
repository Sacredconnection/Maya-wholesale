"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "maya-wholesale-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    };

    const frame = requestAnimationFrame(syncTheme);
    window.addEventListener("maya-theme-change", syncTheme);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("maya-theme-change", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The theme still works when browser storage is unavailable.
    }

    setTheme(nextTheme);
    window.dispatchEvent(new Event("maya-theme-change"));
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Use dark theme" : "Use light theme"}
      aria-pressed={isLight}
      title={isLight ? "Dark theme" : "Light theme"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all duration-300 hover:border-[#d8c58f]/50 hover:bg-white/10 hover:text-[#d8c58f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8c58f] cursor-pointer"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
