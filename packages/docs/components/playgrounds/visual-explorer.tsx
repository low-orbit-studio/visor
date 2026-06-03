"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sun, Moon, Palette, SquaresFour, ArrowsOut, Rows } from "@phosphor-icons/react";
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
  FullscreenOverlay,
  FullscreenOverlayContent,
} from "@/components/ui/fullscreen-overlay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  THEME_GROUPS,
  ALL_THEMES,
  applyTheme,
  applyMode,
  getStoredTheme,
  findThemeEntry,
  type ColorMode,
} from "@/lib/theme-config";
import { SECTIONS, DEFAULT_SECTION_ID, findSection } from "./sections";
import { DualPaneView } from "./visual-explorer-pane";
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

/** The theme to seed the second pane with — the next theme in the list, so the
 *  dual-pane opens on an actual cross-theme comparison rather than two identical sides. */
function nextThemeAfter(theme: string): string {
  if (ALL_THEMES.length < 2) return theme;
  const idx = ALL_THEMES.indexOf(theme);
  return ALL_THEMES[(idx + 1) % ALL_THEMES.length] ?? theme;
}

/** Track whether the viewport is below the dual-pane comfort width (D7). SSR/first
 *  render reports false; jsdom (no matchMedia) stays false. Updates live on resize. */
function useIsNarrow(maxWidth = 1200): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);
  return narrow;
}

export function VisualExplorer() {
  const [sectionId, setSectionId] = useState<string>(DEFAULT_SECTION_ID);
  const [theme, setTheme] = useState<string>("blackout");
  const [mode, setMode] = useState<ColorMode>("dark");
  const [hydrated, setHydrated] = useState(false);

  // Dual-pane fullscreen state. The module is shared across both panes; only the
  // theme is per-pane (D2), so the comparison is always the same section under two
  // themes. State is ephemeral (no localStorage — out of scope) and re-seeded from
  // the single-pane state each time fullscreen opens, so exiting leaves the single
  // pane untouched (D5).
  const [fullscreen, setFullscreen] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [dualSectionId, setDualSectionId] = useState<string>(DEFAULT_SECTION_ID);
  const [paneThemes, setPaneThemes] = useState<[string, string]>(["blackout", "blackout"]);
  const isNarrow = useIsNarrow();

  useEffect(() => {
    const initialSection = getStoredSection();
    const initialTheme = getStoredTheme();
    const initialMode = getStoredMode();
    // Resolve through findSection so stale localStorage ids (e.g. pre-VI-482 "overlay"/"overlays")
    // map back to a real section — otherwise the Select trigger renders empty for unknown values.
    const resolvedSection = findSection(initialSection).id;
    setSectionId(resolvedSection);
    if (resolvedSection !== initialSection) {
      try {
        localStorage.setItem(SECTION_STORAGE_KEY, resolvedSection);
      } catch {}
    }
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

  const openFullscreen = useCallback(() => {
    // Seed the shared module from the current single-pane section; seed the left
    // pane on the current theme and the right on the next theme, so the comparison
    // opens on two different themes (the primary use case).
    setDualSectionId(sectionId);
    setPaneThemes([theme, nextThemeAfter(theme)]);
    setFullscreen(true);
  }, [sectionId, theme]);

  const handlePaneTheme = useCallback((index: 0 | 1, value: string) => {
    setPaneThemes((prev) => (index === 0 ? [value, prev[1]] : [prev[0], value]));
  }, []);

  const toggleSyncScroll = useCallback(() => setSyncScroll((prev) => !prev), []);

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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={openFullscreen}
                aria-label="Open dual-pane compare"
                className={styles.fullscreenButton}
              >
                <ArrowsOut size={16} weight="duotone" />
                <span>Compare</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isNarrow ? "Best on widescreen" : "Compare two themes side by side"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={styles.fullscreenButton}
              >
                <Link href="/matrix" aria-label="Open all-themes matrix">
                  <Rows size={16} weight="duotone" />
                  <span>Matrix</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>One component across every theme, as rows</TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

      <FullscreenOverlay open={fullscreen} onOpenChange={setFullscreen}>
        <FullscreenOverlayContent fullbleed>
          <DualPaneView
            sectionId={dualSectionId}
            themes={paneThemes}
            mode={mode}
            syncScroll={syncScroll}
            onSectionChange={setDualSectionId}
            onThemeChange={handlePaneTheme}
            onToggleMode={toggleMode}
            onToggleSyncScroll={toggleSyncScroll}
          />
        </FullscreenOverlayContent>
      </FullscreenOverlay>

      <Toaster />
    </div>
  );
}
