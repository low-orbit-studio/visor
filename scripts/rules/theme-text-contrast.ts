import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { generateThemeData } from '../../packages/theme-engine/src/pipeline.js';
import type { Rule, RuleResult } from './types.js';

/**
 * Computes WCAG 2.1 contrast ratios for text-primary, text-secondary, and text-tertiary
 * against the resolved values for surface-page, surface-card, surface-muted, and
 * surface-popover, in each theme's dark and light modes.
 *
 * 3 tokens × 4 surfaces × 2 modes = 24 checks per theme.
 *
 * Fails CI if any combination drops below AA (4.5:1). Surfaces with alpha (rgba) are
 * alpha-composited over the resolved page background before the ratio is computed.
 *
 * Exempt tokens (per WCAG 1.4.3 Note):
 *   - text-disabled: disabled UI state — excluded by specification
 *   - text-ghost: decorative role — excluded from enforcement
 */

const CHECKED_TEXT_TOKENS = ['primary', 'secondary', 'tertiary'] as const;
const CHECKED_SURFACES = ['page', 'card', 'muted', 'popover'] as const;
const AA_RATIO = 4.5;

type TextTokenName = (typeof CHECKED_TEXT_TOKENS)[number];
type SurfaceName = (typeof CHECKED_SURFACES)[number];
type Mode = 'light' | 'dark';

// ---------------------------------------------------------------------------
// Color math helpers
// ---------------------------------------------------------------------------

/** Parse a hex color "#rrggbb" or "#rgb" into [r, g, b] 0–255. */
function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/**
 * Parse an rgba(r, g, b, a) or rgb(r, g, b) string.
 * Returns [r, g, b, a] where a defaults to 1.
 */
function parseRgba(value: string): [number, number, number, number] | null {
  const match = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!match) return null;
  return [
    parseFloat(match[1]),
    parseFloat(match[2]),
    parseFloat(match[3]),
    match[4] !== undefined ? parseFloat(match[4]) : 1,
  ];
}

/**
 * Parse any supported color value. Returns [r, g, b, a] (0–255 for rgb, 0–1 for a).
 * Returns null if unrecognised.
 */
function parseColor(value: string): [number, number, number, number] | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) {
    const rgb = parseHex(trimmed);
    if (!rgb) return null;
    return [...rgb, 1] as [number, number, number, number];
  }
  return parseRgba(trimmed);
}

/**
 * Alpha-composite [r, g, b, a] over an opaque background [bgR, bgG, bgB].
 * Returns the resolved [r, g, b] on the background.
 */
function composite(
  fg: [number, number, number, number],
  bg: [number, number, number],
): [number, number, number] {
  const [r, g, b, a] = fg;
  return [
    Math.round(r * a + bg[0] * (1 - a)),
    Math.round(g * a + bg[1] * (1 - a)),
    Math.round(b * a + bg[2] * (1 - a)),
  ];
}

/**
 * Convert a linear sRGB channel (0–255) to a linearised value for luminance.
 * WCAG 2.1 formula.
 */
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Compute WCAG 2.1 relative luminance from [r, g, b] (0–255). */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Compute WCAG 2.1 contrast ratio between two luminance values. */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Format an [r, g, b] tuple as `#rrggbb`. */
function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Resolved-token contrast check
// ---------------------------------------------------------------------------

export type ResolvedTokenColors = {
  /** Resolved text-token values per checked text token. */
  text: Partial<Record<TextTokenName, string>>;
  /** Resolved surface-token values per checked surface. */
  surface: Partial<Record<SurfaceName, string>>;
};

export type CheckThemeContrastInput = {
  /** Display name for messages. Falls back to filename if undefined. */
  themeName?: string;
  filename: string;
  /** Pre-resolved tokens per mode. Each mode is optional — skipped if undefined. */
  resolved: Partial<Record<Mode, ResolvedTokenColors>>;
};

export type ContrastCheckResult = RuleResult;

/**
 * Resolve a surface color to an opaque [r, g, b].
 * If the surface has alpha, composite it over the page-bg for the same mode.
 * Returns null if the surface cannot be parsed.
 */
function resolveSurfaceRgb(
  rawSurface: string,
  pageBg: [number, number, number],
): [number, number, number] | null {
  const parsed = parseColor(rawSurface);
  if (!parsed) return null;
  const [r, g, b, a] = parsed;
  return a < 1 ? composite([r, g, b, a], pageBg) : [r, g, b];
}

/**
 * Resolve a text color to an opaque [r, g, b] over a given surface background.
 * If the text has alpha, composite it over the surface (which is already composited
 * over the page-bg, so the visible color is the correct full composition).
 */
function resolveTextRgb(
  rawText: string,
  surface: [number, number, number],
): [number, number, number] | null {
  const parsed = parseColor(rawText);
  if (!parsed) return null;
  const [r, g, b, a] = parsed;
  return a < 1 ? composite([r, g, b, a], surface) : [r, g, b];
}

export function checkThemeContrast(input: CheckThemeContrastInput): ContrastCheckResult[] {
  const { resolved, filename } = input;
  const results: ContrastCheckResult[] = [];
  const themeName = input.themeName ?? filename;

  for (const mode of ['dark', 'light'] as const) {
    const modeResolved = resolved[mode];
    if (!modeResolved) continue;

    // Page background must resolve first — it's the base for compositing alpha surfaces.
    const pageRaw = modeResolved.surface.page;
    if (!pageRaw) continue;
    const pageRgb = resolveSurfaceRgb(pageRaw, [255, 255, 255]); // page-bg has nothing under it; fall back to white
    if (!pageRgb) continue;

    for (const surfaceName of CHECKED_SURFACES) {
      const surfaceRaw = modeResolved.surface[surfaceName];
      if (!surfaceRaw) continue;

      // For surface-page, this returns pageRgb itself; for elevated surfaces, composite over page.
      const surfaceRgb =
        surfaceName === 'page' ? pageRgb : resolveSurfaceRgb(surfaceRaw, pageRgb);
      if (!surfaceRgb) continue;

      const surfaceHex = rgbToHex(surfaceRgb);
      const surfaceLuminance = relativeLuminance(...surfaceRgb);

      for (const token of CHECKED_TEXT_TOKENS) {
        const rawValue = modeResolved.text[token];
        if (rawValue === undefined) continue;

        const textRgb = resolveTextRgb(rawValue, surfaceRgb);
        if (!textRgb) continue;

        const textLuminance = relativeLuminance(...textRgb);
        const ratio = contrastRatio(textLuminance, surfaceLuminance);
        const ratioStr = ratio.toFixed(2);
        const surfaceLabel = `surface-${surfaceName}`;
        const textLabel = `text-${token}`;

        if (ratio < AA_RATIO) {
          results.push({
            pass: false,
            message: `${filename}: ${textLabel} on ${surfaceLabel} (${mode}) is ${ratioStr}:1 on ${surfaceHex} (target ≥ 4.5:1 for AA normal text)`,
            file: filename,
          });
        } else {
          results.push({
            pass: true,
            message: `${themeName} ${mode} ${textLabel} on ${surfaceLabel}: ${ratioStr}:1 ✓`,
            file: filename,
          });
        }
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Theme-engine driven resolution (used by the rule's run() against real YAMLs)
// ---------------------------------------------------------------------------

/**
 * Use the theme-engine pipeline to derive resolved values for the surfaces and text
 * tokens we care about. Returns null if the YAML can't be processed (e.g. invalid
 * schema) — theme-yaml-valid handles those failures separately.
 */
function resolveFromYaml(
  yamlContent: string,
): { themeName: string | undefined; resolved: Partial<Record<Mode, ResolvedTokenColors>> } | null {
  let data;
  try {
    data = generateThemeData(yamlContent);
  } catch {
    return null;
  }

  const buildMode = (mode: Mode): ResolvedTokenColors => {
    const text: Partial<Record<TextTokenName, string>> = {};
    for (const token of CHECKED_TEXT_TOKENS) {
      const value = data.tokens.text[token]?.[mode];
      if (value) text[token] = value;
    }
    const surface: Partial<Record<SurfaceName, string>> = {};
    for (const surfaceName of CHECKED_SURFACES) {
      const value = data.tokens.surface[surfaceName]?.[mode];
      if (value) surface[surfaceName] = value;
    }
    return { text, surface };
  };

  return {
    themeName: data.config?.name,
    resolved: {
      light: buildMode('light'),
      dark: buildMode('dark'),
    },
  };
}

// ---------------------------------------------------------------------------
// Rule implementation
// ---------------------------------------------------------------------------

export const themeTextContrast: Rule = {
  name: 'theme-text-contrast',
  description:
    'text-primary, text-secondary, and text-tertiary meet WCAG AA (4.5:1) contrast against ' +
    'surface-page, surface-card, surface-muted, and surface-popover in every theme (light + dark). ' +
    'Exempt: text-disabled (disabled role per WCAG 1.4.3 Note), text-ghost (decorative).',
  category: 'tokens',
  async run(): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const yamlPaths: string[] = [];

    // Check the in-repo source themes (themes/) and legacy custom-themes/.
    // We intentionally avoid `packages/docs/public/themes/` because that
    // directory is populated by `visor theme sync` and contains derived
    // copies of private themes from visor-themes-private — out of scope
    // for the public repo's CI.
    for await (const p of glob('themes/*.visor.yaml')) {
      yamlPaths.push(p);
    }
    for await (const p of glob('custom-themes/*.visor.yaml')) {
      yamlPaths.push(p);
    }

    if (yamlPaths.length === 0) {
      return [{ pass: true, message: 'No theme YAML files found to check' }];
    }

    for (const yamlPath of yamlPaths) {
      let content: string;
      try {
        content = await readFile(yamlPath, 'utf-8');
      } catch {
        continue;
      }

      const resolution = resolveFromYaml(content);
      if (!resolution) {
        // theme-yaml-valid rule handles parse / schema failures
        continue;
      }

      const fileResults = checkThemeContrast({
        resolved: resolution.resolved,
        themeName: resolution.themeName,
        filename: yamlPath,
      });

      if (fileResults.length === 0) {
        results.push({ pass: true, message: `${yamlPath}: no resolved text/surface tokens to check`, file: yamlPath });
      } else {
        results.push(...fileResults);
      }
    }

    return results;
  },
};
