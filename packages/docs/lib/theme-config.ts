// Hand-authored. Edit `STOCK_GROUPS` only by running `visor theme sync`.
// The merge below and the interface declarations are hand-authored — safe to edit.

import { customThemeGroups } from "./theme-config.custom.generated";
import { PRIVATE_THEMES } from "./private-themes";
import type { BrandStrategy } from "@loworbitstudio/visor-theme-engine";

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
  /**
   * Tokenized safe-zone padding for the primary mark — the docs projection of the
   * engine's `BrandSlot.clearSpace` (branding spike §4.F / Q6). Read by the Logo
   * Guidelines surface (VI-509) to draw the clearspace rule as a shown guideline;
   * omitted → that surface falls back to a documented default.
   */
  clearSpace?: string;
  /**
   * Tokenized locked aspect ratio for the primary mark — the docs projection of the
   * engine's `BrandSlot.aspectRatio`. Read by the Logo Guidelines surface (VI-509)
   * to lock the min-size floor's proportion; omitted → derived from the mark.
   */
  aspectRatio?: string;
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
  // Logo-guideline tokens (VI-509), keyed to the monochrome lockup the guidelines
  // surface renders (viewBox `0 0 2210 636`). Read by the Logo Guidelines surface;
  // the engine's `BrandSlot` carries the canonical form. clearSpace is spacing-5
  // (20px) — a roomier safe zone than the 4-step default reads at preview scale.
  clearSpace: "1.25rem",
  aspectRatio: "2210 / 636",
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

/**
 * Visor's authored Brand Record (VI-504/VI-505) — strategy + verbal identity as
 * data. The structured projection of `docs/brand/visor-brand-record.yaml`, typed
 * against the engine's {@link BrandStrategy} so the docs layer reads it the way an
 * agent reads the manifest's `brand_strategy` block. Hand-kept in sync with the
 * YAML, which is the human-canonical source. `visibility: "public"` — only Visor's
 * own record ships in this public repo.
 */
export const VISOR_BRAND_STRATEGY: BrandStrategy = {
  positioning: {
    onliness:
      "The only design system that compiles a complete brand — visual and verbal — from one portable file, for humans and agents alike.",
    category: "design system",
    differentiation:
      "brand strategy, visual and verbal, as derivable machine-readable data",
  },
  essence: ["coherent", "open", "yours"],
  personality: [
    { trait: "precise", not: "fussy" },
    { trait: "candid", not: "cold" },
    { trait: "generous", not: "indulgent" },
    { trait: "warm", not: "saccharine" },
  ],
  archetype: { primary: "sage", secondary: "creator", tertiary: "everyman" },
  pillars: [
    {
      id: "coherence",
      statement: "Every layer derives from the one above it.",
      governs: {
        tokens: ["--primary", "--surface-card", "--text-primary"],
        components: ["*"],
      },
    },
    {
      id: "openness",
      statement:
        "The whole system is open — readable by humans and agents, and free to take.",
      governs: { surfaces: ["manifest", "cli", "component-metadata"] },
    },
    {
      id: "ownership",
      statement: "Copy-and-own. You hold the source; there's no lock-in, ever.",
      governs: { components: ["*"] },
    },
  ],
  voice: {
    traits: [
      {
        name: "plainspoken",
        do: "Say it in one clause. Lead with the answer.",
        dont: "Bury the point under qualifiers and throat-clearing.",
        example:
          "Copy-and-own is just that — the source is yours. Edit anything; there's no wrapper to fight.",
      },
      {
        name: "candid",
        do: "Name the tradeoff and the cost before the reader hits it.",
        dont: "Oversell, hide the sharp edges, or hedge to sound safe.",
        example:
          "Heads up — this theme fails WCAG AA on small text. Bump the contrast a notch, or keep the warning if that's intentional.",
      },
      {
        name: "generous",
        do: "Give the why. Show the worked example. Assume the reader will go further than you did.",
        dont: "Gatekeep, wave at best practices, or make them read the source to understand.",
        example:
          "Fallbacks use Gray, not Slate — so an un-themed component lands on a neutral that fits your palette instead of clashing. Small thing, but it's what keeps a theme feeling whole.",
      },
      {
        name: "warm",
        do: "Greet the reader like a peer you're glad to help. A little delight is welcome.",
        dont: "Go cold and transactional — or paper over it with forced cheer.",
        example:
          "Welcome — let's get your first theme on the screen. It takes about a minute.",
      },
    ],
  },
  tone: {
    error: {
      feeling: "warm, accountable, already holding the fix",
      example:
        "That didn't save — looks like the theme name's taken. Pick another and we'll keep everything else just as you left it.",
    },
    success: {
      feeling: "a real, small celebration — a little confetti is fine",
      example: "Saved! Your theme's live across every component — go take a look.",
    },
    empty: {
      feeling: "inviting, a friendly nudge to start",
      example:
        "Nothing here yet — let's change that. Start from a blank file, or clone one and make it yours.",
    },
    loading: {
      feeling: "unhurried and friendly, honest about the wait",
      example: "Compiling your tokens — just a moment…",
    },
    "validation-warning": {
      feeling: "a friend flagging a smell, never a scold",
      example:
        "Quick one — your primary and accent are nearly twins. Themes can read a little flat this close, so nudge one if it's not on purpose.",
    },
  },
  lexicon: [
    { use: "theme", avoid: "skin" },
    { use: "copy-and-own", avoid: "fork" },
    { use: "compose", avoid: "drag-and-drop" },
    { use: "token", avoid: "variable" },
    { use: "adapter", avoid: "plugin" },
    { use: "transform", avoid: "restyle" },
    { use: "portable", avoid: "exportable" },
  ],
  core: ["positioning", "essence", "pillars"],
  visibility: "public",
};

/**
 * Resolve a theme's Brand Record strategy — positioning, essence, personality,
 * pillars, voice, and tone as data. Parallel to {@link resolveBrand}, but
 * strategy is brand-keyed, not theme-keyed: the {@link STOCK_GROUPS} themes are
 * all variants of the one Visor brand, so they resolve to its public
 * {@link VISOR_BRAND_STRATEGY}. Custom and private themes are other brands
 * (clients) whose strategy is private and not shipped in this public repo, so
 * they resolve to `null` rather than borrowing Visor's. Gating on STOCK_GROUPS
 * (not {@link findThemeEntry}) keeps this stable whether or not client themes are
 * registered. The first Brand Workbench surface (VI-506) introduces this reader;
 * VI-507/508/509 reuse it.
 */
export function resolveBrandStrategy(theme: string): BrandStrategy | null {
  const isVisorStockTheme = STOCK_GROUPS.some((group) =>
    group.themes.some((t) => t.value === theme),
  );
  return isVisorStockTheme ? VISOR_BRAND_STRATEGY : null;
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
