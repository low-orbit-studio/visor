"use client";

import { type CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { findThemeEntry, resolveBrand, resolveBrandStrategy } from "@/lib/theme-config";
import { useActiveTheme, type SectionProps } from "./use-active-theme";
import styles from "./logo-guidelines.module.css";

/** Documented clearspace fallback when the brand declares none — a visible safe zone (spacing-5). */
const CLEARSPACE_FALLBACK = "1.25rem";

/**
 * Intrinsic ratio of the Visor monochrome lockup (visor-monochrome.svg viewBox
 * `0 0 2210 636`). Used to derive each mark's explicit width from its height, so
 * the masked span never collapses — the fallback when a theme's brand declares no
 * `aspectRatio` (private/custom themes carry a mark but not the guideline tokens).
 */
const LOCKUP_RATIO = 2210 / 636;

/** Parse a brand `aspectRatio` ("W / H" or "W/H") to a number; null if unparseable. */
function parseRatio(aspectRatio: string | undefined): number | null {
  if (!aspectRatio) return null;
  const [w, h] = aspectRatio.split("/").map((p) => Number(p.trim()));
  return w > 0 && h > 0 ? w / h : null;
}

/** Mark heights (rem) — explicit so width can be derived; never rely on CSS aspect-ratio. */
const CLEARSPACE_MARK_H = 2.5;
const MISUSE_MARK_H = 1.75;

/**
 * Documented minimum-size floors for the lockup — brand-guideline values (digital
 * px heights), not spacing tokens (mirrors brand.tsx's "intentional preview sizing"
 * note). The first is deliberately below the floor to show what "too small" reads
 * like; `min: true` marks the recommended digital minimum.
 */
const MIN_SIZES: Array<{ px: number; label: string; below?: boolean; min?: boolean }> = [
  { px: 12, label: "Below floor", below: true },
  { px: 20, label: "Digital minimum", min: true },
  { px: 36, label: "Comfortable" },
];

/**
 * Prohibited modifications, each shown on the real mark (D2). `transform`-class
 * distortions warp the mark; `recolor`/`contrast` override the masked fill (the
 * mark is tinted by `currentColor`, so recolor = a clashing token, contrast = the
 * opacity token) — no raw literals. These are intentional "wrong" demos.
 */
const MISUSES: Array<{ id: string; label: string; cls: keyof typeof styles }> = [
  { id: "stretch", label: "Don't stretch or distort the proportions", cls: "distortStretch" },
  { id: "rotate", label: "Don't rotate or tilt the mark", cls: "distortRotate" },
  { id: "recolor", label: "Don't recolor the mark off-brand", cls: "distortRecolor" },
  { id: "flip", label: "Don't flip or mirror the mark", cls: "distortFlip" },
  { id: "crop", label: "Don't crop or zoom into the mark", cls: "distortCrop" },
  { id: "contrast", label: "Don't place the mark where contrast is too low", cls: "distortContrast" },
];

/**
 * The Logo Guidelines Brand Workbench surface (VI-509): the first `[guideline]`
 * surface over Visor's brand `[asset]` marks. Renders the logo-usage trio —
 * clearspace + minimum-size as *shown* rules read from `BrandSlot.clearSpace` /
 * `aspectRatio` (via {@link resolveBrand}), and a Misuse/don'ts panel of prohibited
 * modifications drawn on the real mark. Theme/mode-aware: re-resolves on switch via
 * {@link useActiveTheme}, and the marks are the monochrome lockup tinted by
 * `currentColor` (mask-image, mirroring brand.tsx's monochrome variant), so they
 * stay legible on any theme surface in either mode — including the VI-486 dual-pane
 * compare and the all-themes matrix — for free.
 *
 * The clearspace and min-size rules read the asset path ({@link resolveBrand}) and
 * render for any theme's marks. The misuse copy is brand-keyed via
 * {@link resolveBrandStrategy} (mirrors strategy/pillars/verbal): a non-Visor theme
 * has no public guidelines, so that panel shows a candid private-record notice
 * while the geometric rules persist. Composes existing Visor primitives only.
 */
export function LogoGuidelinesSection({ theme: themeOverride }: SectionProps = {}) {
  const theme = useActiveTheme(themeOverride);
  const brand = resolveBrand(theme);
  const strategy = resolveBrandStrategy(theme);
  const themeLabel = findThemeEntry(theme)?.label ?? theme;

  // The monochrome lockup is a single-color vector tinted via mask-image +
  // currentColor — mode-safe by construction (dark ink on light, light ink on
  // dark), unlike the fixed-color logo/brandmark rasters.
  const markSrc = `url(${brand.monochrome})`;
  const clearSpace = brand.clearSpace ?? CLEARSPACE_FALLBACK;
  // Read the brand's declared aspectRatio (D1); fall back to the lockup's intrinsic
  // ratio so the mark is sized — and visible — even when the theme omits it.
  const ratio = parseRatio(brand.aspectRatio) ?? LOCKUP_RATIO;

  return (
    <div className={styles.root}>
      <Text as="p" color="secondary" className={styles.lede}>
        How the mark is used &mdash; the rules that keep it legible and unmistakable. Clearspace and
        minimum size are shown over the active theme&rsquo;s mark, read from the brand&rsquo;s own{" "}
        <code className={styles.code}>clearSpace</code> / <code className={styles.code}>aspectRatio</code>;
        the misuse panel shows what never to do.
      </Text>

      {/* Clearspace — the safe zone read from BrandSlot.clearSpace, shown as a ring. */}
      <section className={styles.block} data-slot="logo-clearspace">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Clearspace
        </Heading>
        <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
          Keep at least this much clear space on every side &mdash; no type, no other marks, no edges
          inside the ring.
        </Text>
        <div className={styles.clearspaceTile}>
          <div className={styles.clearspaceRing} data-slot="clearspace-ring" style={{ padding: clearSpace }}>
            <span
              className={styles.clearspaceMark}
              data-slot="mark"
              role="img"
              aria-label={`${themeLabel} mark with clearspace`}
              style={
                {
                  "--mono-src": markSrc,
                  height: `${CLEARSPACE_MARK_H}rem`,
                  width: `${CLEARSPACE_MARK_H * ratio}rem`,
                } as CSSProperties
              }
            />
          </div>
        </div>
        <Badge variant="outline" data-slot="clearspace-value">
          {`clearSpace: ${clearSpace}`}
        </Badge>
      </section>

      {/* Minimum size — the floor, each sample locked to BrandSlot.aspectRatio. */}
      <section className={styles.block} data-slot="logo-minsize">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Minimum size
        </Heading>
        <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
          Don&rsquo;t reproduce the mark smaller than the digital floor &mdash; below it the lockup
          loses legibility.
        </Text>
        <div className={styles.minsizeRow}>
          {MIN_SIZES.map((s) => (
            <div
              key={s.px}
              className={styles.minsizeItem}
              data-slot="minsize-item"
              data-floor={s.min ? "min" : s.below ? "below" : "ok"}
            >
              <div className={styles.minsizeStage}>
                <span
                  className={styles.minsizeMark}
                  data-slot="mark"
                  role="img"
                  aria-label={`${themeLabel} mark at ${s.px} pixels tall`}
                  style={
                    {
                      "--mono-src": markSrc,
                      height: `${s.px}px`,
                      width: `${s.px * ratio}px`,
                    } as CSSProperties
                  }
                />
              </div>
              <div className={styles.minsizeMeta}>
                <Text as="span" size="xs" weight="semibold" className={styles.minsizePx}>
                  {`${s.px}px`}
                </Text>
                {s.below ? (
                  <Badge variant="destructive" size="sm">
                    {s.label}
                  </Badge>
                ) : s.min ? (
                  <Badge variant="success" size="sm">
                    {s.label}
                  </Badge>
                ) : (
                  <Text as="span" size="xs" color="tertiary">
                    {s.label}
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Misuse — brand-keyed don'ts drawn on the real mark (the first [guideline] surface). */}
      <section className={styles.block} data-slot="logo-misuse">
        <Heading level={3} size="xs" className={styles.blockHeading}>
          Misuse
        </Heading>
        {strategy ? (
          <>
            <Text as="p" size="sm" color="tertiary" className={styles.blockLede}>
              Never modify the mark. Each prohibited treatment is shown on the real lockup.
            </Text>
            <div className={styles.misuseGrid}>
              {MISUSES.map((m) => (
                <Card key={m.id} className={styles.misuseCard} data-slot="misuse-item" data-misuse={m.id}>
                  <div className={styles.misuseStage}>
                    <span
                      className={`${styles.misuseMark} ${styles[m.cls]}`}
                      data-slot="mark"
                      aria-hidden
                      style={
                        {
                          "--mono-src": markSrc,
                          height: `${MISUSE_MARK_H}rem`,
                          width: `${MISUSE_MARK_H * ratio}rem`,
                        } as CSSProperties
                      }
                    />
                    <span className={styles.misuseCross} aria-hidden>
                      &times;
                    </span>
                  </div>
                  <Text as="p" size="sm" color="secondary" className={styles.misuseLabel}>
                    {m.label}
                  </Text>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Text as="p" size="sm" color="tertiary" className={styles.blockLede} data-slot="misuse-private">
            This theme&rsquo;s misuse rules are part of its private brand record &mdash; only
            Visor&rsquo;s own guidelines are published here.
          </Text>
        )}
      </section>
    </div>
  );
}
