// Hand-authored. Edit `STOCK_GROUPS` only by running `visor theme sync`.
// The merge below and the interface declarations are hand-authored — safe to edit.

import { customThemeGroups } from "./theme-config.custom.generated";
import { PRIVATE_THEMES } from "./private-themes";

/** Light- and dark-surface asset URLs for one brand variant. Single-file marks set both to the same URL. */
export interface BrandVariantAsset {
  /** Asset for light surfaces (dark ink). */
  light: string;
  /** Asset for dark surfaces (light ink). */
  dark: string;
}

/** A theme's resolved brand asset set. Mirrors the standard variant slots from the branding spike (§4.F). */
export interface ThemeBrand {
  /** Full lockup. */
  logo: BrandVariantAsset;
  /** Symbol only. */
  brandmark: BrandVariantAsset;
  /** Type only. */
  wordmark: BrandVariantAsset;
  /** Single-color mark, tinted via `mask-image` + `currentColor`. */
  monochrome: string;
  /**
   * Animated lockup (optional, SVG-only). Self-contained animated SVG rendered
   * via `<img>` so it plays; omitted by stock themes. Reduced-motion consumers
   * fall back to the static {@link ThemeBrand.logo}.
   */
  animated?: BrandVariantAsset;
}

export interface ThemeEntry {
  value: string;
  label: string;
  /** Filename (without .visor.yaml extension) if a YAML config exists in /public/themes/ */
  yamlFile?: string;
  /** When set, activating this theme forces the docs site into the specified color mode. */
  defaultMode?: "dark" | "light";
  /** Brand asset overrides. Omitted → the shared Visor default ({@link VISOR_DEFAULT_BRAND}). */
  brand?: ThemeBrand;
}

export interface ThemeGroup {
  label: string;
  themes: ThemeEntry[];
}

/* BEGIN visor-stock-themes — managed by `visor theme sync` */
const STOCK_GROUPS: ThemeGroup[] = [
  {
    label: "Visor",
    themes: [
      { value: "blackout", label: "Blackout", yamlFile: "blackout" },
      { value: "borderless", label: "Borderless", yamlFile: "borderless" },
      { value: "modern-minimal", label: "Modern Minimal", yamlFile: "modern-minimal" },
      { value: "neutral", label: "Neutral", yamlFile: "neutral" },
      { value: "space", label: "Space", yamlFile: "space" },
    ],
  },
];
/* END visor-stock-themes */

// Re-exported outside the managed block so `visor theme sync` (which rewrites
// the block above) doesn't strip the export. Consumers like /themes/private
// import STOCK_GROUPS directly to avoid the customThemeGroups overlap with
// PRIVATE_THEMES.
export { STOCK_GROUPS };

export const THEME_GROUPS: ThemeGroup[] = [...STOCK_GROUPS, ...customThemeGroups];

export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));

export const THEME_STORAGE_KEY = "visor-theme";
export const COLOR_MODE_STORAGE_KEY = "visor-color-mode";
export const DEFAULT_THEME = "blackout";
export type ColorMode = "light" | "dark";

export function findThemeEntry(theme: string): ThemeEntry | undefined {
  return THEME_GROUPS.flatMap((g) => g.themes).find((t) => t.value === theme);
}

/**
 * The shared Visor brand (VI-469 SVG variants). Stock themes are not logo-less —
 * they inherit this default unless they declare their own `brand` (§4.E). Phase 1
 * reads the local assets in `public/themes/visor/brand/`; the CDN path lands in Phase 2.
 * These mirror the `--brand-*` vars the theme engine emits (VI-470).
 */
export const VISOR_DEFAULT_BRAND: ThemeBrand = {
  logo: {
    light: "/themes/visor/brand/visor-logo-light.svg",
    dark: "/themes/visor/brand/visor-logo-dark.svg",
  },
  brandmark: {
    light: "/themes/visor/brand/visor-brandmark.svg",
    dark: "/themes/visor/brand/visor-brandmark.svg",
  },
  wordmark: {
    light: "/themes/visor/brand/visor-wordmark-light.svg",
    dark: "/themes/visor/brand/visor-wordmark-dark.svg",
  },
  monochrome: "/themes/visor/brand/visor-monochrome.svg",
};

/**
 * Resolve a theme's brand, falling back to the shared Visor default. Stock and
 * custom themes resolve via {@link findThemeEntry}; private themes (VI-489) carry
 * their resolved brand in the {@link PRIVATE_THEMES} manifest, so the Explorer's
 * Brand cohesion view renders their real marks instead of the default.
 */
export function resolveBrand(theme: string): ThemeBrand {
  return (
    findThemeEntry(theme)?.brand ??
    PRIVATE_THEMES.find((t) => t.slug === theme)?.brand ??
    VISOR_DEFAULT_BRAND
  );
}

/** Flip the <html> color-mode class and color-scheme without touching the theme class. Persists to localStorage. */
export function applyMode(mode: ColorMode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (mode === "dark") {
    html.classList.add("dark");
    html.classList.remove("light");
    html.style.colorScheme = "dark";
  } else {
    html.classList.add("light");
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  }
  try { localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode); } catch {}
}

// Strips any `*-theme` class, including private-only slugs (animal, blacklight,
// etc.) that aren't in ALL_THEMES. Without this, switching from a private theme
// to a stock theme on /themes/private leaves both classes co-applied (VI-351).
const THEME_CLASS_PATTERN = /(^|\s)[\w-]+-theme(?=\s|$)/g;

/**
 * Apply a theme by swapping the `*-theme` class on <body>. Persists to localStorage
 * and dispatches a `visor-theme-change` event so listeners can react. If the theme
 * declares a `defaultMode`, that mode is forced; otherwise the current mode stays put.
 */
export function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const body = document.body;
  body.className = body.className.replace(THEME_CLASS_PATTERN, "").trim();
  body.classList.add(`${theme}-theme`);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  const entry = findThemeEntry(theme);
  // Only apply defaultMode when the user has no stored color mode preference.
  // This prevents overriding a manually-chosen mode on navigation.
  if (entry?.defaultMode) {
    let storedMode: string | null = null;
    try { storedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY); } catch {}
    if (!storedMode) applyMode(entry.defaultMode);
  }

  document.dispatchEvent(new CustomEvent("visor-theme-change"));
}

/**
 * Read the persisted theme. Only stock/custom slugs (`ALL_THEMES`) are accepted
 * by default; the private gallery passes its slugs via `extraSlugs` so the Brand
 * cohesion view can follow the private switcher (VI-489). Private slugs are not
 * accepted globally — their CSS is route-scoped, so applying one elsewhere would
 * leave the page unstyled.
 */
export function getStoredTheme(extraSlugs: string[] = []): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (ALL_THEMES.includes(stored) || extraSlugs.includes(stored))) return stored;
  } catch {}
  return DEFAULT_THEME;
}
