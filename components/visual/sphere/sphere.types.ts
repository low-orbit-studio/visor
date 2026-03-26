import type * as React from "react"

// ---------------------------------------------------------------------------
// Geometry modes & color schemes
// ---------------------------------------------------------------------------

export type GeometryMode = "sphere" | "curl" | "turing" | "lorenz" | "tendrils"

export type ColorScheme = "solar" | "aqua" | "ember" | "aurora" | "ghost"

/** RGB color in 0-1 range */
export type GradientColor = [r: number, g: number, b: number]

/** 5-stop gradient from bottom to top */
export type GradientColors = [
  GradientColor,
  GradientColor,
  GradientColor,
  GradientColor,
  GradientColor,
]

export interface ColorSchemeDefinition {
  label: string
  colors: GradientColors
}

export const COLOR_SCHEMES: Record<ColorScheme, ColorSchemeDefinition> = {
  solar: {
    label: "Solar",
    colors: [
      [0.91, 0.58, 0.23],
      [0.82, 0.35, 0.55],
      [0.48, 0.31, 0.62],
      [0.56, 0.49, 0.78],
      [0.56, 0.78, 0.91],
    ],
  },
  aqua: {
    label: "Aqua",
    colors: [
      [0.0, 0.35, 0.4],
      [0.0, 0.55, 0.6],
      [0.0, 0.7, 0.78],
      [0.15, 0.82, 0.88],
      [0.5, 0.94, 1.0],
    ],
  },
  ember: {
    label: "Ember",
    colors: [
      [0.2, 0.04, 0.02],
      [0.6, 0.12, 0.03],
      [0.9, 0.35, 0.05],
      [1.0, 0.7, 0.18],
      [1.0, 0.98, 0.9],
    ],
  },
  aurora: {
    label: "Aurora",
    colors: [
      [0.1, 0.9, 0.45],
      [0.15, 0.75, 0.65],
      [0.2, 0.5, 0.8],
      [0.45, 0.3, 0.75],
      [0.7, 0.2, 0.6],
    ],
  },
  ghost: {
    label: "Ghost",
    colors: [
      [0.25, 0.25, 0.3],
      [0.4, 0.4, 0.45],
      [0.55, 0.55, 0.6],
      [0.72, 0.72, 0.75],
      [0.92, 0.92, 0.95],
    ],
  },
}

export const GEOMETRY_MODES: GeometryMode[] = [
  "sphere",
  "curl",
  "turing",
  "lorenz",
  "tendrils",
]

// ---------------------------------------------------------------------------
// Configuration defaults
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG = {
  particleCount: 256000,
  sphereRadius: 1.2,

  // Particle appearance
  particleBaseSize: 2.2,
  particleSizeVariation: 1.8,
  particleSizeScale: 500,
  particleMaxSize: 13.0,
  particlePulseAmount: 0.15,
  dotSoftness: 0.12,

  // Opacity / brightness
  alphaBase: 1.0,
  alphaBreathRange: 0.25,
  alphaDepthMin: 0.14,
  alphaFinal: 0.7,
  sparkleChance: 0.03,
  sparkleWhiteMix: 0.6,
  sparkleSizeBoost: 1.0,
  sparkleAlphaBoost: 1.8,

  // Noise displacement
  noiseScale: 1.2,
  noiseSpeed: 0.12,
  noiseAmplitude: 0.35,
  turbulenceScale: 1.0,
  turbulenceAmplitude: 0.12,
  swirlAmount: 0.06,

  // Rotation & camera
  rotationOscillationX: 0.18,
  cameraZ: 3.2,
  fov: 60,

  // Color gradient (bottom -> top)
  gradientColors: [
    [0.91, 0.58, 0.23],
    [0.82, 0.35, 0.55],
    [0.48, 0.31, 0.62],
    [0.56, 0.49, 0.78],
    [0.56, 0.78, 0.91],
  ] as GradientColors,
  gradientStops: [0.0, 0.25, 0.45, 0.65, 1.0],

  backgroundColor: 0x000000,
  defaultScheme: "solar" as ColorScheme,
} as const

// ---------------------------------------------------------------------------
// Think-mode effects
// ---------------------------------------------------------------------------

export interface SphereThinkEffects {
  /** Expanding ring waves from random surface points. Default: true */
  pulses?: boolean
  /** Speed ramp during think intensity. Default: true */
  ramp?: boolean
  /** Staccato scatter contraction heartbeat. Default: true */
  scatter?: boolean
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SphereProps {
  /** Geometry mode for particle distribution. Default: "sphere" */
  mode?: GeometryMode
  /** Named color scheme. Overridden by `colors` if both provided. Default: "solar" */
  colorScheme?: ColorScheme
  /** Custom gradient colors (5 stops, bottom to top). Overrides `colorScheme`. */
  colors?: GradientColors
  /** Number of particles. Default: 256000 */
  particleCount?: number
  /** Sphere radius. Default: 1.2 */
  radius?: number
  /** Overall scale multiplier. Default: 1.0 */
  scale?: number
  /** Animation speed multiplier. Default: 1.0 */
  speed?: number
  /** Wave displacement multiplier (noise amplitude). Default: 1.0 */
  waves?: number
  /** Particle dot size multiplier. Default: 1.0 */
  dotSize?: number
  /** Blur/softness (0 = hard dots, 1 = full glow). Default: 0.5 */
  blur?: number
  /** Color saturation multiplier. Default: 1.0 */
  saturation?: number
  /** Color lightness multiplier. Default: 1.0 */
  lightness?: number
  /** Think-mode intensity (0-1). Externally controlled. Default: 0 */
  thinkIntensity?: number
  /** Which think-mode effects are enabled. Default: all true */
  thinkEffects?: SphereThinkEffects
  /** Background color (hex number). Default: 0x000000 */
  backgroundColor?: number
  /** Camera field of view. Default: 60 */
  fov?: number
  /** Camera Z distance. Default: 3.2 */
  cameraDistance?: number
  /** Enable orbit controls (drag to rotate). Default: true */
  orbitControls?: boolean
  /** Enable auto-rotation. Default: true */
  autoRotate?: boolean
  /** Auto-rotation speed. Default: 0.5 */
  autoRotateSpeed?: number
  /** Max device pixel ratio (clamped for perf). Default: 2 */
  maxPixelRatio?: number
  /** Additional CSS class for the container div */
  className?: string
  /** Inline style for the container div */
  style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Ref API
// ---------------------------------------------------------------------------

export interface SphereRef {
  /** Start think mode with automatic ease-in ramp */
  startThinking: () => void
  /** Stop think mode with automatic ease-out ramp */
  stopThinking: () => void
  /** Get current think intensity (0-1) */
  getThinkIntensity: () => number
  /** Manually set think intensity (0-1) without ramping */
  setThinkIntensity: (value: number) => void
  /** Switch geometry mode */
  setMode: (mode: GeometryMode) => void
  /** Apply a named color scheme */
  setColorScheme: (scheme: ColorScheme) => void
  /** Apply custom gradient colors */
  setColors: (colors: GradientColors) => void
  /** Reset camera to default position with animation */
  resetCamera: () => void
  /** Force dispose of all GPU resources */
  dispose: () => void
}
