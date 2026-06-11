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
 * Phase 2 wave-1 DRAFT additions to the Brand Record (VI-540), authored as
 * content ahead of the schema. The engine's {@link BrandStrategy} type does not
 * yet carry these fields — the schema ticket (VI-541) formalizes them there.
 * Until then they live as this docs-local extension so {@link VISOR_BRAND_STRATEGY}
 * can carry the authored content and typecheck without touching the engine schema
 * (out of scope for VI-540). Field names are provisional; VI-541 finalizes them.
 */

/** Message-house roof — the single umbrella message above the pillars. */
export interface BrandMessaging {
  /** One overarching statement the pillars support (message-house roof). */
  roof: string;
}

/** Reusable "about us" copy — short and long forms. */
export interface BrandBoilerplate {
  short: string;
  long: string;
}

/** A color-pairing rule expressed as brand intent (not a computed value). */
export interface BrandColorPairing {
  /** The token or role being used (e.g. `--primary`). */
  use: string;
  /** What it pairs against (token, role, or surface). */
  with: string;
  /** The intent — when and how the pairing is allowed. */
  rule: string;
}

/** Color-usage intent — the brand's allowed pairings. */
export interface BrandColorUsage {
  pairings: BrandColorPairing[];
}

/** A contrast target expressed as brand intent (a WCAG 2.1 AA threshold). */
export interface BrandContrastTarget {
  /** The text/UI context the target applies to. */
  context: string;
  /** The minimum contrast ratio (e.g. "4.5:1"). */
  ratio: string;
}

/** Accessibility intent — the standard and its contrast targets. */
export interface BrandAccessibility {
  /** The conformance standard. Visor targets "WCAG 2.1 AA". */
  standard: string;
  contrast: BrandContrastTarget[];
  /** How the brand applies the standard (intent, not computed results). */
  intent: string;
}

/**
 * Visor's Brand Record with the Phase 2 wave-1 draft additions. Extends the
 * engine {@link BrandStrategy}, overriding `pillars` to carry per-pillar proof
 * points (the message-house foundation / RTBs). See {@link BrandMessaging},
 * {@link BrandBoilerplate}, {@link BrandColorUsage}, {@link BrandAccessibility}.
 */
export interface VisorBrandStrategyDraft extends Omit<BrandStrategy, "pillars"> {
  /** Pillars, each with message-house proof points (RTBs) backing its claim. */
  pillars: (BrandStrategy["pillars"][number] & { proof: string[] })[];
  /** Message-house roof — the umbrella message above the pillars. */
  messaging: BrandMessaging;
  /** Permanent, brand-level signature line(s) (≈7 words or fewer). */
  taglines: string[];
  /** Reusable "about us" copy. */
  boilerplate: BrandBoilerplate;
  /** Color-usage intent — allowed pairings. */
  colorUsage: BrandColorUsage;
  /** Accessibility intent — WCAG 2.1 AA standard + contrast targets. */
  accessibility: BrandAccessibility;
}

/**
 * Visor's authored Brand Record (VI-504/VI-505; Phase 2 content VI-540) —
 * strategy + verbal identity as data. The structured projection of
 * `docs/brand/visor-brand-record.yaml`, typed against {@link VisorBrandStrategyDraft}
 * (the engine's {@link BrandStrategy} plus VI-540's draft fields) so the docs layer
 * reads it the way an agent reads the manifest's `brand_strategy` block. Hand-kept
 * in sync with the YAML, which is the human-canonical source. `visibility: "public"`
 * — only Visor's own record ships in this public repo.
 *
 * Phase 2 caveat (VI-540): the new top-level fields below — `messaging`,
 * `taglines`, `boilerplate`, `colorUsage`, `accessibility` — live here and in the
 * narrative `.md` only, NOT yet in the YAML. The engine brand-strategy validator
 * (run by `build:manifest`) rejects unknown top-level keys, and extending it is
 * VI-541's scope. VI-541 adds these keys to the YAML + validator + engine type
 * together, at which point this projection moves off {@link VisorBrandStrategyDraft}
 * onto the real engine type and full YAML parity is restored. (Per-pillar `proof`
 * IS already valid in the YAML.)
 */
export const VISOR_BRAND_STRATEGY: VisorBrandStrategyDraft = {
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
      proof: [
        "Switch theme or mode and the entire surface re-resolves — nothing is pinned to a hard-coded value.",
        "Every component reads tokens, never literals: --primary flows to semantic, then adaptive, then the rendered pixel.",
        "Change one .visor.yaml file and the whole system follows — the file is the single source the cascade derives from.",
      ],
    },
    {
      id: "openness",
      statement:
        "The whole system is open — readable by humans and agents, and free to take.",
      governs: { surfaces: ["manifest", "cli", "component-metadata"] },
      proof: [
        "An agent can discover, select, and compose a component from structured data alone — the manifest, when_to_use metadata, and an agent-first CLI.",
        "The source is open and free to take; the same file an engineer reads is the one an agent queries.",
        "Even brand strategy ships as readable data — this record — not a locked PDF.",
      ],
    },
    {
      id: "ownership",
      statement: "Copy-and-own. You hold the source; there's no lock-in, ever.",
      governs: { components: ["*"] },
      proof: [
        "npx visor add button copies real source into your project — yours to edit, with nothing to eject from.",
        "Tokens still update via npm update, so you keep design consistency without surrendering control.",
        "Copy-and-own is the starting state, not an escape hatch — there's no wrapper to fight.",
      ],
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
  // --- Phase 2 wave-1 (VI-540): messaging house, taglines/boilerplate, color-usage. ---
  messaging: {
    // The umbrella message above the three pillars: Visor's "design intent as
    // data" thesis, extended up from tokens to the whole brand.
    roof: "Design intent as data — all the way up to brand.",
  },
  taglines: ["Your entire brand system, created and encoded in one file."],
  boilerplate: {
    short:
      "Visor is an open design system that compiles a complete brand — visual and verbal — from one portable file, legible to humans and agents alike. Components are yours to copy and own; shared tokens keep every layer coherent.",
    long: "Visor is Low Orbit Studio's open design system, built on one idea: design intent should live as data — typed, portable, and machine-readable — from a single color token all the way up to a brand's voice. Components are copy-and-own, so `npx visor add` drops real source into your project for you to edit, while shared tokens keep design consistent across every app through `npm update`. A theme is a complete design system carried in one `.visor.yaml` file; change the file and the whole surface re-resolves, light to dark, one brand to another. And because that same file reads cleanly to people and agents alike, Visor is as legible to the engineer editing it as to the agent composing against it — coherent, open, and yours.",
  },
  colorUsage: {
    pairings: [
      {
        use: "--primary",
        with: "--surface-card / --surface-base",
        rule: "Primary is the one emphatic action per view — reserve it for the single most important action and let everything else recede to surfaces and text tokens.",
      },
      {
        use: "--accent",
        with: "--primary",
        rule: "Accent is a supporting highlight, never a second primary. Keep accent and primary visibly distinct — Visor flags them when they're near-twins, because a theme reads flat when they sit too close.",
      },
      {
        use: "--text-primary / --text-secondary",
        with: "--surface-card / --surface-base",
        rule: "Text always uses the semantic text tokens against a surface token, never raw hex, so contrast tracks the active theme instead of being pinned.",
      },
      {
        use: "--destructive",
        with: "--surface-card",
        rule: "Destructive is reserved for irreversible or error states; it is never a decorative or emphasis color.",
      },
      {
        use: "fallback neutral (Gray)",
        with: "any un-themed surface",
        rule: "Fallbacks use Gray, not Slate, so an un-themed component lands on a neutral that fits the palette instead of clashing.",
      },
    ],
  },
  accessibility: {
    standard: "WCAG 2.1 AA",
    contrast: [
      { context: "Body text and other normal-size text", ratio: "4.5:1" },
      { context: "Large text (≥ 24px, or ≥ 18.66px bold)", ratio: "3:1" },
      {
        context: "Non-text UI — icons, focus rings, control boundaries",
        ratio: "3:1",
      },
    ],
    intent:
      "Every stock Visor theme is meant to clear WCAG 2.1 AA against these targets. The theme validator surfaces pairings that fall short as a candid, non-blocking warning — 'this theme fails AA on small text' — so the author can bump the contrast or keep the warning if it's intentional.",
  },
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
