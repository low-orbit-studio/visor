"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_THEME,
  findThemeEntry,
  getStoredTheme,
  resolveBrand,
  type BrandVariantAsset,
} from "@/lib/theme-config";
import styles from "./brand.module.css";

type VariantKey = "logo" | "brandmark" | "wordmark" | "monochrome" | "animated";

const BASE_VARIANTS: Array<{ key: VariantKey; label: string }> = [
  { key: "logo", label: "Logo" },
  { key: "brandmark", label: "Brandmark" },
  { key: "wordmark", label: "Wordmark" },
  { key: "monochrome", label: "Monochrome" },
];

// Representative display heights — intentional preview sizing, not spacing tokens.
const SIZES = [
  { id: "sm", height: "1.5rem" },
  { id: "lg", height: "3rem" },
];

// Token colors that tint the monochrome mark, proving brand+token cohesion.
// These re-resolve when the mode toggle flips the <html> class (per-mode swap, for free).
const TINT_TOKENS = ["--text-primary", "--text-secondary", "--primary"];

/** Track the active theme via the same `visor-theme-change` event the explorer dispatches. */
function useActiveTheme(): string {
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);
  useEffect(() => {
    setTheme(getStoredTheme());
    const handler = () => setTheme(getStoredTheme());
    document.addEventListener("visor-theme-change", handler);
    return () => document.removeEventListener("visor-theme-change", handler);
  }, []);
  return theme;
}

/** Track `prefers-reduced-motion` so the animated mark falls back to a static frame (D4). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function BrandSection() {
  const theme = useActiveTheme();
  const reducedMotion = useReducedMotion();
  const brand = resolveBrand(theme);
  const themeLabel = findThemeEntry(theme)?.label ?? theme;

  // The animated slot is optional — only surface it when the active theme
  // declares one (D2). Stock themes render the four standard variants.
  const variants: Array<{ key: VariantKey; label: string }> = brand.animated
    ? [...BASE_VARIANTS, { key: "animated", label: "Animated" }]
    : BASE_VARIANTS;

  const [enabled, setEnabled] = useState<Record<VariantKey, boolean>>({
    logo: true,
    brandmark: true,
    wordmark: true,
    monochrome: true,
    animated: true,
  });

  const toggle = (key: VariantKey) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className={styles.root}>
      <p className={styles.lede}>
        The active theme&rsquo;s brand on light and dark surfaces side-by-side &mdash; the &ldquo;do they
        sing&rdquo; check. The monochrome mark is tinted by token colors to show brand + token cohesion.
      </p>

      <div className={styles.toggleRow} role="group" aria-label="Toggle brand variants">
        {variants.map((v) => (
          <Button
            key={v.key}
            variant={enabled[v.key] ? "default" : "outline"}
            size="sm"
            aria-pressed={enabled[v.key]}
            onClick={() => toggle(v.key)}
          >
            {v.label}
          </Button>
        ))}
      </div>

      {variants.filter((v) => enabled[v.key]).map((v) => (
        <section key={v.key} className={styles.variant} data-slot="brand-variant" data-variant={v.key}>
          <h3 className={styles.variantHeading}>{v.label}</h3>

          {v.key === "monochrome" ? (
            <div className={styles.tintRow}>
              {TINT_TOKENS.map((token) => (
                <div key={token} className={styles.tintCell}>
                  <span
                    className={styles.monoMark}
                    data-slot="brand-tint"
                    role="img"
                    aria-label={`${themeLabel} monochrome tinted with ${token}`}
                    style={
                      {
                        color: `var(${token})`,
                        "--mono-src": `url(${brand.monochrome})`,
                      } as CSSProperties
                    }
                  />
                  <span className={styles.tintLabel}>{token}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.surfaceRow}>
              {(["light", "dark"] as const).map((ground) => {
                // Animated falls back to the static logo under reduced motion (D4).
                const asset =
                  v.key === "animated" && reducedMotion
                    ? brand.logo
                    : (brand[v.key] as BrandVariantAsset);
                return (
                  <div
                    key={ground}
                    className={`${styles.tile} ${ground === "light" ? styles.tileLight : styles.tileDark}`}
                    data-ground={ground}
                  >
                    <div className={styles.marks}>
                      {SIZES.map((s, i) => (
                        <img
                          key={s.id}
                          src={asset[ground]}
                          alt={i === 0 ? `${themeLabel} ${v.label.toLowerCase()}` : ""}
                          className={styles.mark}
                          style={{ height: s.height }}
                        />
                      ))}
                    </div>
                    <span className={styles.groundLabel}>{ground}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
