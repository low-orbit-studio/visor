"use client";

import { useEffect, useState } from "react";
import { Palette } from "@phosphor-icons/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "./ui/select";
import { THEME_GROUPS, ALL_THEMES } from "@/lib/theme-config";
import styles from "./theme-switcher.module.css";

const STORAGE_KEY = "visor-theme";
const DEFAULT_THEME = "blackout";

function getStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ALL_THEMES.includes(stored)) return stored;
  return DEFAULT_THEME;
}

function applyTheme(theme: string) {
  const body = document.body;
  for (const t of ALL_THEMES) {
    body.classList.remove(`${t}-theme`);
  }
  body.classList.add(`${theme}-theme`);
  localStorage.setItem(STORAGE_KEY, theme);

  // If the activated theme specifies a default mode, force it on <html>
  const entry = THEME_GROUPS.flatMap((g) => g.themes).find((t) => t.value === theme);
  if (entry?.defaultMode) {
    const html = document.documentElement;
    if (entry.defaultMode === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
      html.style.colorScheme = "dark";
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
  }

  document.dispatchEvent(new CustomEvent("visor-theme-change"));
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(getStoredTheme);

  // On mount, ensure the stored theme's default-mode (if any) is applied.
  // Without this, a refresh would leave the html color-scheme class stale.
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(value: string) {
    setTheme(value);
    applyTheme(value);
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
          {THEME_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.themes.map((t) => (
                <SelectItem key={t.value} value={t.value} className={styles.groupedItem}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
