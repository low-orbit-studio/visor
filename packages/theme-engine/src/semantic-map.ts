/**
 * Semantic Token Mapping Table
 *
 * Static data encoding the complete Stage 2 mapping from the interchange format spec.
 * Each token maps to a {role, shade} reference for both light and dark modes.
 *
 * Matches the existing adaptive.ts structure in packages/tokens/ exactly.
 */

import type { ColorRole, ShadeStep } from "./types.js";

// ============================================================
// Types
// ============================================================

export interface ShadeRef {
  role: ColorRole;
  shade: ShadeStep;
}

export interface ConstantRef {
  constant: string; // hex value or special key
}

export type TokenRef = ShadeRef | ConstantRef;

export function isShadeRef(ref: TokenRef): ref is ShadeRef {
  return "role" in ref;
}

export interface SemanticMapping {
  light: TokenRef;
  dark: TokenRef;
}

// ============================================================
// Special Constants
// ============================================================

/** Sentinel values resolved from config during assignment. */
export const CONFIG_BACKGROUND = "__CONFIG_BACKGROUND__";
export const CONFIG_SURFACE = "__CONFIG_SURFACE__";
export const CONFIG_DARK_BACKGROUND = "__CONFIG_DARK_BACKGROUND__";
export const CONFIG_DARK_SURFACE = "__CONFIG_DARK_SURFACE__";

// ============================================================
// Mapping Table
// ============================================================

export const SEMANTIC_TEXT_MAP: Record<string, SemanticMapping> = {
  primary: {
    light: { role: "neutral", shade: 900 },
    dark: { role: "neutral", shade: 50 },
  },
  // VI-346: rebalanced to fixed-L shades (700/300, 600/400) so AA contrast holds
  // by default for any reasonable input neutral. Shade 500 is brand-anchored
  // (variable L = input itself) and therefore forbidden for any text level that
  // must clear AA. See docs/token-rules.md and SEMANTIC_TEXT_MAP rationale.
  secondary: {
    light: { role: "neutral", shade: 700 },
    dark: { role: "neutral", shade: 300 },
  },
  tertiary: {
    light: { role: "neutral", shade: 600 },
    dark: { role: "neutral", shade: 400 },
  },
  // VI-451: deemphasized but readable — slots between tertiary and disabled.
  muted: {
    light: { role: "neutral", shade: 500 },
    dark: { role: "neutral", shade: 500 },
  },
  disabled: {
    light: { role: "neutral", shade: 300 },
    dark: { role: "neutral", shade: 600 },
  },
  inverse: {
    light: { constant: "#ffffff" },
    dark: { role: "neutral", shade: 900 },
  },
  "inverse-secondary": {
    light: { role: "neutral", shade: 200 },
    dark: { role: "neutral", shade: 700 },
  },
  link: {
    light: { role: "primary", shade: 600 },
    dark: { role: "primary", shade: 400 },
  },
  "link-hover": {
    light: { role: "primary", shade: 700 },
    dark: { role: "primary", shade: 300 },
  },
  success: {
    light: { role: "success", shade: 700 },
    dark: { role: "success", shade: 500 },
  },
  warning: {
    light: { role: "warning", shade: 700 },
    dark: { role: "warning", shade: 500 },
  },
  error: {
    light: { role: "error", shade: 700 },
    dark: { role: "error", shade: 500 },
  },
  info: {
    light: { role: "info", shade: 700 },
    dark: { role: "info", shade: 500 },
  },
};

export const SEMANTIC_SURFACE_MAP: Record<string, SemanticMapping> = {
  page: {
    light: { constant: CONFIG_BACKGROUND },
    dark: { constant: CONFIG_DARK_BACKGROUND },
  },
  card: {
    light: { constant: CONFIG_SURFACE },
    dark: { constant: CONFIG_DARK_SURFACE },
  },
  // Distinct from card: glass themes (Blackout, Modern Minimal dark) set surface-card translucent.
  // Floating panels rendered over arbitrary page content must be opaque — override this token there.
  popover: {
    light: { constant: CONFIG_SURFACE },
    dark: { constant: CONFIG_DARK_SURFACE },
  },
  subtle: {
    light: { role: "neutral", shade: 50 },
    dark: { role: "neutral", shade: 800 },
  },
  muted: {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 700 },
  },
  // VI-451: deeper than page — used by admin-ui chrome (deepest backdrop).
  screen: {
    light: { role: "neutral", shade: 50 },
    dark: { role: "neutral", shade: 950 },
  },
  // VI-451: singular elevation alias, distinct from elev-0..4. Defaults to mid (elev-2).
  elev: {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 800 },
  },
  overlay: {
    light: { role: "neutral", shade: 900 },
    dark: { role: "neutral", shade: 950 },
  },
  "interactive-default": {
    light: { constant: "#ffffff" },
    dark: { role: "neutral", shade: 800 },
  },
  "interactive-hover": {
    light: { role: "neutral", shade: 50 },
    dark: { role: "neutral", shade: 700 },
  },
  "interactive-active": {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 600 },
  },
  "interactive-disabled": {
    light: { role: "neutral", shade: 50 },
    dark: { role: "neutral", shade: 800 },
  },
  // Persistent selected-state surface (active nav item, currently-selected list row).
  // Distinct from interactive-active (transient press) and from accent-subtle (broader brand surface).
  selected: {
    light: { role: "primary", shade: 100 },
    dark: { role: "primary", shade: 800 },
  },
  "accent-subtle": {
    light: { role: "primary", shade: 50 },
    dark: { role: "primary", shade: 900 },
  },
  "accent-default": {
    light: { role: "primary", shade: 500 },
    dark: { role: "primary", shade: 500 },
  },
  "accent-strong": {
    light: { role: "primary", shade: 600 },
    dark: { role: "primary", shade: 400 },
  },
  "success-subtle": {
    light: { role: "success", shade: 50 },
    dark: { role: "success", shade: 900 },
  },
  "success-default": {
    light: { role: "success", shade: 500 },
    dark: { role: "success", shade: 500 },
  },
  "warning-subtle": {
    light: { role: "warning", shade: 50 },
    dark: { role: "warning", shade: 900 },
  },
  "warning-default": {
    light: { role: "warning", shade: 500 },
    dark: { role: "warning", shade: 500 },
  },
  "error-subtle": {
    light: { role: "error", shade: 50 },
    dark: { role: "error", shade: 900 },
  },
  "error-default": {
    light: { role: "error", shade: 500 },
    dark: { role: "error", shade: 500 },
  },
  "info-subtle": {
    light: { role: "info", shade: 50 },
    dark: { role: "info", shade: 900 },
  },
  "info-default": {
    light: { role: "info", shade: 500 },
    dark: { role: "info", shade: 500 },
  },

  // 5-tier ordinal elevation scale — deepest (0) to highest (4)
  // Light mode: BO-10 near-white ramp (white → neutral-300).
  // Dark mode: deep neutral ramp (neutral-950 → neutral-600).
  "elev-0": {
    light: { constant: "#ffffff" },
    dark: { role: "neutral", shade: 950 },
  },
  "elev-1": {
    light: { role: "neutral", shade: 50 },
    dark: { role: "neutral", shade: 900 },
  },
  "elev-2": {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 800 },
  },
  "elev-3": {
    light: { role: "neutral", shade: 200 },
    dark: { role: "neutral", shade: 700 },
  },
  "elev-4": {
    light: { role: "neutral", shade: 300 },
    dark: { role: "neutral", shade: 600 },
  },
};

export const SEMANTIC_BORDER_MAP: Record<string, SemanticMapping> = {
  default: {
    light: { role: "neutral", shade: 200 },
    dark: { role: "neutral", shade: 700 },
  },
  muted: {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 800 },
  },
  strong: {
    light: { role: "neutral", shade: 300 },
    dark: { role: "neutral", shade: 600 },
  },
  focus: {
    light: { role: "primary", shade: 500 },
    dark: { role: "primary", shade: 400 },
  },
  disabled: {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 800 },
  },
  success: {
    light: { role: "success", shade: 500 },
    dark: { role: "success", shade: 500 },
  },
  warning: {
    light: { role: "warning", shade: 500 },
    dark: { role: "warning", shade: 500 },
  },
  error: {
    light: { role: "error", shade: 500 },
    dark: { role: "error", shade: 500 },
  },
  info: {
    light: { role: "info", shade: 500 },
    dark: { role: "info", shade: 500 },
  },
};

export const SEMANTIC_INTERACTIVE_MAP: Record<string, SemanticMapping> = {
  // Primary action
  "primary-bg": {
    light: { role: "primary", shade: 600 },
    dark: { role: "primary", shade: 500 },
  },
  "primary-bg-hover": {
    light: { role: "primary", shade: 700 },
    dark: { role: "primary", shade: 400 },
  },
  "primary-bg-active": {
    light: { role: "primary", shade: 800 },
    dark: { role: "primary", shade: 300 },
  },
  "primary-text": {
    light: { constant: "#ffffff" },
    dark: { constant: "#ffffff" },
  },

  // Secondary action
  "secondary-bg": {
    light: { constant: "#ffffff" },
    dark: { role: "neutral", shade: 800 },
  },
  "secondary-bg-hover": {
    light: { role: "neutral", shade: 50 },
    dark: { role: "neutral", shade: 700 },
  },
  "secondary-bg-active": {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 600 },
  },
  "secondary-text": {
    light: { role: "neutral", shade: 900 },
    dark: { role: "neutral", shade: 50 },
  },
  "secondary-border": {
    light: { role: "neutral", shade: 300 },
    dark: { role: "neutral", shade: 600 },
  },

  // Destructive action
  "destructive-bg": {
    light: { role: "error", shade: 600 },
    dark: { role: "error", shade: 500 },
  },
  "destructive-bg-hover": {
    light: { role: "error", shade: 700 },
    dark: { role: "error", shade: 600 },
  },
  "destructive-text": {
    light: { constant: "#ffffff" },
    dark: { constant: "#ffffff" },
  },

  // Ghost action
  "ghost-bg": {
    light: { constant: "#ffffff" },
    dark: { role: "neutral", shade: 800 },
  },
  "ghost-bg-hover": {
    light: { role: "neutral", shade: 100 },
    dark: { role: "neutral", shade: 700 },
  },
};

// ============================================================
// Intent aliases (VI-451)
// ============================================================

/**
 * Bare-name intent aliases — shadcn-style flat namespace.
 * Emit as `--primary`, `--accent`, `--success`, etc. into the visor-semantic
 * layer so consumers can reference brand/feedback colors without a category
 * prefix. Themes pin per-mode values via `overrides.{light,dark}` using the
 * same bare key (e.g. `primary: "#6BEBA5"`).
 */
export const SEMANTIC_INTENT_MAP: Record<string, SemanticMapping> = {
  primary: {
    light: { role: "primary", shade: 500 },
    dark: { role: "primary", shade: 500 },
  },
  // Text color paired with --primary backgrounds. Default white; themes whose
  // primary fails AA on white pin to a graphite via overrides (entr does this).
  "primary-text": {
    light: { constant: "#ffffff" },
    dark: { constant: "#ffffff" },
  },
  accent: {
    light: { role: "accent", shade: 500 },
    dark: { role: "accent", shade: 500 },
  },
  success: {
    light: { role: "success", shade: 500 },
    dark: { role: "success", shade: 500 },
  },
  warning: {
    light: { role: "warning", shade: 500 },
    dark: { role: "warning", shade: 500 },
  },
  // shadcn naming — aliases the `error` role.
  destructive: {
    light: { role: "error", shade: 500 },
    dark: { role: "error", shade: 500 },
  },
  info: {
    light: { role: "info", shade: 500 },
    dark: { role: "info", shade: 500 },
  },
};

// ============================================================
// Hairline aliases (VI-451)
// ============================================================

/**
 * Alpha-based hairline tokens for subtle dividers and structural strokes.
 * Distinct from `--border-*` (which derives from neutral shades) — hairlines
 * are translucent on the underlying surface, so they read consistently
 * across cards stacked on different backgrounds.
 */
export const SEMANTIC_HAIRLINE_MAP: Record<string, SemanticMapping> = {
  default: {
    light: { constant: "rgba(0, 0, 0, 0.06)" },
    dark: { constant: "rgba(255, 255, 255, 0.06)" },
  },
  strong: {
    light: { constant: "rgba(0, 0, 0, 0.10)" },
    dark: { constant: "rgba(255, 255, 255, 0.10)" },
  },
};

/** All semantic maps grouped together. */
export const SEMANTIC_MAP = {
  text: SEMANTIC_TEXT_MAP,
  surface: SEMANTIC_SURFACE_MAP,
  border: SEMANTIC_BORDER_MAP,
  interactive: SEMANTIC_INTERACTIVE_MAP,
  intent: SEMANTIC_INTENT_MAP,
  hairline: SEMANTIC_HAIRLINE_MAP,
};
