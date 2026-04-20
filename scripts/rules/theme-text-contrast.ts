import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { Rule, RuleResult } from './types.js';

/**
 * Computes WCAG 2.1 contrast ratios for text-primary, text-secondary, and text-tertiary
 * in each theme's dark and light mode overrides.
 *
 * Fails CI if any of these tokens drops below AA (4.5:1) against the resolved page background.
 *
 * Exempt tokens (per WCAG 1.4.3 Note):
 *   - text-disabled: disabled UI state — excluded by specification
 *   - text-ghost: decorative role — excluded from enforcement
 */

const CHECKED_TOKENS = ['text-primary', 'text-secondary', 'text-tertiary'] as const;
const AA_RATIO = 4.5;

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

// ---------------------------------------------------------------------------
// Theme parsing helpers
// ---------------------------------------------------------------------------

type ThemeYaml = {
  name?: string;
  colors?: Record<string, string>;
  'colors-dark'?: Record<string, string>;
  overrides?: {
    dark?: Record<string, string>;
    light?: Record<string, string>;
  };
};

/**
 * Resolve the opaque page background for a given mode.
 *
 * Priority for dark mode:
 *   1. overrides.dark.surface-page
 *   2. colors-dark.background
 *   3. colors.background
 *
 * Priority for light mode:
 *   1. overrides.light.surface-page
 *   2. colors.background
 */
function resolveBackground(
  theme: ThemeYaml,
  mode: 'dark' | 'light',
): [number, number, number] | null {
  const overridesMode = theme.overrides?.[mode];
  const candidates =
    mode === 'dark'
      ? [
          overridesMode?.['surface-page'],
          theme['colors-dark']?.['background'],
          theme.colors?.['background'],
        ]
      : [overridesMode?.['surface-page'], theme.colors?.['background']];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = parseColor(candidate);
    if (!parsed) continue;
    // We only use opaque backgrounds (alpha = 1), or alpha-composite over white
    const [r, g, b, a] = parsed;
    if (a >= 1) return [r, g, b];
    // composite over white as fallback
    return composite([r, g, b, a], [255, 255, 255]);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Exported helper — used directly in tests to avoid disk I/O
// ---------------------------------------------------------------------------

export type CheckThemeContrastInput = {
  theme: ThemeYaml;
  filename: string;
};

export type ContrastCheckResult = RuleResult;

export function checkThemeContrast(input: CheckThemeContrastInput): ContrastCheckResult[] {
  const { theme, filename } = input;
  const results: ContrastCheckResult[] = [];
  const themeName = theme.name ?? filename;

  for (const mode of ['dark', 'light'] as const) {
    const overridesMode = theme.overrides?.[mode];
    if (!overridesMode) continue;

    const bg = resolveBackground(theme, mode);
    if (!bg) {
      // No background resolved — skip mode, can't compute contrast
      continue;
    }

    const bgHex = `#${bg[0].toString(16).padStart(2, '0')}${bg[1].toString(16).padStart(2, '0')}${bg[2].toString(16).padStart(2, '0')}`;
    const bgLuminance = relativeLuminance(...bg);

    for (const token of CHECKED_TOKENS) {
      const rawValue = overridesMode[token];
      if (rawValue === undefined) continue;

      const parsed = parseColor(rawValue);
      if (!parsed) continue;

      const [fr, fg, fb, fa] = parsed;
      const resolved: [number, number, number] =
        fa < 1 ? composite([fr, fg, fb, fa], bg) : [fr, fg, fb];

      const fgLuminance = relativeLuminance(...resolved);
      const ratio = contrastRatio(fgLuminance, bgLuminance);
      const ratioStr = ratio.toFixed(2);

      if (ratio < AA_RATIO) {
        results.push({
          pass: false,
          message: `${filename}: ${token} (${mode}) on ${bgHex} is ${ratioStr}:1 (requires 4.5:1 for AA normal text)`,
          file: filename,
        });
      } else {
        results.push({
          pass: true,
          message: `${themeName} ${mode} ${token}: ${ratioStr}:1 ✓`,
          file: filename,
        });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Rule implementation
// ---------------------------------------------------------------------------

export const themeTextContrast: Rule = {
  name: 'theme-text-contrast',
  description:
    'text-primary, text-secondary, and text-tertiary meet WCAG AA (4.5:1) contrast against the resolved page background in every theme. ' +
    'Exempt: text-disabled (disabled role per WCAG 1.4.3 Note), text-ghost (decorative).',
  category: 'tokens',
  async run(): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const yamlPaths: string[] = [];

    for await (const p of glob('packages/docs/public/themes/*.visor.yaml')) {
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

      let theme: ThemeYaml;
      try {
        theme = parseYaml(content) as ThemeYaml;
      } catch {
        continue; // theme-yaml-valid rule handles parse failures
      }

      const fileResults = checkThemeContrast({ theme, filename: yamlPath });

      if (fileResults.length === 0) {
        results.push({ pass: true, message: `${yamlPath}: no text token overrides to check`, file: yamlPath });
      } else {
        results.push(...fileResults);
      }
    }

    return results;
  },
};
