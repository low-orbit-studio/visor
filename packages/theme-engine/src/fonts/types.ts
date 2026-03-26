/**
 * Font resolution types for the Visor theme engine.
 */

/** Where a font is loaded from */
export type FontSource = "google-fonts" | "custom";

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
  /** Google Fonts CSS URL (only for google-fonts source) */
  cssUrl: string | null;
  /** Weights available/requested for this font */
  weights: number[];
  /** Whether italic styles are available/requested */
  italic: boolean;
  /** The font-display strategy to use */
  display: FontDisplayStrategy;
  /** Font category (sans-serif, serif, monospace, etc.) for fallback selection */
  category: string;
  /** Human-readable message for custom fonts needing manual setup */
  guidance: string | null;
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
}

/** Typography section from a .visor.yaml file */
export interface VisorTypography {
  heading?: {
    family: string;
    weight?: number;
  };
  body?: {
    family: string;
    weight?: number;
  };
  mono?: {
    family: string;
  };
  "letter-spacing"?: {
    tight?: string;
    normal?: string;
    wide?: string;
  };
}

/** Result of resolving all fonts for a theme */
export interface ThemeFontResult {
  /** Resolved heading font (if specified) */
  heading: FontResolution | null;
  /** Resolved body font (if specified) */
  body: FontResolution | null;
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
