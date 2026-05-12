// Hand-authored. The companion file `private-themes.generated.ts` is rewritten
// on every `predev`/`prebuild` by `scripts/generate-private-themes.mjs` based
// on whether `@low-orbit-studio/visor-themes-private` is installed.

/**
 * Typography slot data for a private theme. Mirrors the `weights` arrays
 * declared in the theme's `typography.{heading|display|body}` slot in its
 * .visor.yaml — used by the Design System Specimen to render exactly the
 * weight rows a theme actually loads, instead of a hardcoded 4+3 grid.
 *
 * VI-356: when a slot has no `weights` declared in YAML, it is omitted from
 * this manifest entry; the specimen falls back to its hardcoded defaults for
 * any missing slot.
 */
export interface PrivateThemeTypographySlot {
  /** Font family display name (e.g. "PP Model Plastic") */
  family: string;
  /** Weights the theme actually loads — sorted ascending */
  weights: number[];
}

export interface PrivateThemeTypography {
  heading?: PrivateThemeTypographySlot;
  display?: PrivateThemeTypographySlot;
  body?: PrivateThemeTypographySlot;
  mono?: PrivateThemeTypographySlot;
}

export interface PrivateThemeEntry {
  slug: string;
  label: string;
  group: string;
  /** Typography slot data — present only when the YAML declares `weights` for any slot. */
  typography?: PrivateThemeTypography;
}

export { PRIVATE_THEMES } from "./private-themes.generated";
