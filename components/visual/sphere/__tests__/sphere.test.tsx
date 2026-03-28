import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock three.js before any imports that might use it
vi.mock("three", () => ({
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement("canvas"),
    outputColorSpace: "",
  })),
  Scene: vi.fn(() => ({ add: vi.fn() })),
  PerspectiveCamera: vi.fn(() => ({
    position: { z: 0, clone: vi.fn(() => ({ x: 0, y: 0, z: 3.2 })) },
    aspect: 1,
    updateProjectionMatrix: vi.fn(),
  })),
  Group: vi.fn(() => ({
    add: vi.fn(),
    scale: { setScalar: vi.fn() },
    rotation: { x: 0, y: 0, z: 0, clone: vi.fn() },
  })),
  BufferGeometry: vi.fn(() => ({
    setAttribute: vi.fn(),
    dispose: vi.fn(),
    attributes: {},
  })),
  BufferAttribute: vi.fn(),
  ShaderMaterial: vi.fn(() => ({
    uniforms: {},
    dispose: vi.fn(),
  })),
  Points: vi.fn(() => ({})),
  Color: vi.fn(() => ({ setRGB: vi.fn() })),
  Vector3: vi.fn(() => ({ set: vi.fn() })),
  Clock: vi.fn(() => ({ getDelta: vi.fn(() => 0.016) })),
  Timer: vi.fn(() => ({ update: vi.fn(), getDelta: vi.fn(() => 0.016), getElapsed: vi.fn(() => 0), connect: vi.fn(), disconnect: vi.fn(), dispose: vi.fn() })),
  AdditiveBlending: 2,
  LinearSRGBColorSpace: "srgb-linear",
}))

vi.mock("three/addons/controls/OrbitControls.js", () => ({
  OrbitControls: vi.fn(() => ({
    enableDamping: false,
    dampingFactor: 0,
    enablePan: true,
    minDistance: 0,
    maxDistance: Infinity,
    autoRotate: false,
    autoRotateSpeed: 0,
    enabled: true,
    target: { clone: vi.fn(() => ({ x: 0, y: 0, z: 0 })) },
    update: vi.fn(),
    dispose: vi.fn(),
  })),
}))

// ─── Pure module tests (no Three.js needed) ─────────────────────────

describe("sphere-color", () => {
  it("round-trips RGB -> HSL -> RGB", async () => {
    const { rgbToHsl, hslToRgb } = await import("../sphere-color")
    const r = 0.8,
      g = 0.4,
      b = 0.2
    const [h, s, l] = rgbToHsl(r, g, b)
    const [r2, g2, b2] = hslToRgb(h, s, l)
    expect(r2).toBeCloseTo(r, 5)
    expect(g2).toBeCloseTo(g, 5)
    expect(b2).toBeCloseTo(b, 5)
  })

  it("handles achromatic colors", async () => {
    const { rgbToHsl, hslToRgb } = await import("../sphere-color")
    const [h, s, l] = rgbToHsl(0.5, 0.5, 0.5)
    expect(s).toBe(0)
    expect(l).toBeCloseTo(0.5)
    const [r, g, b] = hslToRgb(h, s, l)
    expect(r).toBeCloseTo(0.5, 5)
    expect(g).toBeCloseTo(0.5, 5)
    expect(b).toBeCloseTo(0.5, 5)
  })

  it("handles pure black and white", async () => {
    const { rgbToHsl } = await import("../sphere-color")
    const [, , lBlack] = rgbToHsl(0, 0, 0)
    expect(lBlack).toBe(0)
    const [, , lWhite] = rgbToHsl(1, 1, 1)
    expect(lWhite).toBe(1)
  })

  it("round-trips pure red", async () => {
    const { rgbToHsl, hslToRgb } = await import("../sphere-color")
    const [h, s, l] = rgbToHsl(1, 0, 0)
    const [r, g, b] = hslToRgb(h, s, l)
    expect(r).toBeCloseTo(1, 5)
    expect(g).toBeCloseTo(0, 5)
    expect(b).toBeCloseTo(0, 5)
  })

  it("round-trips pure green", async () => {
    const { rgbToHsl, hslToRgb } = await import("../sphere-color")
    const [h, s, l] = rgbToHsl(0, 1, 0)
    const [r, g, b] = hslToRgb(h, s, l)
    expect(r).toBeCloseTo(0, 5)
    expect(g).toBeCloseTo(1, 5)
    expect(b).toBeCloseTo(0, 5)
  })

  it("round-trips pure blue", async () => {
    const { rgbToHsl, hslToRgb } = await import("../sphere-color")
    const [h, s, l] = rgbToHsl(0, 0, 1)
    const [r, g, b] = hslToRgb(h, s, l)
    expect(r).toBeCloseTo(0, 5)
    expect(g).toBeCloseTo(0, 5)
    expect(b).toBeCloseTo(1, 5)
  })

  it("mid-gray has zero saturation", async () => {
    const { rgbToHsl } = await import("../sphere-color")
    const [, s] = rgbToHsl(0.5, 0.5, 0.5)
    expect(s).toBe(0)
  })
})

describe("sphere.types", () => {
  it("exports all 5 color schemes with 5 stops each", async () => {
    const { COLOR_SCHEMES } = await import("../sphere.types")
    const schemeKeys = Object.keys(COLOR_SCHEMES)
    expect(schemeKeys).toEqual(["solar", "aqua", "ember", "aurora", "ghost"])
    for (const key of schemeKeys) {
      const scheme = COLOR_SCHEMES[key as keyof typeof COLOR_SCHEMES]
      expect(scheme.colors).toHaveLength(5)
      expect(scheme.label).toBeTruthy()
      for (const color of scheme.colors) {
        expect(color).toHaveLength(3)
        for (const channel of color) {
          expect(channel).toBeGreaterThanOrEqual(0)
          expect(channel).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it("exports all 5 geometry modes", async () => {
    const { GEOMETRY_MODES } = await import("../sphere.types")
    expect(GEOMETRY_MODES).toEqual([
      "sphere",
      "curl",
      "turing",
      "lorenz",
      "tendrils",
    ])
  })

  it("DEFAULT_CONFIG has all expected keys", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    const requiredKeys = [
      "particleCount",
      "sphereRadius",
      "particleBaseSize",
      "particleSizeVariation",
      "particleSizeScale",
      "particleMaxSize",
      "dotSoftness",
      "alphaBase",
      "alphaBreathRange",
      "alphaDepthMin",
      "alphaFinal",
      "sparkleChance",
      "sparkleWhiteMix",
      "noiseScale",
      "noiseSpeed",
      "noiseAmplitude",
      "turbulenceScale",
      "turbulenceAmplitude",
      "swirlAmount",
      "fov",
      "cameraZ",
      "gradientColors",
      "gradientStops",
      "backgroundColor",
      "defaultScheme",
    ]
    for (const key of requiredKeys) {
      expect(DEFAULT_CONFIG).toHaveProperty(key)
    }
  })

  it("DEFAULT_CONFIG particleCount is a positive integer", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    expect(DEFAULT_CONFIG.particleCount).toBeGreaterThan(0)
    expect(Number.isInteger(DEFAULT_CONFIG.particleCount)).toBe(true)
  })

  it("DEFAULT_CONFIG numeric values are finite", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    const numericKeys = [
      "particleCount", "sphereRadius", "particleBaseSize",
      "particleSizeVariation", "particleSizeScale", "particleMaxSize",
      "dotSoftness", "alphaBase", "alphaBreathRange", "alphaDepthMin",
      "alphaFinal", "sparkleChance", "noiseScale", "noiseSpeed",
      "noiseAmplitude", "turbulenceScale", "turbulenceAmplitude",
      "swirlAmount", "fov", "cameraZ",
    ] as const
    for (const key of numericKeys) {
      expect(Number.isFinite(DEFAULT_CONFIG[key])).toBe(true)
    }
  })

  it("DEFAULT_CONFIG gradientColors has 5 stops", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    expect(DEFAULT_CONFIG.gradientColors).toHaveLength(5)
  })

  it("DEFAULT_CONFIG gradientStops are ascending", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    const stops = DEFAULT_CONFIG.gradientStops
    expect(stops).toHaveLength(5)
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i]).toBeGreaterThan(stops[i - 1])
    }
  })

  it("DEFAULT_CONFIG sparkleChance is between 0 and 1", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    expect(DEFAULT_CONFIG.sparkleChance).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_CONFIG.sparkleChance).toBeLessThanOrEqual(1)
  })

  it("DEFAULT_CONFIG noise values are positive", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    expect(DEFAULT_CONFIG.noiseAmplitude).toBeGreaterThan(0)
    expect(DEFAULT_CONFIG.turbulenceAmplitude).toBeGreaterThan(0)
    expect(DEFAULT_CONFIG.swirlAmount).toBeGreaterThan(0)
  })

  it("DEFAULT_CONFIG fov is between 1 and 180", async () => {
    const { DEFAULT_CONFIG } = await import("../sphere.types")
    expect(DEFAULT_CONFIG.fov).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_CONFIG.fov).toBeLessThanOrEqual(180)
  })
})

describe("sphere-geometries", () => {
  it("generateSphere fills buffer with valid coordinates", async () => {
    const { generateSphere } = await import("../sphere-geometries")
    const count = 100
    const positions = new Float32Array(count * 3)
    const radius = 1.2
    generateSphere(positions, count, radius)

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3]
      const y = positions[i * 3 + 1]
      const z = positions[i * 3 + 2]
      const dist = Math.sqrt(x * x + y * y + z * z)
      expect(dist).toBeCloseTo(radius, 1)
    }
  })

  it("generateSphere: all points within radius + epsilon", async () => {
    const { generateSphere } = await import("../sphere-geometries")
    const count = 500
    const positions = new Float32Array(count * 3)
    const radius = 2.0
    generateSphere(positions, count, radius)

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3]
      const y = positions[i * 3 + 1]
      const z = positions[i * 3 + 2]
      const dist = Math.sqrt(x * x + y * y + z * z)
      expect(dist).toBeLessThanOrEqual(radius + 0.01)
    }
  })

  it("generateLorenz fills buffer with non-zero coordinates", async () => {
    const { generateLorenz } = await import("../sphere-geometries")
    const count = 50
    const positions = new Float32Array(count * 3)
    generateLorenz(positions, count, 1.2)

    let hasNonZero = false
    for (let i = 0; i < count * 3; i++) {
      if (positions[i] !== 0) hasNonZero = true
    }
    expect(hasNonZero).toBe(true)
  })

  it("generateLorenz: produces non-degenerate distribution", async () => {
    const { generateLorenz } = await import("../sphere-geometries")
    const count = 200
    const positions = new Float32Array(count * 3)
    generateLorenz(positions, count, 1.2)

    // Check standard deviation is > 0 (not all same point)
    let sumX = 0, sumX2 = 0
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3]
      sumX += x
      sumX2 += x * x
    }
    const meanX = sumX / count
    const variance = sumX2 / count - meanX * meanX
    expect(variance).toBeGreaterThan(0)
  })

  it("generateTendrils fills buffer completely", async () => {
    const { generateTendrils } = await import("../sphere-geometries")
    const count = 160 // divisible by 80 tendrils
    const positions = new Float32Array(count * 3)
    generateTendrils(positions, count, 1.2)

    let maxDist = 0
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3]
      const y = positions[i * 3 + 1]
      const z = positions[i * 3 + 2]
      maxDist = Math.max(maxDist, Math.sqrt(x * x + y * y + z * z))
    }
    expect(maxDist).toBeGreaterThan(0)
  })

  it("geometry generators handle count=1 without crash", async () => {
    const { generateSphere, generateLorenz, generateTendrils } =
      await import("../sphere-geometries")
    const positions = new Float32Array(3)

    expect(() => generateSphere(positions, 1, 1.0)).not.toThrow()
    expect(() => generateLorenz(positions, 1, 1.0)).not.toThrow()
    expect(() => generateTendrils(positions, 1, 1.0)).not.toThrow()
  })

  it("MODE_IDS maps all 5 modes to sequential integers", async () => {
    const { MODE_IDS } = await import("../sphere-geometries")
    expect(MODE_IDS).toEqual({
      sphere: 0,
      curl: 1,
      turing: 2,
      lorenz: 3,
      tendrils: 4,
    })
  })

  it("SHADER_DISPLACEMENTS has GLSL for all modes", async () => {
    const { SHADER_DISPLACEMENTS } = await import("../sphere-geometries")
    const modes = ["sphere", "curl", "turing", "lorenz", "tendrils"] as const
    for (const mode of modes) {
      expect(SHADER_DISPLACEMENTS[mode]).toContain("displaced")
      expect(SHADER_DISPLACEMENTS[mode]).toContain("aBasePosition")
    }
  })
})

describe("sphere-shaders", () => {
  it("buildVertexShader contains expected GLSL tokens", async () => {
    const { buildVertexShader } = await import("../sphere-shaders")
    const { GEOMETRY_MODES } = await import("../sphere.types")
    const shader = buildVertexShader(GEOMETRY_MODES)
    expect(shader).toContain("gl_PointSize")
    expect(shader).toContain("gl_Position")
    expect(shader).toContain("snoise")
    expect(shader).toContain("uTime")
    expect(shader).toContain("uThinkIntensity")
    expect(shader).toContain("uGeometryMode")
    expect(shader).toContain("switch (uGeometryMode)")
    // All 5 cases should be present
    expect(shader).toContain("case 0:")
    expect(shader).toContain("case 4:")
  })

  it("buildFragmentShader contains expected GLSL tokens", async () => {
    const { buildFragmentShader } = await import("../sphere-shaders")
    const shader = buildFragmentShader()
    expect(shader).toContain("gl_FragColor")
    expect(shader).toContain("gl_PointCoord")
    expect(shader).toContain("uGradientColors")
    expect(shader).toContain("uDotSoftness")
    expect(shader).toContain("vPulseBrightness")
    expect(shader).toContain("discard")
  })

  it("SIMPLEX_NOISE_GLSL contains noise functions", async () => {
    const { SIMPLEX_NOISE_GLSL } = await import("../sphere-shaders")
    expect(SIMPLEX_NOISE_GLSL).toContain("float snoise(vec3 v)")
    expect(SIMPLEX_NOISE_GLSL).toContain("vec3 curlNoise(vec3 p)")
  })
})

// ─── React component tests ──────────────────────────────────────────

describe("Sphere component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders a container div with correct role and aria-label", async () => {
    const { Sphere } = await import("../sphere")
    render(<Sphere />)
    const container = screen.getByRole("img")
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute(
      "aria-label",
      "Particle sphere visualization",
    )
  })

  it("applies custom className", async () => {
    const { Sphere } = await import("../sphere")
    render(<Sphere className="my-custom-class" />)
    const container = screen.getByRole("img")
    expect(container).toHaveClass("my-custom-class")
  })

  it("applies custom style", async () => {
    const { Sphere } = await import("../sphere")
    render(<Sphere style={{ width: "400px", height: "300px" }} />)
    const container = screen.getByRole("img")
    expect(container.style.width).toBe("400px")
    expect(container.style.height).toBe("300px")
  })

  it("unmount does not throw", async () => {
    const { Sphere } = await import("../sphere")
    const { unmount } = render(<Sphere />)
    expect(() => unmount()).not.toThrow()
  })
})
