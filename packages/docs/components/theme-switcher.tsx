"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
import {
  THEME_GROUPS,
  applyTheme,
  getStoredTheme,
  findThemeEntry,
  COLOR_MODE_STORAGE_KEY,
} from "@/lib/theme-config";
import styles from "./theme-switcher.module.css";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(getStoredTheme);
  const { resolvedTheme, setTheme: setColorMode } = useTheme();

  // Keep visor-color-mode in sync when the user toggles via the fumadocs mode button.
  useEffect(() => {
    if (resolvedTheme === "dark" || resolvedTheme === "light") {
      try { localStorage.setItem(COLOR_MODE_STORAGE_KEY, resolvedTheme); } catch {}
    }
  }, [resolvedTheme]);

  // Keep in sync with other theme switchers on the page (e.g. Visual Explorer).
  useEffect(() => {
    const handler = () => {
      const next = getStoredTheme();
      setTheme((prev) => (prev === next ? prev : next));
    };
    document.addEventListener("visor-theme-change", handler);
    return () => document.removeEventListener("visor-theme-change", handler);
  }, []);

  function handleChange(value: string) {
    setTheme(value);
    const entry = findThemeEntry(value);
    if (entry?.defaultMode) {
      // Clear stored mode so applyTheme applies the theme's intended default,
      // and tell next-themes so it stays in sync.
      try { localStorage.removeItem(COLOR_MODE_STORAGE_KEY); } catch {}
      setColorMode(entry.defaultMode);
    }
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
