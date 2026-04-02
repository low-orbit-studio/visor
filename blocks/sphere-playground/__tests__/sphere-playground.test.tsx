import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeAll } from "vitest"

// Suppress expected jsdom errors from Three.js canvas operations
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

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
    attributes: new Proxy({} as Record<string, { needsUpdate: boolean }>, {
      get: (_t: Record<string, { needsUpdate: boolean }>, prop: string | symbol) => {
        const key = prop as string
        _t[key] = _t[key] ?? { needsUpdate: false }
        return _t[key]
      },
    }),
  })),
  BufferAttribute: vi.fn(),
  ShaderMaterial: vi.fn(() => ({
    uniforms: new Proxy(
      {
        uGradientColors: {
          value: Array.from({ length: 5 }, () => ({ setRGB: vi.fn() })),
        },
        uPulseOrigins: {
          value: Array.from({ length: 6 }, () => ({ set: vi.fn() })),
        },
        uPulseTimes: { value: new Float32Array(6) },
      } as Record<string, { value: unknown }>,
      {
        get: (_t: Record<string, { value: unknown }>, prop: string | symbol) => {
          if (prop === "then") return undefined
          const key = prop as string
          _t[key] = _t[key] ?? { value: 0 }
          return _t[key]
        },
      },
    ),
    dispose: vi.fn(),
    needsUpdate: false,
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

import { SpherePlayground } from "../sphere-playground"

describe("SpherePlayground", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(<SpherePlayground />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the configuration panel with expected sections", () => {
    render(<SpherePlayground />)
    expect(
      screen.getByRole("region", { name: "Sphere" })
    ).toBeInTheDocument()
    expect(screen.getByText("Geometry")).toBeInTheDocument()
    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByText("Color")).toBeInTheDocument()
    expect(screen.getByText("Think")).toBeInTheDocument()
  })

  it("renders geometry mode toggle options", () => {
    render(<SpherePlayground />)
    // "Sphere" appears as both panel title and toggle — check the toggle specifically
    const groups = screen.getAllByRole("group")
    expect(groups.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Curl")).toBeInTheDocument()
    expect(screen.getByText("Turing")).toBeInTheDocument()
    expect(screen.getByText("Lorenz")).toBeInTheDocument()
    expect(screen.getByText("Tendrils")).toBeInTheDocument()
  })

  it("renders color scheme toggle options", () => {
    render(<SpherePlayground />)
    expect(screen.getByText("Solar")).toBeInTheDocument()
    expect(screen.getByText("Aqua")).toBeInTheDocument()
    expect(screen.getByText("Ember")).toBeInTheDocument()
    expect(screen.getByText("Aurora")).toBeInTheDocument()
    expect(screen.getByText("Ghost")).toBeInTheDocument()
  })

  it("renders all sliders", () => {
    render(<SpherePlayground />)
    expect(screen.getByRole("slider", { name: "Size" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Waves" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Speed" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Particle count" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Sparkle chance" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Saturation" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Lightness" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Think intensity" })).toBeInTheDocument()
  })

  it("renders think effect toggle options", () => {
    render(<SpherePlayground />)
    expect(screen.getByText("Pulses")).toBeInTheDocument()
    expect(screen.getByText("Ramp")).toBeInTheDocument()
    expect(screen.getByText("Scatter")).toBeInTheDocument()
  })

  // ─── Props ──────────────────────────────────────────────────────────

  it("accepts className prop", () => {
    const { container } = render(<SpherePlayground className="custom" />)
    expect(container.firstChild).toHaveClass("custom")
  })

  it("accepts style prop", () => {
    const { container } = render(
      <SpherePlayground style={{ maxWidth: "600px" }} />,
    )
    expect((container.firstChild as HTMLElement).style.maxWidth).toBe("600px")
  })

  it("renders draggable panel", () => {
    const { container } = render(<SpherePlayground />)
    expect(container.querySelector("[data-draggable='true']")).toBeInTheDocument()
  })

  it("defaultCollapsed starts panel collapsed", () => {
    const { container } = render(<SpherePlayground defaultCollapsed />)
    const contentWrapper = container.querySelector(
      "[class*='contentWrapper']"
    ) as HTMLElement
    expect(contentWrapper).toHaveAttribute("data-collapsed", "true")
  })

  it("defaultMode sets initial geometry toggle", () => {
    render(<SpherePlayground defaultMode="lorenz" />)
    const lorenzButton = screen.getByText("Lorenz").closest("button")
    expect(lorenzButton).toHaveAttribute("data-state", "on")
  })

  it("defaultColorScheme sets initial color toggle", () => {
    render(<SpherePlayground defaultColorScheme="ember" />)
    const emberButton = screen.getByText("Ember").closest("button")
    expect(emberButton).toHaveAttribute("data-state", "on")
  })

  // ─── Interactions ───────────────────────────────────────────────────

  it("clicking geometry toggle changes active mode", async () => {
    const user = userEvent.setup()
    render(<SpherePlayground />)

    const lorenzButton = screen.getByText("Lorenz").closest("button")!
    await user.click(lorenzButton)
    expect(lorenzButton).toHaveAttribute("data-state", "on")

    // "Sphere" text appears in panel title too — find the toggle button specifically
    const sphereButtons = screen.getAllByText("Sphere")
    const sphereToggle = sphereButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn?.getAttribute("role") === "radio")
    expect(sphereToggle).toHaveAttribute("data-state", "off")
  })

  it("clicking color scheme toggle changes active scheme", async () => {
    const user = userEvent.setup()
    render(<SpherePlayground />)

    const aquaButton = screen.getByText("Aqua").closest("button")!
    await user.click(aquaButton)
    expect(aquaButton).toHaveAttribute("data-state", "on")

    const solarButton = screen.getByText("Solar").closest("button")!
    expect(solarButton).toHaveAttribute("data-state", "off")
  })

  it("toggling think effects supports multi-select", async () => {
    const user = userEvent.setup()
    render(<SpherePlayground />)

    // All start as "on"
    const pulsesButton = screen.getByText("Pulses").closest("button")!
    expect(pulsesButton).toHaveAttribute("data-state", "on")

    // Toggle one off
    await user.click(pulsesButton)
    expect(pulsesButton).toHaveAttribute("data-state", "off")

    // Others remain on
    const rampButton = screen.getByText("Ramp").closest("button")!
    expect(rampButton).toHaveAttribute("data-state", "on")
  })

  // ─── Code generation ───────────────────────────────────────────────

  it("calls onCodeChange with all props on mount", () => {
    const onCodeChange = vi.fn()
    render(<SpherePlayground onCodeChange={onCodeChange} />)
    const code = onCodeChange.mock.calls.at(-1)?.[0] as string
    expect(code).toContain('mode="sphere"')
    expect(code).toContain('colorScheme="solar"')
    expect(code).toContain("scale={1}")
    expect(code).toContain("waves={1}")
    expect(code).toContain("speed={1}")
    expect(code).toContain("particleCount={128000}")
    expect(code).toContain("sparkleChance={0.01}")
    expect(code).toContain("saturation={1.8}")
    expect(code).toContain("lightness={0.8}")
    expect(code).toContain("thinkIntensity={0}")
    expect(code).toContain("thinkEffects={")
    expect(code).toContain("pulses: true")
    expect(code).toContain("ramp: true")
    expect(code).toContain("scatter: true")
  })

  it("calls onCodeChange with non-default mode and scheme", () => {
    const onCodeChange = vi.fn()
    render(
      <SpherePlayground
        defaultMode="lorenz"
        defaultColorScheme="ember"
        onCodeChange={onCodeChange}
      />,
    )
    const code = onCodeChange.mock.calls.at(-1)?.[0] as string
    expect(code).toContain('mode="lorenz"')
    expect(code).toContain('colorScheme="ember"')
  })

  it("code generation updates when geometry toggle is clicked", async () => {
    const user = userEvent.setup()
    const onCodeChange = vi.fn()
    render(<SpherePlayground onCodeChange={onCodeChange} />)

    await user.click(screen.getByText("Lorenz").closest("button")!)

    const code = onCodeChange.mock.calls.at(-1)?.[0] as string
    expect(code).toContain('mode="lorenz"')
  })

  it("code generation updates when think effects are toggled", async () => {
    const user = userEvent.setup()
    const onCodeChange = vi.fn()
    render(<SpherePlayground onCodeChange={onCodeChange} />)

    await user.click(screen.getByText("Ramp").closest("button")!)

    const code = onCodeChange.mock.calls.at(-1)?.[0] as string
    expect(code).toContain("ramp: false")
    expect(code).toContain("pulses: true")
  })

  it("renders without onCodeChange (no crash)", () => {
    expect(() => render(<SpherePlayground />)).not.toThrow()
  })

  // ─── Display formatting ────────────────────────────────────────────

  it("displays default particle count as 128k", () => {
    render(<SpherePlayground />)
    expect(screen.getByText("128k")).toBeInTheDocument()
  })

  it("displays default sparkle chance as 1%", () => {
    render(<SpherePlayground />)
    expect(screen.getByText("1%")).toBeInTheDocument()
  })

  it("displays default speed multiplier as 1.0", () => {
    render(<SpherePlayground />)
    // Speed slider value display
    const speedValues = screen.getAllByText("1.0")
    expect(speedValues.length).toBeGreaterThanOrEqual(1)
  })

  // Note: a11y check skipped — axe-core requires canvas getContext which
  // jsdom does not support, and the Sphere component renders a canvas element.
  // Accessibility is covered by the ConfigurationPanel's own tests.
})
