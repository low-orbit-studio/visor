/**
 * Theme brand pipeline — connects brand resolution to the .visor.yaml flow.
 *
 * Takes the `brand` block from a .visor.yaml file and produces:
 *   - Resolved brand assets (local public/ paths or CDN URLs).
 *   - Mode-scoped `--brand-{variant}` CSS custom properties, plus explicit
 *     `--brand-{variant}-light` / `-dark` forced-mode aliases (Q1).
 *   - Per-variant `--brand-{variant}-clear-space` / `-aspect-ratio` tokens (Q6).
 *   - Warnings for assets needing manual setup.
 *
 * The emitted CSS is a raw declaration body (no @layer wrapper). Adapters wrap
 * it in `@layer visor-brand` (ordered after `visor-semantic`).
 */

import {
  DEFAULT_VISOR_BRAND,
  resolveBrandSlot,
  resolveBrandSource,
} from "./resolve.js";
import type {
  BrandResolution,
  BrandSlot,
  BrandVariant,
  ThemeBrandResult,
  VisorBrand,
} from "./types.js";
import type { ColorScheme } from "../types.js";
import { BRAND_VARIANTS } from "./types.js";

/** Wrap a value in a CSS `url()` for image-typed brand vars. */
function cssUrl(value: string): string {
  return `url("${value}")`;
}

/** Emit the mode-agnostic forced-mode aliases + tokens for one resolution. */
function staticDeclsFor(r: BrandResolution): string[] {
  const decls: string[] = [];
  // Forced-mode aliases (Q1): always resolvable regardless of active mode.
  decls.push(`--brand-${r.variant}-light: ${cssUrl(r.light)};`);
  decls.push(`--brand-${r.variant}-dark: ${cssUrl(r.dark)};`);
  // Tokenized clear-space + aspect ratio (Q6), when declared.
  if (r.clearSpace !== null) {
    decls.push(`--brand-${r.variant}-clear-space: ${r.clearSpace};`);
  }
  if (r.aspectRatio !== null) {
    decls.push(`--brand-${r.variant}-aspect-ratio: ${r.aspectRatio};`);
  }
  return decls;
}

/** Emit the mode-scoped `--brand-{variant}` declaration for one resolution. */
function modeDecl(r: BrandResolution, mode: "light" | "dark"): string {
  return `--brand-${r.variant}: ${cssUrl(r[mode])};`;
}

function block(selector: string, decls: string[]): string {
  if (decls.length === 0) return "";
  return [`${selector} {`, ...decls.map((d) => `  ${d}`), "}"].join("\n");
}

/**
 * Generate the mode-scoped `--brand-*` CSS body.
 *
 * Layout mirrors the docs adapter's intent-alias emission:
 *   - Static block (forced-mode aliases + tokens) on the base scope.
 *   - Light `--brand-{variant}` on `html:not(.dark) {scope}`.
 *   - Dark `--brand-{variant}` on `.dark {scope}` + a prefers-color-scheme dup.
 *
 * When `scope` is empty (raw pipeline / non-scoped consumers), selectors fall
 * back to `:root` / `.dark` / `:root:not(.light)`.
 */
function generateBrandCSS(
  resolutions: BrandResolution[],
  scope: string,
  colorScheme: ColorScheme = "adaptive",
): string {
  if (resolutions.length === 0) return "";

  const baseSelector = scope ? scope : ":root";
  const lightSelector = scope ? `html:not(.dark) ${scope}` : ":root";
  const darkSelector = scope ? `.dark ${scope}` : ".dark";
  const pcsSelector = scope ? `${scope}:not(.light)` : ":root:not(.light)";

  const lines: string[] = [];

  // Static: forced-mode aliases + per-variant tokens (mode-agnostic).
  const staticDecls = resolutions.flatMap(staticDeclsFor);
  lines.push("/* --- Brand: forced-mode aliases + tokens --- */");
  lines.push(block(baseSelector, staticDecls));
  lines.push("");

  // BO-56: single-mode brands pin `--brand-{variant}` on the host selector with
  // no `html:not(.dark)` / `.dark` / `prefers-color-scheme` blocks. The
  // forced-mode `-light`/`-dark` aliases above still resolve either mark.
  if (colorScheme === "dark-only") {
    const darkDecls = resolutions.map((r) => modeDecl(r, "dark"));
    lines.push("/* --- Brand: variants (dark) — host --- */");
    lines.push(block(baseSelector, darkDecls));
    return lines.join("\n").trim();
  }
  if (colorScheme === "light-only") {
    const lightDecls = resolutions.map((r) => modeDecl(r, "light"));
    lines.push("/* --- Brand: variants (light) — host --- */");
    lines.push(block(baseSelector, lightDecls));
    return lines.join("\n").trim();
  }

  // Light: mode-scoped --brand-{variant}.
  const lightDecls = resolutions.map((r) => modeDecl(r, "light"));
  lines.push("/* --- Brand: variants (light) --- */");
  lines.push(block(lightSelector, lightDecls));
  lines.push("");

  // Dark: mode-scoped --brand-{variant} (manual toggle).
  const darkDecls = resolutions.map((r) => modeDecl(r, "dark"));
  lines.push("/* --- Brand: variants (dark) — manual toggle --- */");
  lines.push(block(darkSelector, darkDecls));
  lines.push("");

  // Dark: prefers-color-scheme duplicate.
  lines.push("/* --- Brand: variants (dark) — prefers-color-scheme --- */");
  const inner = block(pcsSelector, darkDecls);
  lines.push(
    `@media (prefers-color-scheme: dark) {\n${inner
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n")}\n}`,
  );

  return lines.join("\n").trim();
}

/**
 * Resolve all brand assets for a theme's `brand` configuration.
 *
 * Main entry point for the brand pipeline — called during .visor.yaml import.
 * When `brand` is omitted, falls back to the Visor default brand (D3) so stock
 * themes are never logo-less.
 *
 * @param brand   The resolved `brand` block (or undefined → Visor default).
 * @param options `scope` — optional scope selector (e.g. `.blackout-theme`)
 *                that prefixes the emitted selectors for class-scoped adapters.
 */
export function resolveThemeBrand(
  brand: VisorBrand | undefined,
  options?: { scope?: string; colorScheme?: ColorScheme },
): ThemeBrandResult {
  const effective = brand ?? DEFAULT_VISOR_BRAND;
  const scope = options?.scope ?? "";
  const colorScheme = options?.colorScheme ?? "adaptive";
  const source = resolveBrandSource(effective);
  const org = effective.org ?? null;
  const cdnBase = effective["cdn-overrides"]?.["visor-brands"] ?? null;
  const slotOptions = { source, org, cdnBase };

  const warnings: string[] = [];
  const variants: BrandResolution[] = [];
  const custom: BrandResolution[] = [];

  for (const variant of BRAND_VARIANTS as readonly BrandVariant[]) {
    const slot = effective[variant] as BrandSlot | undefined;
    if (!slot) continue;
    const resolution = resolveBrandSlot(variant, slot, slotOptions);
    variants.push(resolution);
    if (resolution.guidance) warnings.push(resolution.guidance);
  }

  if (effective.custom) {
    for (const [key, slot] of Object.entries(effective.custom)) {
      const resolution = resolveBrandSlot(key, slot, slotOptions);
      custom.push(resolution);
      if (resolution.guidance) warnings.push(resolution.guidance);
    }
  }

  const css = generateBrandCSS([...variants, ...custom], scope, colorScheme);

  return { variants, custom, css, warnings };
}
