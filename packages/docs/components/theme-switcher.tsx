"use client";

import { useState, useEffect } from "react";
import { Palette } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import styles from "./theme-switcher.module.css";

const THEMES = ["space", "neutral"] as const;
type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "visor-theme";
const DEFAULT_THEME: Theme = "space";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.includes(stored as Theme)) return stored as Theme;
  return DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  const body = document.body;
  for (const t of THEMES) {
    body.classList.remove(`${t}-theme`);
  }
  body.classList.add(`${theme}-theme`);
  localStorage.setItem(STORAGE_KEY, theme);
  document.dispatchEvent(new CustomEvent("visor-theme-change"));
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  function handleChange(value: string) {
    const next = value as Theme;
    setTheme(next);
    applyTheme(next);
  }

  if (!mounted) {
    return <div className={styles.trigger} style={{ visibility: 'hidden' }} aria-hidden />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={styles.trigger} aria-label="Switch theme">
          <Palette size={16} weight="duotone" />
          <span className={styles.label}>{theme}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuRadioGroup value={theme} onValueChange={handleChange}>
          {THEMES.map((t) => (
            <DropdownMenuRadioItem key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
