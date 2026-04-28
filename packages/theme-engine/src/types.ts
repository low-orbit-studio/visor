/**
 * Types for the Visor Theme Engine
 *
 * Covers the full pipeline: .visor.yaml config → shade scales → semantic tokens → CSS output.
 */

import type { FontSource } from "./fonts/types.js";

// ============================================================
// Shade Generation Types
// ============================================================

export type ShadeStep =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

export type ColorRole =
  | "primary"
  | "accent"
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info";

export type FullShadeScale = Record<ShadeStep, string>;
export type SelectiveShadeScale = Record<50 | 100 | 500 | 600 | 700 | 900, string>;

export type RGB = [number, number, number];
export type OKLCH = [number, number, number]; // [L, C, H] — L: 0-1, C: chroma, H: 0-360
export type RGBA = [number, number, number, number]; // [r, g, b, a] — r,g,b: 0-255, a: 0-1

export type ColorFormat = "hex" | "rgba" | "hsla" | "oklch";

export interface ParsedColor {
  rgb: RGB;
  alpha?: number; // 0-1, undefined = fully opaque
  format: ColorFormat;
  original: string; // raw input string for round-trip
}

// ============================================================
// Config Types (.visor.yaml)
// ============================================================

/**
 * The 15 Material 3 type-scale slots plus Visor's `labelXSmall` extension.
 *
 * Per-slot size / weight / letter-spacing can be overridden in
 * `typography.slots` to tune the generated Flutter `TextTheme` without
 * touching the global font families.
 */
export type MaterialTextSlot =
  | "displayLarge"
  | "displayMedium"
  | "displaySmall"
  | "headlineLarge"
  | "headlineMedium"
  | "headlineSmall"
  | "titleLarge"
  | "titleMedium"
  | "titleSmall"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall"
  | "labelXSmall";

/** Ordered list of every valid `typography.slots.*` key. */
export const MATERIAL_TEXT_SLOTS: readonly MaterialTextSlot[] = [
  "displayLarge",
  "displayMedium",
  "displaySmall",
  "headlineLarge",
  "headlineMedium",
  "headlineSmall",
  "titleLarge",
  "titleMedium",
  "titleSmall",
  "bodyLarge",
  "bodyMedium",
  "bodySmall",
  "labelLarge",
  "labelMedium",
  "labelSmall",
  "labelXSmall",
];

/** Per-slot override in `typography.slots.<slot>`. All fields optional. */
export interface TextSlotOverride {
  /** Font size in logical pixels (Flutter `TextStyle.fontSize`). */
  size?: number;
  /** Font weight (100–900, matching Flutter `FontWeight.w100..w900`). */
  weight?: number;
  /** Letter spacing in logical pixels (Flutter `TextStyle.letterSpacing`). */
  "letter-spacing"?: number;
}

export interface VisorThemeConfig {
  name: string;
  version: 1;
  /** Theme group for the docs site theme switcher (e.g. 'Visor', 'Client', 'Low Orbit'). Used by `visor theme sync`. */
  group?: string;
  /** Optional display label override for the theme switcher (e.g. 'ENTR', 'SoleSpark'). Falls back to title-cased name. */
  label?: string;
  /** Default color mode to force when the theme is activated ('dark' or 'light'). If unset, user/system preference applies. */
  "default-mode"?: "dark" | "light";
  colors: {
    primary: string;
    accent?: string;
    neutral?: string;
    background?: string;
    surface?: string;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
  "colors-dark"?: {
    primary?: string;
    accent?: string;
    neutral?: string;
    background?: string;
    surface?: string;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
  typography?: {
    scale?: number;
    heading?: {
      family?: string;
      weight?: number;
      weights?: number[];
      source?: FontSource;
      org?: string;
    };
    display?: {
      family?: string;
      weight?: number;
      weights?: number[];
      source?: FontSource;
      org?: string;
    };
    body?: {
      family?: string;
      weight?: number;
      weights?: number[];
      source?: FontSource;
      org?: string;
    };
    mono?: {
      family?: string;
      weight?: number;
      source?: FontSource;
      org?: string;
    };
    "letter-spacing"?: {
      tight?: string;
      normal?: string;
      wide?: string;
    };
    /**
     * Per-slot overrides for the generated Flutter `TextTheme`. Any subset
     * of the 16 Material slots may be specified; omitted slots fall
     * through to `VisorTextStylesData.defaults` (Material 3 2024 scale).
     * Flutter-only — ignored by CSS/NextJS adapters.
     */
    slots?: Partial<Record<MaterialTextSlot, TextSlotOverride>>;
  };
  spacing?: {
    base?: number;
  };
  radius?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    pill?: number;
  };
  shadows?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  strokeWidths?: {
    thin?: number;
    regular?: number;
    medium?: number;
    thick?: number;
  };
  motion?: {
    "duration-fast"?: string;
    "duration-normal"?: string;
    "duration-slow"?: string;
    easing?: string;
  };
  overrides?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

/** Config with all defaults resolved */
export interface ResolvedThemeConfig {
  name: string;
  version: 1;
  colors: {
    primary: string;
    accent: string;
    neutral: string | null; // null = use Tailwind Gray verbatim
    background: string;
    surface: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  "colors-dark"?: VisorThemeConfig["colors-dark"];
  typography: {
    scale: number;
    heading: { family: string; weight: number; weights?: number[]; source?: FontSource; org?: string };
    display: { family: string; weight: number; weights?: number[]; source?: FontSource; org?: string };
    body: { family: string; weight: number; weights?: number[]; source?: FontSource; org?: string };
    mono: { family: string };
    /**
     * Per-slot Material `TextTheme` overrides, passed through from the
     * raw config. Empty object when none supplied. Flutter adapter
     * consumes these; other adapters may ignore them.
     */
    slots: Partial<Record<MaterialTextSlot, TextSlotOverride>>;
  };
  spacing: { base: number };
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  shadows: { xs: string; sm: string; md: string; lg: string; xl: string };
  strokeWidths: { thin: number; regular: number; medium: number; thick: number };
  motion: {
    "duration-fast": string;
    "duration-normal": string;
    "duration-slow": string;
    easing: string;
  };
  overrides?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  /** Original color strings from user input, for round-trip export. */
  originalColors?: Record<string, string>;
  /** Color format of each user-provided color, keyed by field name. */
  colorFormats?: Record<string, ColorFormat>;
}

// ============================================================
// Pipeline Types
// ============================================================

export interface GeneratedPrimitives {
  primary: FullShadeScale;
  accent: FullShadeScale;
  neutral: FullShadeScale;
  success: SelectiveShadeScale;
  warning: SelectiveShadeScale;
  error: SelectiveShadeScale;
  info: SelectiveShadeScale;
}

export interface SemanticTokenValue {
  light: string;
  dark: string;
}

export interface SemanticTokens {
  text: Record<string, SemanticTokenValue>;
  surface: Record<string, SemanticTokenValue>;
  border: Record<string, SemanticTokenValue>;
  interactive: Record<string, SemanticTokenValue>;
}

export interface ThemeOutput {
  primitivesCss: string;
  semanticCss: string;
  lightCss: string;
  darkCss: string;
  fullBundleCss: string;
}

/** Full pipeline result including intermediate artifacts for adapter consumption. */
export interface ThemeData {
  config: ResolvedThemeConfig;
  primitives: GeneratedPrimitives;
  tokens: SemanticTokens;
  output: ThemeOutput;
}
