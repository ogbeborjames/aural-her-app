import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "body-bestie-theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // Add transition class for smooth theme change
  root.classList.add("theme-transitioning");

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#241d2c" : "#efe6f6");

  // Remove transition class after animation completes
  setTimeout(() => {
    root.classList.remove("theme-transitioning");
  }, 350);
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }, [isDark]);

  // Prevent flash of wrong icon during SSR/hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-full",
        "border border-border/80 bg-card/75 shadow-sm backdrop-blur-md",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-all duration-300 ease-in-out",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTheme();
        }
      }}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-300 ease-in-out",
          isDark
            ? "scale-75 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100 group-hover:rotate-45 group-hover:scale-110",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-300 ease-in-out",
          isDark
            ? "scale-100 rotate-0 opacity-100 group-hover:-rotate-12 group-hover:scale-110"
            : "scale-75 -rotate-90 opacity-0",
        )}
      />
    </button>
  );
}
