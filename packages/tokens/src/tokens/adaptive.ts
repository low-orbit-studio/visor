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
    light: "color-neutral-900",
    dark: "color-neutral-50",
  },
  secondary: {
    light: "color-neutral-600",
    dark: "color-neutral-400",
  },
  tertiary: {
    light: "color-neutral-400",
    dark: "color-neutral-500",
  },
  disabled: {
    light: "color-neutral-300",
    dark: "color-neutral-600",
  },
  inverse: {
    light: "color-white",
    dark: "color-neutral-900",
  },
  "inverse-secondary": {
    light: "color-neutral-200",
    dark: "color-neutral-700",
  },
  link: {
    light: "color-primary-600",
    dark: "color-primary-400",
  },
  "link-hover": {
    light: "color-primary-700",
    dark: "color-primary-300",
  },
  success: {
    light: "color-success-700",
    dark: "color-success-500",
  },
  warning: {
    light: "color-warning-700",
    dark: "color-warning-500",
  },
  error: {
    light: "color-error-700",
    dark: "color-error-500",
  },
  info: {
    light: "color-info-700",
    dark: "color-info-500",
  },
};

/** Adaptive surface tokens */
export const adaptiveSurface: Record<string, AdaptiveTokenValue> = {
  page: {
    light: "color-white",
    dark: "color-neutral-950",
  },
  card: {
    light: "color-white",
    dark: "color-neutral-900",
  },
  subtle: {
    light: "color-neutral-50",
    dark: "color-neutral-800",
  },
  muted: {
    light: "color-neutral-100",
    dark: "color-neutral-700",
  },
  overlay: {
    light: "color-neutral-900",
    dark: "color-neutral-950",
  },
  popover: {
    light: "color-white",
    dark: "color-neutral-900",
  },
  "interactive-default": {
    light: "color-white",
    dark: "color-neutral-800",
  },
  "interactive-hover": {
    light: "color-neutral-50",
    dark: "color-neutral-700",
  },
  "interactive-active": {
    light: "color-neutral-100",
    dark: "color-neutral-600",
  },
  "interactive-disabled": {
    light: "color-neutral-50",
    dark: "color-neutral-800",
  },
  "accent-subtle": {
    light: "color-primary-50",
    dark: "color-primary-900",
  },
  "accent-default": {
    light: "color-primary-500",
    dark: "color-primary-500",
  },
  "accent-strong": {
    light: "color-primary-600",
    dark: "color-primary-400",
  },
  "success-subtle": {
    light: "color-success-50",
    dark: "color-success-900",
  },
  "success-default": {
    light: "color-success-500",
    dark: "color-success-500",
  },
  "warning-subtle": {
    light: "color-warning-50",
    dark: "color-warning-900",
  },
  "warning-default": {
    light: "color-warning-500",
    dark: "color-warning-500",
  },
  "error-subtle": {
    light: "color-error-50",
    dark: "color-error-900",
  },
  "error-default": {
    light: "color-error-500",
    dark: "color-error-500",
  },
  "info-subtle": {
    light: "color-info-50",
    dark: "color-info-900",
  },
  "info-default": {
    light: "color-info-500",
    dark: "color-info-500",
  },
};

/** Adaptive border tokens */
export const adaptiveBorder: Record<string, AdaptiveTokenValue> = {
  default: {
    light: "color-neutral-200",
    dark: "color-neutral-700",
  },
  muted: {
    light: "color-neutral-100",
    dark: "color-neutral-800",
  },
  strong: {
    light: "color-neutral-300",
    dark: "color-neutral-600",
  },
  focus: {
    light: "color-primary-500",
    dark: "color-primary-400",
  },
  disabled: {
    light: "color-neutral-100",
    dark: "color-neutral-800",
  },
  input: {
    light: "color-neutral-200",
    dark: "color-neutral-700",
  },
  success: {
    light: "color-success-500",
    dark: "color-success-500",
  },
  warning: {
    light: "color-warning-500",
    dark: "color-warning-500",
  },
  error: {
    light: "color-error-500",
    dark: "color-error-500",
  },
  info: {
    light: "color-info-500",
    dark: "color-info-500",
  },
};

/** Adaptive interactive tokens */
export const adaptiveInteractive: Record<string, AdaptiveTokenValue> = {
  // Primary action
  "primary-bg": {
    light: "color-primary-600",
    dark: "color-primary-500",
  },
  "primary-bg-hover": {
    light: "color-primary-700",
    dark: "color-primary-400",
  },
  "primary-bg-active": {
    light: "color-primary-800",
    dark: "color-primary-300",
  },
  "primary-text": {
    light: "color-white",
    dark: "color-white",
  },

  // Secondary action
  "secondary-bg": {
    light: "color-white",
    dark: "color-neutral-800",
  },
  "secondary-bg-hover": {
    light: "color-neutral-50",
    dark: "color-neutral-700",
  },
  "secondary-bg-active": {
    light: "color-neutral-100",
    dark: "color-neutral-600",
  },
  "secondary-text": {
    light: "color-neutral-900",
    dark: "color-neutral-50",
  },
  "secondary-border": {
    light: "color-neutral-300",
    dark: "color-neutral-600",
  },

  // Destructive action
  "destructive-bg": {
    light: "color-error-600",
    dark: "color-error-500",
  },
  "destructive-bg-hover": {
    light: "color-error-700",
    dark: "color-error-600",
  },
  "destructive-text": {
    light: "color-white",
    dark: "color-white",
  },

  // Ghost action
  "ghost-bg": {
    light: "color-white",
    dark: "color-neutral-800",
  },
  "ghost-bg-hover": {
    light: "color-neutral-100",
    dark: "color-neutral-700",
  },
};

/** Adaptive skeleton shimmer tokens */
export const adaptiveSkeleton: Record<string, AdaptiveTokenValue> = {
  from: {
    light: "color-neutral-100",
    dark: "color-neutral-800",
  },
  to: {
    light: "color-neutral-200",
    dark: "color-neutral-700",
  },
};

/** Adaptive chart tokens — maps to shadcn --chart-* (VI-127) */
export const adaptiveChart: Record<string, AdaptiveTokenValue> = {
  "1": {
    light: "color-primary-500",
    dark: "color-primary-400",
  },
  "2": {
    light: "color-success-500",
    dark: "color-success-500",
  },
  "3": {
    light: "color-warning-500",
    dark: "color-warning-500",
  },
  "4": {
    light: "color-info-500",
    dark: "color-info-500",
  },
  "5": {
    light: "color-error-500",
    dark: "color-error-500",
  },
};

/** Adaptive sidebar tokens — maps to shadcn --sidebar-* (VI-127) */
export const adaptiveSidebar: Record<string, AdaptiveTokenValue> = {
  bg: {
    light: "color-neutral-50",
    dark: "color-neutral-900",
  },
  text: {
    light: "color-neutral-700",
    dark: "color-neutral-300",
  },
  "primary-bg": {
    light: "color-primary-600",
    dark: "color-primary-500",
  },
  "primary-text": {
    light: "color-white",
    dark: "color-white",
  },
  "accent-bg": {
    light: "color-neutral-100",
    dark: "color-neutral-800",
  },
  "accent-text": {
    light: "color-neutral-900",
    dark: "color-neutral-50",
  },
  border: {
    light: "color-neutral-200",
    dark: "color-neutral-700",
  },
  ring: {
    light: "color-primary-500",
    dark: "color-primary-400",
  },
  "text-muted": {
    light: "color-neutral-500",
    dark: "color-neutral-400",
  },
};
