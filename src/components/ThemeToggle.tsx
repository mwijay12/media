"use client";

import { useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Dark-mode toggle. The initial theme is applied before paint by an inline
 * script in the root layout (see layout.tsx); this component keeps the toggle
 * in sync with the current state and persists the choice.
 */

const STORAGE_KEY = "mlh-theme";

export function ThemeToggle() {
  // Read the class set by the pre-paint script lazily: on the client this is
  // correct from the very first render (no effect/flash); on the server we
  // fall back to null (undecided) until hydration.
  const [dark, setDark] = useState<boolean | null>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : null,
  );

  function toggle() {
    const next = !(dark ?? false);
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage can be unavailable (private mode) — the toggle still works.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark ?? false}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {dark ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
    </button>
  );
}
