"use client";

import { useState } from "react";
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
const DEFAULT_THEME = "space";

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
  document.dispatchEvent(new CustomEvent("visor-theme-change"));
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(getStoredTheme);

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
