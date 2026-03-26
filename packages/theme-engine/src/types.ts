/**
 * Types for the Visor Theme Engine
 *
 * Covers the full pipeline: .visor.yaml config → shade scales → semantic tokens → CSS output.
 */

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

// ============================================================
// Config Types (.visor.yaml)
// ============================================================

export interface VisorThemeConfig {
  name: string;
  version: 1;
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
    heading?: {
      family?: string;
      weight?: number;
    };
    body?: {
      family?: string;
      weight?: number;
    };
    mono?: {
      family?: string;
    };
    "letter-spacing"?: {
      tight?: string;
      normal?: string;
      wide?: string;
    };
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
    heading: { family: string; weight: number };
    body: { family: string; weight: number };
    mono: { family: string };
  };
  spacing: { base: number };
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  shadows: { xs: string; sm: string; md: string; lg: string; xl: string };
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
