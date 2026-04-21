"use client";

import { useEffect, useState, useCallback } from "react";
import { Sun, Moon, Palette, SquaresFour } from "@phosphor-icons/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toast";
import {
  THEME_GROUPS,
  applyTheme,
  applyMode,
  getStoredTheme,
  findThemeEntry,
  type ColorMode,
} from "@/lib/theme-config";
import { SECTIONS, DEFAULT_SECTION_ID, findSection } from "./sections";
import styles from "./visual-explorer.module.css";

const SECTION_STORAGE_KEY = "visor-explorer-section";
const MODE_STORAGE_KEY = "visor-explorer-mode";

function getStoredSection(): string {
  if (typeof window === "undefined") return DEFAULT_SECTION_ID;
  try {
    return localStorage.getItem(SECTION_STORAGE_KEY) ?? DEFAULT_SECTION_ID;
  } catch {
    return DEFAULT_SECTION_ID;
  }
}

function getStoredMode(): ColorMode {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function VisualExplorer() {
  const [sectionId, setSectionId] = useState<string>(DEFAULT_SECTION_ID);
  const [theme, setTheme] = useState<string>("blackout");
  const [mode, setMode] = useState<ColorMode>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initialSection = getStoredSection();
    const initialTheme = getStoredTheme();
    const initialMode = getStoredMode();
    setSectionId(initialSection);
    setTheme(initialTheme);
    setMode(initialMode);
    applyTheme(initialTheme);
    // If the theme has a forced defaultMode, let it win; otherwise restore stored mode.
    const entry = findThemeEntry(initialTheme);
    if (!entry?.defaultMode) applyMode(initialMode);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handler = () => {
      const next = getStoredTheme();
      setTheme((prev) => (prev === next ? prev : next));
    };
    document.addEventListener("visor-theme-change", handler);
    return () => document.removeEventListener("visor-theme-change", handler);
  }, []);

  const handleSection = useCallback((value: string) => {
    setSectionId(value);
    try {
      localStorage.setItem(SECTION_STORAGE_KEY, value);
    } catch {}
  }, []);

  const handleTheme = useCallback((value: string) => {
    setTheme(value);
    applyTheme(value);
    // When switching themes, if the new theme has no defaultMode, keep the user's mode preference.
    const entry = findThemeEntry(value);
    if (!entry?.defaultMode) applyMode(mode);
    else setMode(entry.defaultMode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    const next: ColorMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyMode(next);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {}
  }, [mode]);

  const section = findSection(sectionId);
  const SectionComponent = section.Component;

  return (
    <div className={styles.root} data-hydrated={hydrated ? "true" : "false"}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <SquaresFour size={16} weight="duotone" className={styles.toolbarIcon} />
          <Select value={sectionId} onValueChange={handleSection}>
            <SelectTrigger size="sm" className={styles.select}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.toolbarGroup}>
          <Palette size={16} weight="duotone" className={styles.toolbarIcon} />
          <Select value={theme} onValueChange={handleTheme}>
            <SelectTrigger size="sm" className={styles.select}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.themes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleMode}
          aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
          className={styles.modeToggle}
        >
          {mode === "dark" ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
          <span>{mode === "dark" ? "Light" : "Dark"}</span>
        </Button>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{section.label}</h2>
        <span className={styles.sectionMeta}>
          {findThemeEntry(theme)?.label ?? theme} · {mode}
        </span>
      </div>

      <div className={styles.canvas}>
        <SectionComponent />
      </div>

      <Toaster />
    </div>
  );
}
