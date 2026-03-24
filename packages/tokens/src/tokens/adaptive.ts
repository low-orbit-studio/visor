/**
 * Tier 3: Adaptive Tokens
 *
 * Theme-aware tokens that switch values based on the active theme class.
 * These reference semantic token names (without the -- prefix).
 * The generator resolves these to var(--*) references.
 *
 * Structure: { tokenName: { light: semanticOrPrimitiveRef, dark: semanticOrPrimitiveRef } }
 *
 * Light theme is applied to :root. Dark theme is applied to .theme-dark.
 */

export interface AdaptiveTokenValue {
  light: string;
  dark: string;
}

/** Adaptive text tokens */
export const adaptiveText: Record<string, AdaptiveTokenValue> = {
  primary: {
    light: "color-gray-900",
    dark: "color-gray-50",
  },
  secondary: {
    light: "color-gray-600",
    dark: "color-gray-400",
  },
  tertiary: {
    light: "color-gray-400",
    dark: "color-gray-500",
  },
  disabled: {
    light: "color-gray-300",
    dark: "color-gray-600",
  },
  inverse: {
    light: "color-white",
    dark: "color-gray-900",
  },
  "inverse-secondary": {
    light: "color-gray-200",
    dark: "color-gray-700",
  },
  link: {
    light: "color-blue-600",
    dark: "color-blue-400",
  },
  "link-hover": {
    light: "color-blue-700",
    dark: "color-blue-300",
  },
  success: {
    light: "color-green-700",
    dark: "color-green-500",
  },
  warning: {
    light: "color-amber-700",
    dark: "color-amber-500",
  },
  error: {
    light: "color-red-700",
    dark: "color-red-500",
  },
  info: {
    light: "color-sky-700",
    dark: "color-sky-500",
  },
};

/** Adaptive surface tokens */
export const adaptiveSurface: Record<string, AdaptiveTokenValue> = {
  page: {
    light: "color-white",
    dark: "color-gray-950",
  },
  card: {
    light: "color-white",
    dark: "color-gray-900",
  },
  subtle: {
    light: "color-gray-50",
    dark: "color-gray-800",
  },
  muted: {
    light: "color-gray-100",
    dark: "color-gray-700",
  },
  overlay: {
    light: "color-gray-900",
    dark: "color-gray-950",
  },
  "interactive-default": {
    light: "color-white",
    dark: "color-gray-800",
  },
  "interactive-hover": {
    light: "color-gray-50",
    dark: "color-gray-700",
  },
  "interactive-active": {
    light: "color-gray-100",
    dark: "color-gray-600",
  },
  "interactive-disabled": {
    light: "color-gray-50",
    dark: "color-gray-800",
  },
  "accent-subtle": {
    light: "color-blue-50",
    dark: "color-blue-900",
  },
  "accent-default": {
    light: "color-blue-500",
    dark: "color-blue-500",
  },
  "accent-strong": {
    light: "color-blue-600",
    dark: "color-blue-400",
  },
  "success-subtle": {
    light: "color-green-50",
    dark: "color-green-900",
  },
  "success-default": {
    light: "color-green-500",
    dark: "color-green-500",
  },
  "warning-subtle": {
    light: "color-amber-50",
    dark: "color-amber-900",
  },
  "warning-default": {
    light: "color-amber-500",
    dark: "color-amber-500",
  },
  "error-subtle": {
    light: "color-red-50",
    dark: "color-red-900",
  },
  "error-default": {
    light: "color-red-500",
    dark: "color-red-500",
  },
  "info-subtle": {
    light: "color-sky-50",
    dark: "color-sky-900",
  },
  "info-default": {
    light: "color-sky-500",
    dark: "color-sky-500",
  },
};

/** Adaptive border tokens */
export const adaptiveBorder: Record<string, AdaptiveTokenValue> = {
  default: {
    light: "color-gray-200",
    dark: "color-gray-700",
  },
  muted: {
    light: "color-gray-100",
    dark: "color-gray-800",
  },
  strong: {
    light: "color-gray-300",
    dark: "color-gray-600",
  },
  focus: {
    light: "color-blue-500",
    dark: "color-blue-400",
  },
  disabled: {
    light: "color-gray-100",
    dark: "color-gray-800",
  },
  success: {
    light: "color-green-500",
    dark: "color-green-500",
  },
  warning: {
    light: "color-amber-500",
    dark: "color-amber-500",
  },
  error: {
    light: "color-red-500",
    dark: "color-red-500",
  },
  info: {
    light: "color-sky-500",
    dark: "color-sky-500",
  },
};

/** Adaptive interactive tokens */
export const adaptiveInteractive: Record<string, AdaptiveTokenValue> = {
  // Primary action
  "primary-bg": {
    light: "color-blue-600",
    dark: "color-blue-500",
  },
  "primary-bg-hover": {
    light: "color-blue-700",
    dark: "color-blue-400",
  },
  "primary-bg-active": {
    light: "color-blue-800",
    dark: "color-blue-300",
  },
  "primary-text": {
    light: "color-white",
    dark: "color-white",
  },

  // Secondary action
  "secondary-bg": {
    light: "color-white",
    dark: "color-gray-800",
  },
  "secondary-bg-hover": {
    light: "color-gray-50",
    dark: "color-gray-700",
  },
  "secondary-bg-active": {
    light: "color-gray-100",
    dark: "color-gray-600",
  },
  "secondary-text": {
    light: "color-gray-900",
    dark: "color-gray-50",
  },
  "secondary-border": {
    light: "color-gray-300",
    dark: "color-gray-600",
  },

  // Destructive action
  "destructive-bg": {
    light: "color-red-600",
    dark: "color-red-500",
  },
  "destructive-bg-hover": {
    light: "color-red-700",
    dark: "color-red-600",
  },
  "destructive-text": {
    light: "color-white",
    dark: "color-white",
  },

  // Ghost action
  "ghost-bg": {
    light: "color-white",
    dark: "color-gray-800",
  },
  "ghost-bg-hover": {
    light: "color-gray-100",
    dark: "color-gray-700",
  },
};
