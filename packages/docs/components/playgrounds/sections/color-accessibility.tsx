"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { resolveBrandStrategy } from "@/lib/theme-config";
import { useActiveTheme, type SectionProps } from "./use-active-theme";
import styles from "./color-accessibility.module.css";

// ── Contrast math (WCAG 2.1 §1.4.3, relative luminance) ─────────────────────

/**
 * Linearize an 8-bit sRGB channel value (0–255) to linear light.
 * Source: WCAG 2.1 §1.4.3 / IEC 61966-2-1.
 */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Relative luminance of an sRGB color expressed as "#rrggbb" or "rgb(r, g, b)".
 * Returns `null` when the string cannot be parsed (e.g. empty or "color-mix(…)").
 */
export function relativeLuminance(color: string): number | null {
  const trimmed = color.trim();
  if (!trimmed) return null;

  // Try parsing rgb(r, g, b) — the computed form returned by getComputedStyle.
  const rgbMatch = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(trimmed);
  if (rgbMatch) {
    const r = linearize(Number(rgbMatch[1]));
    const g = linearize(Number(rgbMatch[2]));
    const b = linearize(Number(rgbMatch[3]));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Try parsing #rrggbb (hex).
  const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(trimmed);
  if (hexMatch) {
    const r = linearize(parseInt(hexMatch[1], 16));
    const g = linearize(parseInt(hexMatch[2], 16));
    const b = linearize(parseInt(hexMatch[3], 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return null;
}

/**
 * WCAG 2.1 contrast ratio between two colors.
 * Returns `null` when either color cannot be parsed.
 */
export function contrastRatio(colorA: string, colorB: string): number | null {
  const lumA = relativeLuminance(colorA);
  const lumB = relativeLuminance(colorB);
  if (lumA === null || lumB === null) return null;
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── WCAG AA thresholds ────────────────────────────────────────────────────────

/** Minimum contrast ratio for normal-size body text (WCAG 2.1 AA). */
const AA_NORMAL_TEXT = 4.5;
/** Minimum contrast ratio for large text and UI components (WCAG 2.1 AA). */
const AA_LARGE_UI = 3.0;

/**
 * Determine the AA verdict for a contrast ratio against the lower threshold (3:1)
 * used for the pairing display — a pairing that clears 4.5:1 also clears 3:1 for
 * large text/UI. We show a single composite badge: "AA" (≥4.5:1), "AA Large"
 * (≥3:1 but <4.5:1), or "Fail" (<3:1). The intent section surfaces the per-context
 * threshold table separately.
 */
type AaVerdict = "aa" | "aa-large" | "fail";

function aaVerdict(ratio: number): AaVerdict {
  if (ratio >= AA_NORMAL_TEXT) return "aa";
  if (ratio >= AA_LARGE_UI) return "aa-large";
  return "fail";
}

// ── Token resolution ──────────────────────────────────────────────────────────

/**
 * Parse the first CSS custom-property name (e.g. `--primary`) from a pairing
 * field like `"--primary"` or `"--text-primary / --text-secondary"`. Returns
 * `null` for plain-text labels like `"fallback neutral (Gray)"`.
 */
function firstCssVar(field: string): string | null {
  const match = /(--[\w-]+)/.exec(field);
  return match ? match[1] : null;
}

/**
 * Re-read a set of CSS custom properties off `document.body` — where the active
 * theme class lives — on every theme switch and mode toggle. Mirrors the exact
 * mechanism used in `pillars.tsx` (`useResolvedTokenValues`).
 */
function useResolvedTokenValues(tokenVars: string[]): Record<string, string> {
  const key = tokenVars.join(",");
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const names = key ? key.split(",") : [];
    const read = () => {
      const style = getComputedStyle(document.body);
      const next: Record<string, string> = {};
      for (const name of names) next[name] = style.getPropertyValue(name).trim();
      setValues(next);
    };
    read();
    document.addEventListener("visor-theme-change", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", read);
    return () => {
      document.removeEventListener("visor-theme-change", read);
      observer.disconnect();
      mql.removeEventListener("change", read);
    };
  }, [key]);
  return values;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * A single color-pairing row: two swatches + live contrast ratio + AA badge.
 * Both token values are read from `resolved` — pre-fetched by the parent so the
 * token set is stable across renders and the hook is called unconditionally.
 */
function PairingRow({
  use,
  withField,
  rule,
  resolvedUse,
  resolvedWith,
}: {
  use: string;
  withField: string;
  rule: string;
  resolvedUse: string | undefined;
  resolvedWith: string | undefined;
}) {
  const useVar = firstCssVar(use);
  const withVar = firstCssVar(withField);

  const ratio = resolvedUse && resolvedWith ? contrastRatio(resolvedUse, resolvedWith) : null;
  const verdict = ratio !== null ? aaVerdict(ratio) : null;

  return (
    <Card className={styles.pairingCard} data-slot="pairing-row">
      {/* Swatch pair — the two resolved colors side-by-side */}
      <div className={styles.swatchPair} aria-hidden>
        <span
          className={styles.swatch}
          style={useVar ? ({ background: `var(${useVar})` } as CSSProperties) : undefined}
          data-slot="swatch-use"
        />
        <span
          className={styles.swatch}
          style={withVar ? ({ background: `var(${withVar})` } as CSSProperties) : undefined}
          data-slot="swatch-with"
        />
      </div>

      <CardContent className={styles.pairingContent}>
        {/* Token labels */}
        <div className={styles.tokenLabels}>
          <code className={styles.tokenLabel}>{use}</code>
          <span className={styles.tokenSep} aria-hidden>
            on
          </span>
          <code className={styles.tokenLabel}>{withField}</code>
        </div>

        {/* Live contrast ratio + AA verdict */}
        <div className={styles.verdict} data-slot="pairing-verdict">
          {ratio !== null ? (
            <>
              <span className={styles.ratio} data-slot="contrast-ratio">
                {ratio.toFixed(2)}:1
              </span>
              {verdict === "aa" && (
                <Badge variant="success" data-slot="aa-badge" data-verdict="aa">
                  AA
                </Badge>
              )}
              {verdict === "aa-large" && (
                <Badge variant="warning" data-slot="aa-badge" data-verdict="aa-large">
                  AA Large
                </Badge>
              )}
              {verdict === "fail" && (
                <Badge variant="destructive" data-slot="aa-badge" data-verdict="fail">
                  Fail
                </Badge>
              )}
            </>
          ) : (
            <Badge variant="secondary" data-slot="aa-badge" data-verdict="unresolved">
              Live color unavailable
            </Badge>
          )}
        </div>

        {/* Pairing rule */}
        <Text as="p" size="sm" color="secondary" className={styles.rule}>
          {rule}
        </Text>
      </CardContent>
    </Card>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

/**
 * The Color Usage & Accessibility Brand Workbench surface (VI-543): renders
 * Visor's allowed color pairings with live WCAG 2.1 AA contrast verdicts
 * computed from the theme's resolved token values — not static hex.
 *
 * Every competitor ships color-usage + accessibility as static PDF prose; Visor
 * reads the actual resolved token colors from `getComputedStyle(document.body)`
 * and computes contrast in the browser, so the guideline is provably true for the
 * theme on screen. Verdicts recompute on theme and mode switch.
 *
 * Composes existing Visor primitives only; contrast math is self-contained
 * (WCAG 2.1 relative luminance — no new dependency).
 */
export function ColorAccessibilitySection({ theme: themeOverride }: SectionProps = {}) {
  const theme = useActiveTheme(themeOverride);
  const strategy = resolveBrandStrategy(theme);

  // Collect every token var referenced across all pairings so the hook is called
  // unconditionally with a stable token set.
  const tokenVars: string[] = [];
  if (strategy?.colorUsage) {
    for (const pairing of strategy.colorUsage.pairings) {
      const u = firstCssVar(pairing.use);
      const w = firstCssVar(pairing.with);
      if (u && !tokenVars.includes(u)) tokenVars.push(u);
      if (w && !tokenVars.includes(w)) tokenVars.push(w);
    }
  }

  const resolved = useResolvedTokenValues(tokenVars);

  // Color usage is brand-keyed: only Visor's own (public) record ships here.
  if (!strategy) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          This theme&rsquo;s color usage is private &mdash; only Visor&rsquo;s own Brand Record is
          published here.
        </Text>
      </div>
    );
  }

  const { colorUsage, accessibility } = strategy;

  // Graceful empty state — the schema makes these optional.
  if (!colorUsage && !accessibility) {
    return (
      <div className={styles.root}>
        <Text as="p" color="secondary" className={styles.lede}>
          No color usage or accessibility data in this Brand Record.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        Allowed color pairings &mdash; each with a live WCAG 2.1 AA contrast verdict computed from
        the theme&rsquo;s actual resolved token values, not static hex. Switch theme or mode and the
        verdicts recompute against what&rsquo;s genuinely on screen.
      </Text>

      {/* Color pairings — live contrast per pairing */}
      {colorUsage && colorUsage.pairings.length > 0 && (
        <section className={styles.block} data-slot="color-usage">
          <Heading level={3} size="xs" className={styles.blockHeading}>
            Color Pairings
          </Heading>
          <div className={styles.pairingList}>
            {colorUsage.pairings.map((pairing, i) => {
              const useVar = firstCssVar(pairing.use);
              const withVar = firstCssVar(pairing.with);
              return (
                <PairingRow
                  key={i}
                  use={pairing.use}
                  withField={pairing.with}
                  rule={pairing.rule}
                  resolvedUse={useVar ? resolved[useVar] : undefined}
                  resolvedWith={withVar ? resolved[withVar] : undefined}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Accessibility targets — the WCAG thresholds the brand commits to */}
      {accessibility && (
        <section className={styles.block} data-slot="accessibility">
          <Heading level={3} size="xs" className={styles.blockHeading}>
            {accessibility.standard} Targets
          </Heading>
          <div className={styles.contrastTable} data-slot="contrast-targets">
            {accessibility.contrast.map((target, i) => (
              <div key={i} className={styles.contrastRow} data-slot="contrast-target">
                <Text as="span" size="sm" color="secondary" className={styles.contrastContext}>
                  {target.context}
                </Text>
                <Badge variant="outline" className={styles.contrastRatio} data-slot="contrast-ratio-target">
                  {target.ratio}
                </Badge>
              </div>
            ))}
          </div>
          {accessibility.intent && (
            <Text as="p" size="sm" color="tertiary" className={styles.intentText}>
              {accessibility.intent}
            </Text>
          )}
        </section>
      )}
    </div>
  );
}
