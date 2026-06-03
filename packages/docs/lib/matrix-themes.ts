// Theme enumeration + per-theme mode resolution for the all-themes matrix
// (VI-490). Pure functions over the same registries the rest of the docs use —
// stock + custom from THEME_GROUPS, private from PRIVATE_THEMES — so the matrix
// stays in sync with `visor theme sync` and the private-themes generator.

import { STOCK_GROUPS, type ColorMode } from "./theme-config";
import { customThemeGroups } from "./theme-config.custom.generated";
import { PRIVATE_THEMES } from "./private-themes";

/** Which slice of the registry to render as rows. */
export type ThemeSet = "all" | "stock" | "custom" | "private";

/** The matrix mode control. `default` = each theme in its own default mode. */
export type MatrixMode = "light" | "dark" | "default";

/** A single theme row descriptor, unified across stock/custom/private sources. */
export interface MatrixTheme {
  /** Class base — rendered as `.{slug}-theme`. */
  slug: string;
  label: string;
  /** Group heading the theme belongs under (e.g. "Visor", "Client", "Low Orbit"). */
  group: string;
  /**
   * Locked mode. When set, the theme ALWAYS renders this mode and ignores the
   * Light/Dark selector (it is "fixed", not "adaptive"). Mirrors a theme's
   * `default-mode` in YAML (e.g. blacklight is dark-locked).
   */
  defaultMode?: ColorMode;
}

/** Themes bucketed under a group heading, preserving registry order. */
export interface MatrixThemeGroup {
  group: string;
  themes: MatrixTheme[];
}

/** Convert a stock/custom `ThemeGroup` into matrix rows. */
function fromThemeGroup(group: {
  label: string;
  themes: { value: string; label: string; defaultMode?: ColorMode }[];
}): MatrixThemeGroup {
  return {
    group: group.label,
    themes: group.themes.map((t) => ({
      slug: t.value,
      label: t.label,
      group: group.label,
      defaultMode: t.defaultMode,
    })),
  };
}

/** Bucket the flat PRIVATE_THEMES manifest by its `group` field, first-seen order. */
function privateGroups(): MatrixThemeGroup[] {
  const order: string[] = [];
  const byGroup = new Map<string, MatrixTheme[]>();
  for (const t of PRIVATE_THEMES) {
    if (!byGroup.has(t.group)) {
      byGroup.set(t.group, []);
      order.push(t.group);
    }
    byGroup.get(t.group)!.push({
      slug: t.slug,
      label: t.label,
      group: t.group,
      defaultMode: t.defaultMode,
    });
  }
  return order.map((group) => ({ group, themes: byGroup.get(group)! }));
}

/**
 * Grouped theme rows for the chosen set. `all` = stock → custom → private, in
 * that order; the individual sets return only their own groups.
 *
 * Custom is deduped against private: `visor theme sync` registers installed
 * private-package themes into `customThemeGroups` when the package is present
 * (dev), so without this filter the private themes would appear twice in `all`
 * (once as custom, once as private) — the same overlap `/themes/private` sidesteps
 * by reading STOCK_GROUPS directly. In production the private package is absent,
 * so PRIVATE_THEMES is empty and this filter is a no-op.
 */
export function getMatrixThemeGroups(set: ThemeSet): MatrixThemeGroup[] {
  const privateSlugs = new Set(PRIVATE_THEMES.map((t) => t.slug));
  const stock = STOCK_GROUPS.map(fromThemeGroup);
  const custom = customThemeGroups
    .map(fromThemeGroup)
    .map((g) => ({ ...g, themes: g.themes.filter((t) => !privateSlugs.has(t.slug)) }))
    .filter((g) => g.themes.length > 0);
  const priv = privateGroups();
  switch (set) {
    case "stock":
      return stock;
    case "custom":
      return custom;
    case "private":
      return priv;
    case "all":
    default:
      return [...stock, ...custom, ...priv];
  }
}

/** A theme is "fixed" (mode-locked) when it declares a `defaultMode`; else adaptive. */
export function isLocked(theme: MatrixTheme): boolean {
  return theme.defaultMode !== undefined;
}

/**
 * Resolve the concrete mode a row renders in. Locked themes ALWAYS use their
 * `defaultMode` and ignore the selector. Adaptive themes follow Light/Dark; under
 * `default` they fall back to dark — deterministic, never the browser preference
 * (BL-227 audit: the matrix must never follow `prefers-color-scheme`).
 */
export function resolveEffectiveMode(theme: MatrixTheme, selected: MatrixMode): ColorMode {
  if (theme.defaultMode) return theme.defaultMode;
  if (selected === "default") return "dark";
  return selected;
}
