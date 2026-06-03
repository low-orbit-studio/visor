"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SquaresFour, Palette, CircleHalf } from "@phosphor-icons/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SECTIONS, findSection } from "@/components/playgrounds/sections";
import {
  getMatrixThemeGroups,
  resolveEffectiveMode,
  isLocked,
  type ThemeSet,
  type MatrixMode,
} from "@/lib/matrix-themes";
import styles from "./matrix.module.css";

const THEME_SETS: { value: ThemeSet; label: string }[] = [
  { value: "all", label: "All themes" },
  { value: "stock", label: "Stock" },
  { value: "custom", label: "Custom" },
  { value: "private", label: "Private" },
];

const MODES: { value: MatrixMode; label: string }[] = [
  { value: "default", label: "Each theme's default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const DEFAULT_SECTION = "form"; // the BL-227 driving use case
const DEFAULT_SET: ThemeSet = "all";
const DEFAULT_MODE: MatrixMode = "default";

function parseSection(val: string | null): string {
  return val && SECTIONS.some((s) => s.id === val) ? val : DEFAULT_SECTION;
}
function parseSet(val: string | null): ThemeSet {
  return THEME_SETS.some((s) => s.value === val) ? (val as ThemeSet) : DEFAULT_SET;
}
function parseMode(val: string | null): MatrixMode {
  return MODES.some((m) => m.value === val) ? (val as MatrixMode) : DEFAULT_MODE;
}

function MatrixContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [section, setSection] = useState<string>(() => parseSection(searchParams.get("section")));
  const [themeSet, setThemeSet] = useState<ThemeSet>(() => parseSet(searchParams.get("themes")));
  const [mode, setMode] = useState<MatrixMode>(() => parseMode(searchParams.get("mode")));

  // Reflect state in the URL so a matrix configuration is shareable (mirrors
  // /compare). Only non-default params are written, keeping the base URL clean.
  useEffect(() => {
    const params = new URLSearchParams();
    if (section !== DEFAULT_SECTION) params.set("section", section);
    if (themeSet !== DEFAULT_SET) params.set("themes", themeSet);
    if (mode !== DEFAULT_MODE) params.set("mode", mode);
    const qs = params.toString();
    router.replace(qs ? `/matrix?${qs}` : "/matrix", { scroll: false });
  }, [section, themeSet, mode, router]);

  // Auto-height: each panel postMessages its rendered content height; size the
  // matching iframe to it so rows render at natural height (no inner scroll).
  const iframeRefs = useRef(new Map<string, HTMLIFrameElement>());
  const [heights, setHeights] = useState<Record<string, number>>({});
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; height?: number } | null;
      if (!data || data.type !== "matrix:row-height" || typeof data.height !== "number") return;
      for (const [slug, frame] of iframeRefs.current) {
        if (frame.contentWindow === e.source) {
          setHeights((prev) => (prev[slug] === data.height ? prev : { ...prev, [slug]: data.height! }));
          break;
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const groups = getMatrixThemeGroups(themeSet);
  const sectionLabel = findSection(section).label;
  const totalThemes = groups.reduce((n, g) => n + g.themes.length, 0);

  const registerFrame = useCallback((slug: string, el: HTMLIFrameElement | null) => {
    if (el) iframeRefs.current.set(slug, el);
    else iframeRefs.current.delete(slug);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>All-Themes Matrix</h1>
          <p className={styles.subtitle}>
            {sectionLabel} across {totalThemes} {totalThemes === 1 ? "theme" : "themes"} — one per row.
          </p>
        </div>
        <Link href="/docs/playgrounds/visual-explorer" className={styles.backLink}>
          ← Visual Explorer
        </Link>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlItem}>
          <SquaresFour size={16} weight="duotone" className={styles.controlIcon} />
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger size="sm" className={styles.select} aria-label="Component or block">
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

        <div className={styles.controlItem}>
          <Palette size={16} weight="duotone" className={styles.controlIcon} />
          <Select value={themeSet} onValueChange={(v) => setThemeSet(v as ThemeSet)}>
            <SelectTrigger size="sm" className={styles.select} aria-label="Theme set">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_SETS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.controlItem}>
          <CircleHalf size={16} weight="duotone" className={styles.controlIcon} />
          <Select value={mode} onValueChange={(v) => setMode(v as MatrixMode)}>
            <SelectTrigger size="sm" className={styles.select} aria-label="Color mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.matrix}>
        {totalThemes === 0 ? (
          <p className={styles.empty}>No themes in this set.</p>
        ) : (
          groups.map((group) => (
            <section key={group.group} className={styles.group}>
              <h2 className={styles.groupHead}>{group.group}</h2>
              {group.themes.map((theme) => {
                const effMode = resolveEffectiveMode(theme, mode);
                const locked = isLocked(theme);
                return (
                  <div key={theme.slug} className={styles.row}>
                    <div className={styles.rowMeta}>
                      <span className={styles.themeName}>{theme.label}</span>
                      <code className={styles.themeSlug}>{theme.slug}</code>
                      <span className={styles.themeMode} data-locked={locked ? "true" : "false"}>
                        {locked ? "fixed" : "adaptive"} · {effMode}
                      </span>
                    </div>
                    <iframe
                      ref={(el) => registerFrame(theme.slug, el)}
                      className={styles.rowFrame}
                      src={`/matrix/panel?theme=${encodeURIComponent(theme.slug)}&mode=${effMode}&section=${encodeURIComponent(section)}`}
                      title={`${theme.label} — ${sectionLabel} (${effMode})`}
                      loading="lazy"
                      sandbox="allow-same-origin allow-scripts"
                      style={heights[theme.slug] ? { height: `${heights[theme.slug]}px` } : undefined}
                    />
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export default function MatrixPage() {
  return (
    <Suspense>
      <MatrixContent />
    </Suspense>
  );
}
