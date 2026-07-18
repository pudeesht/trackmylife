"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
}

/**
 * Floating light/dark toggle rendered globally from the root layout, so it is
 * available on every page. The initial `.dark` class is set before paint by the
 * inline script in the layout, so this only reflects and mutates that state.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg shadow-md transition hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
    >
      {/* Avoid a hydration mismatch: render a neutral glyph until mounted. */}
      <span suppressHydrationWarning>{mounted ? (isDark ? "☀️" : "🌙") : "🌓"}</span>
    </button>
  );
}
