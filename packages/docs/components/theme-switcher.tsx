"use client";

import { useState } from "react";
import { Palette } from "@phosphor-icons/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import styles from "./theme-switcher.module.css";

const THEMES = ["space", "neutral", "blackout", "reference-app", "blacklight-brand", "kaiah"] as const;
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
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  function handleChange(value: string) {
    const next = value as Theme;
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className={styles.wrapper}>
      <Select value={theme} onValueChange={handleChange}>
        <SelectTrigger size="sm" className={styles.trigger}>
          <span className={styles.triggerLabel}>
            <Palette size={16} weight="duotone" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {THEMES.map((t) => (
            <SelectItem key={t} value={t}>
              {t.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
