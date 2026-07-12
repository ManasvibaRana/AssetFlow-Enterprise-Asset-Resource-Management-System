"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle({ labelClassName = "" }: { labelClassName?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      title="Toggle dark mode"
      className="flex w-full items-center justify-between gap-md whitespace-nowrap rounded-DEFAULT py-2 pl-[14px] pr-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
    >
      <span className="flex items-center gap-md font-label-caps text-label-caps font-semibold">
        {mounted && isDark ? (
          <Moon className="h-[18px] w-[18px] shrink-0" />
        ) : (
          <Sun className="h-[18px] w-[18px] shrink-0" />
        )}
        <span className={labelClassName}>{mounted ? (isDark ? "Dark Mode" : "Light Mode") : "Theme"}</span>
      </span>
      {/* Switch indicator */}
      <span className={`relative h-4 w-8 shrink-0 rounded-full bg-on-surface-variant/25 transition-colors dark:bg-white/20 ${labelClassName}`}>
        <span
          className={
            "absolute top-0.5 h-3 w-3 rounded-full bg-primary transition-all dark:bg-white " +
            (mounted && isDark ? "left-[18px]" : "left-0.5")
          }
        />
      </span>
    </button>
  );
}
