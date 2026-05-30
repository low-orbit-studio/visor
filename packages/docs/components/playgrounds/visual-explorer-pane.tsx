"use client";

import type { Ref } from "react";
import { Sun, Moon, Palette, SquaresFour, Link, LinkBreak } from "@phosphor-icons/react";
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
import { THEME_GROUPS, findThemeEntry, type ColorMode } from "@/lib/theme-config";
import { SECTIONS, findSection } from "./sections";
import { useSyncedScroll } from "./use-synced-scroll";
import styles from "./visual-explorer.module.css";

interface VisualExplorerPaneProps {
  /** The module shown in BOTH panes — selection is shared, not per-pane, so the
   *  comparison is always the same section under two themes. */
  sectionId: string;
  /** This pane's own theme — independent per pane (D2). */
  theme: string;
  /** Shared color mode — drives the meta label only; the mode class lives on <html>. */
  mode: ColorMode;
  onThemeChange: (theme: string) => void;
  /** Scroll container ref, wired by {@link useSyncedScroll}. */
  scrollRef: Ref<HTMLDivElement>;
  /** Human label distinguishing the panes for assistive tech, e.g. "Left" / "Right". */
  label: string;
}

/**
 * A single comparison pane: its own theme selector over a scrollable canvas. The
 * pane carries its theme as a `${theme}-theme` class on its root, so each pane
 * resolves its own tokens independently (D2). Dark/light is inherited from the
 * global `<html>` mode class — the theme CSS scopes mode via an ancestor selector
 * (`.dark .{theme}-theme` / `html:not(.dark) .{theme}-theme`).
 */
export function VisualExplorerPane({
  sectionId,
  theme,
  mode,
  onThemeChange,
  scrollRef,
  label,
}: VisualExplorerPaneProps) {
  const section = findSection(sectionId);
  const SectionComponent = section.Component;

  return (
    <section className={`${styles.pane} ${theme}-theme`} aria-label={`${label} pane`}>
      <div className={styles.paneToolbar}>
        <div className={styles.toolbarGroup}>
          <Palette size={16} weight="duotone" className={styles.toolbarIcon} />
          <Select value={theme} onValueChange={onThemeChange}>
            <SelectTrigger size="sm" className={styles.select} aria-label={`${label} pane theme`}>
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
      </div>

      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{section.label}</h3>
        <span className={styles.sectionMeta}>
          {findThemeEntry(theme)?.label ?? theme} · {mode}
        </span>
      </div>

      <div ref={scrollRef} className={styles.paneCanvas}>
        <SectionComponent />
      </div>
    </section>
  );
}

interface DualPaneViewProps {
  /** Shared module across both panes. */
  sectionId: string;
  /** Per-pane themes, `[left, right]`. */
  themes: [string, string];
  mode: ColorMode;
  syncScroll: boolean;
  onSectionChange: (sectionId: string) => void;
  onThemeChange: (index: 0 | 1, theme: string) => void;
  onToggleMode: () => void;
  onToggleSyncScroll: () => void;
}

/**
 * The dual-pane comparison surface: a shared header (one module selector + the
 * mode and sync-scroll toggles, all governing both panes together) above two
 * independent {@link VisualExplorerPane}s that differ only by theme.
 *
 * Deliberately portal-free so it can be snapshot/rendered directly in tests; the
 * fullscreen presentation is supplied by the caller via `FullscreenOverlay`.
 */
export function DualPaneView({
  sectionId,
  themes,
  mode,
  syncScroll,
  onSectionChange,
  onThemeChange,
  onToggleMode,
  onToggleSyncScroll,
}: DualPaneViewProps) {
  const { leftRef, rightRef } = useSyncedScroll(syncScroll);

  return (
    <div className={styles.dualPane}>
      <div className={styles.dualHeader}>
        <div className={styles.toolbarGroup}>
          <SquaresFour size={16} weight="duotone" className={styles.toolbarIcon} />
          <Select value={sectionId} onValueChange={onSectionChange}>
            <SelectTrigger
              size="sm"
              className={styles.select}
              aria-label="Comparison module (both panes)"
            >
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

        <div className={styles.dualControls}>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSyncScroll}
            aria-pressed={syncScroll}
            aria-label={`Turn sync scroll ${syncScroll ? "off" : "on"}`}
            className={styles.dualControlButton}
          >
            {syncScroll ? (
              <Link size={16} weight="duotone" />
            ) : (
              <LinkBreak size={16} weight="duotone" />
            )}
            <span>Sync scroll: {syncScroll ? "On" : "Off"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMode}
            aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
            className={styles.dualControlButton}
          >
            {mode === "dark" ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
            <span>{mode === "dark" ? "Light" : "Dark"}</span>
          </Button>
        </div>
      </div>

      <div className={styles.panes}>
        <VisualExplorerPane
          sectionId={sectionId}
          theme={themes[0]}
          mode={mode}
          label="Left"
          scrollRef={leftRef}
          onThemeChange={(t) => onThemeChange(0, t)}
        />
        <VisualExplorerPane
          sectionId={sectionId}
          theme={themes[1]}
          mode={mode}
          label="Right"
          scrollRef={rightRef}
          onThemeChange={(t) => onThemeChange(1, t)}
        />
      </div>
    </div>
  );
}
