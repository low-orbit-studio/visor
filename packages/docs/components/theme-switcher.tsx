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
import { THEME_GROUPS, applyTheme, getStoredTheme } from "@/lib/theme-config";
import styles from "./theme-switcher.module.css";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(getStoredTheme);

  // On mount, ensure the stored theme's default-mode (if any) is applied.
  // Without this, a refresh would leave the html color-scheme class stale.
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
