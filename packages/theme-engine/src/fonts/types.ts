/**
 * Font resolution types for the Visor theme engine.
 */

/** Where a font is loaded from */
export type FontSource = "google-fonts" | "visor-fonts" | "fontshare" | "local";

/** CSS font-display strategy */
export type FontDisplayStrategy =
  | "swap"
  | "block"
  | "fallback"
  | "optional"
  | "auto";

/** A single resolved font */
export interface FontResolution {
  /** The font family name as specified */
  family: string;
  /** Where this font comes from */
  source: FontSource;
  /** Hosted CSS URL (only for google-fonts or fontshare sources) */
  cssUrl: string | null;
  /** Weights available/requested for this font */
  weights: number[];
  /** Whether italic styles are available/requested */
  italic: boolean;
  /** The font-display strategy to use */
  display: FontDisplayStrategy;
  /** Font category (sans-serif, serif, monospace, etc.) for fallback selection */
  category: string;
  /** Human-readable message for local fonts needing manual setup */
  guidance: string | null;
  /** Organization namespace (only for visor-fonts source) */
  org: string | null;
  /** CDN base URL override (only for visor-fonts source; null = default fonts.visor.design) */
  cdnBase: string | null;
}

/** Options for resolving a single font */
export interface FontResolveOptions {
  /** Weights to include (default: [400, 700]) */
  weights?: number[];
  /** Include italic variants (default: false) */
  italic?: boolean;
  /** font-display strategy (default: "swap") */
  display?: FontDisplayStrategy;
  /** Font category override for custom fonts (default: "sans-serif") */
  category?: string;
  /** Font source override — skips Google Fonts lookup when set */
  source?: FontSource;
  /** Organization namespace for visor-fonts CDN (required when source is "visor-fonts" unless a cdnBase override is provided) */
  org?: string;
  /** CDN base URL override for visor-fonts (e.g., "https://fonts.knowmentum.ai"); defaults to VISOR_FONTS_CDN */
  cdnBase?: string;
}

/** Typography section from a .visor.yaml file */
export interface VisorTypography {
  heading?: {
    family: string;
    weight?: number;
    /** Explicit list of font weights to load (overrides engine defaults) */
    weights?: number[];
    source?: FontSource;
    org?: string;
  };
  display?: {
    family: string;
    weight?: number;
    /** Explicit list of font weights to load (overrides engine defaults) */
    weights?: number[];
    source?: FontSource;
    org?: string;
  };
  body?: {
    family: string;
    weight?: number;
    /** Explicit list of font weights to load (overrides engine defaults) */
    weights?: number[];
    source?: FontSource;
    org?: string;
  };
  mono?: {
    family: string;
    weight?: number;
    /** Explicit list of font weights to load (overrides engine defaults) */
    weights?: number[];
    source?: FontSource;
    org?: string;
  };
  "letter-spacing"?: {
    tight?: string;
    normal?: string;
    wide?: string;
  };
  /**
   * Per-source CDN base URL overrides. When a slot's `source` matches a key,
   * URL resolution uses the override base instead of the default CDN.
   * Currently only `visor-fonts` is supported; Google/Fontshare have no
   * analogous need.
   */
  "cdn-overrides"?: {
    "visor-fonts"?: string;
  };
}

/** Result of resolving all fonts for a theme */
export interface ThemeFontResult {
  /** Resolved heading font (if specified) */
  heading: FontResolution | null;
  /** Resolved display font (if specified) */
  display: FontResolution | null;
  /** Resolved body font (if specified) */
  body: FontResolution | null;
  /** Resolved monospace font (if specified) */
  mono: FontResolution | null;
  /** Preconnect and preload link tags */
  preloadLinks: string[];
  /** CSS @font-face + custom property overrides */
  css: string;
  /** Warnings for fonts needing manual setup */
  warnings: string[];
}

/** Entry in the Google Fonts catalog */
export interface GoogleFontEntry {
  family: string;
  weights: number[];
  styles: string[];
  category: string;
}
