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
  primary: "color-neutral-900",
  secondary: "color-neutral-600",
  tertiary: "color-neutral-400",
  disabled: "color-neutral-300",
  inverse: "color-white",
  "inverse-secondary": "color-neutral-200",

  // Interactive text
  link: "color-primary-600",
  "link-hover": "color-primary-700",

  // Feedback text
  success: "color-success-700",
  warning: "color-warning-700",
  error: "color-error-700",
  info: "color-info-700",
} as const;

/** Surface (background) color tokens */
export const semanticSurface = {
  // Core surfaces
  page: "color-white",
  card: "color-white",
  subtle: "color-neutral-50",
  muted: "color-neutral-100",
  overlay: "color-neutral-900",
  popover: "color-white",

  // Interactive surfaces
  "interactive-default": "color-white",
  "interactive-hover": "color-neutral-50",
  "interactive-active": "color-neutral-100",
  "interactive-disabled": "color-neutral-50",

  // Persistent selected-state surface (active nav item, currently-selected list row)
  selected: "color-primary-100",

  // Brand/accent surfaces
  "accent-subtle": "color-primary-50",
  "accent-default": "color-primary-500",
  "accent-strong": "color-primary-600",

  // Feedback surfaces
  "success-subtle": "color-success-50",
  "success-default": "color-success-500",
  "warning-subtle": "color-warning-50",
  "warning-default": "color-warning-500",
  "error-subtle": "color-error-50",
  "error-default": "color-error-500",
  "info-subtle": "color-info-50",
  "info-default": "color-info-500",

  // 5-tier ordinal elevation scale — deepest (0) to highest (4)
  // Light-mode defaults use the neutral ramp from near-white to light gray.
  // Adaptive layer (adaptive.ts) provides true per-mode dark overrides.
  "elev-0": "color-neutral-950",
  "elev-1": "color-neutral-900",
  "elev-2": "color-neutral-800",
  "elev-3": "color-neutral-700",
  "elev-4": "color-neutral-600",
} as const;

/** Border color tokens */
export const semanticBorder = {
  // Core borders
  default: "color-neutral-200",
  muted: "color-neutral-100",
  strong: "color-neutral-300",
  focus: "color-primary-500",
  disabled: "color-neutral-100",
  input: "color-neutral-200",

  // Feedback borders
  success: "color-success-500",
  warning: "color-warning-500",
  error: "color-error-500",
  info: "color-info-500",
} as const;

/** Interactive element tokens */
export const semanticInteractive = {
  // Primary action (maps to brand/accent)
  "primary-bg": "color-primary-600",
  "primary-bg-hover": "color-primary-700",
  "primary-bg-active": "color-primary-800",
  "primary-text": "color-white",

  // Secondary action (outlined/ghost style)
  "secondary-bg": "color-white",
  "secondary-bg-hover": "color-neutral-50",
  "secondary-bg-active": "color-neutral-100",
  "secondary-text": "color-neutral-900",
  "secondary-border": "color-neutral-300",

  // Destructive action
  "destructive-bg": "color-error-600",
  "destructive-bg-hover": "color-error-700",
  "destructive-text": "color-white",

  // Ghost action
  "ghost-bg": "color-white",
  "ghost-bg-hover": "color-neutral-100",
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

/** Skeleton shimmer tokens */
export const semanticSkeleton = {
  // Shimmer gradient start color (dimmer end of the sweep)
  from: "surface-muted",
  // Shimmer gradient highlight color (brighter peak of the sweep)
  to: "surface-subtle",
} as const;

/** Chart color tokens — maps to shadcn --chart-* (VI-127) */
export const semanticChart = {
  "1": "color-primary-500",
  "2": "color-success-500",
  "3": "color-warning-500",
  "4": "color-info-500",
  "5": "color-error-500",
} as const;

/** Sidebar color tokens — maps to shadcn --sidebar-* (VI-127) */
export const semanticSidebar = {
  bg: "color-neutral-50",
  text: "color-neutral-700",
  "primary-bg": "color-primary-600",
  "primary-text": "color-white",
  "accent-bg": "color-neutral-100",
  "accent-text": "color-neutral-900",
  border: "color-neutral-200",
  ring: "color-primary-500",
  "text-muted": "color-neutral-500",
} as const;
