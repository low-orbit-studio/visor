/**
 * Tier 2: Semantic Tokens
 *
 * Tokens named by PURPOSE. They map to primitive token names.
 * These describe intent, not raw values.
 *
 * All values reference primitive token names (without the -- prefix).
 * The generator resolves these to var(--color-*) references.
 */

/** Text color tokens */
export const semanticText = {
  // Core text hierarchy
  primary: "color-gray-900",
  secondary: "color-gray-600",
  tertiary: "color-gray-400",
  disabled: "color-gray-300",
  inverse: "color-white",
  "inverse-secondary": "color-gray-200",

  // Interactive text
  link: "color-blue-600",
  "link-hover": "color-blue-700",

  // Feedback text
  success: "color-green-700",
  warning: "color-amber-700",
  error: "color-red-700",
  info: "color-sky-700",
} as const;

/** Surface (background) color tokens */
export const semanticSurface = {
  // Core surfaces
  page: "color-white",
  card: "color-white",
  subtle: "color-gray-50",
  muted: "color-gray-100",
  overlay: "color-gray-900",

  // Interactive surfaces
  "interactive-default": "color-white",
  "interactive-hover": "color-gray-50",
  "interactive-active": "color-gray-100",
  "interactive-disabled": "color-gray-50",

  // Brand/accent surfaces
  "accent-subtle": "color-blue-50",
  "accent-default": "color-blue-500",
  "accent-strong": "color-blue-600",

  // Feedback surfaces
  "success-subtle": "color-green-50",
  "success-default": "color-green-500",
  "warning-subtle": "color-amber-50",
  "warning-default": "color-amber-500",
  "error-subtle": "color-red-50",
  "error-default": "color-red-500",
  "info-subtle": "color-sky-50",
  "info-default": "color-sky-500",
} as const;

/** Border color tokens */
export const semanticBorder = {
  // Core borders
  default: "color-gray-200",
  muted: "color-gray-100",
  strong: "color-gray-300",
  focus: "color-blue-500",
  disabled: "color-gray-100",

  // Feedback borders
  success: "color-green-500",
  warning: "color-amber-500",
  error: "color-red-500",
  info: "color-sky-500",
} as const;

/** Interactive element tokens */
export const semanticInteractive = {
  // Primary action (maps to brand/accent)
  "primary-bg": "color-blue-600",
  "primary-bg-hover": "color-blue-700",
  "primary-bg-active": "color-blue-800",
  "primary-text": "color-white",

  // Secondary action (outlined/ghost style)
  "secondary-bg": "color-white",
  "secondary-bg-hover": "color-gray-50",
  "secondary-bg-active": "color-gray-100",
  "secondary-text": "color-gray-900",
  "secondary-border": "color-gray-300",

  // Destructive action
  "destructive-bg": "color-red-600",
  "destructive-bg-hover": "color-red-700",
  "destructive-text": "color-white",

  // Ghost action
  "ghost-bg": "color-white",
  "ghost-bg-hover": "color-gray-100",
} as const;

/** Component spacing tokens (map to spacing primitives) */
export const semanticSpacing = {
  "component-xs": "spacing-1",
  "component-sm": "spacing-2",
  "component-md": "spacing-4",
  "component-lg": "spacing-6",
  "component-xl": "spacing-8",
  "layout-sm": "spacing-4",
  "layout-md": "spacing-8",
  "layout-lg": "spacing-12",
  "layout-xl": "spacing-16",
  "layout-2xl": "spacing-24",
} as const;

/** Motion duration tokens */
export const semanticMotionDuration = {
  // Micro-interactions: tooltips, hovers, small state changes
  fast: "motion-duration-100",
  // Standard transitions: modals, drawers, panels
  normal: "motion-duration-200",
  // Larger animations: page transitions, complex choreography
  slow: "motion-duration-500",
} as const;

/** Motion easing tokens */
export const semanticMotionEasing = {
  // General purpose easing for most transitions
  default: "motion-easing-ease-in-out",
  // Elements appearing / entering the viewport
  enter: "motion-easing-ease-out",
  // Elements leaving / exiting the viewport
  exit: "motion-easing-ease-in",
  // Bouncy / playful interactions
  spring: "motion-easing-spring",
} as const;

/**
 * Overlay tokens — intentionally empty.
 * Overlay tokens (--overlay-bg) are emitted only at the primitive layer.
 * The semantic layer previously re-emitted them as --overlay-bg: var(--overlay-bg)
 * which created a circular reference. Since the semantic name matches the primitive
 * name exactly, no semantic alias is needed.
 */
export const semanticOverlay: Record<string, string> = {} as const;

/**
 * Focus ring tokens — intentionally empty.
 * Focus ring tokens (--focus-ring-width, --focus-ring-offset) are emitted only at
 * the primitive layer. Same circular-reference issue as overlay.
 */
export const semanticFocusRing: Record<string, string> = {} as const;

/** Typography role tokens */
export const semanticTypography = {
  // Font family roles
  "font-body": "font-sans",
  "font-heading": "font-sans",
  "font-mono": "font-mono",

  // Size roles
  "size-body": "font-size-base",
  "size-body-sm": "font-size-sm",
  "size-label": "font-size-sm",
  "size-caption": "font-size-xs",
  "size-heading-sm": "font-size-lg",
  "size-heading-md": "font-size-xl",
  "size-heading-lg": "font-size-2xl",
  "size-heading-xl": "font-size-3xl",

  // Weight roles
  "weight-body": "font-weight-normal",
  "weight-label": "font-weight-medium",
  "weight-heading": "font-weight-semibold",
  "weight-strong": "font-weight-bold",
} as const;
