import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock three.js before any imports that might use it
vi.mock("three", () => ({
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement("canvas"),
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
  AdditiveBlending: 2,
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
    expect(screen.getByRole("slider", { name: "Dot size" })).toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Blur" })).toBeInTheDocument()
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

  it("accepts className prop", () => {
    const { container } = render(<SpherePlayground className="custom" />)
    expect(container.firstChild).toHaveClass("custom")
  })

  it("calls onCodeChange with all props on mount", () => {
    const onCodeChange = vi.fn()
    render(<SpherePlayground onCodeChange={onCodeChange} />)
    const code = onCodeChange.mock.calls.at(-1)?.[0] as string
    expect(code).toContain('mode="sphere"')
    expect(code).toContain("scale={1}")
    expect(code).toContain("dotSize={0.4}")
    expect(code).toContain("saturation={1.8}")
    expect(code).toContain("thinkEffects=")
  })

  it("calls onCodeChange with non-default props", () => {
    const onCodeChange = vi.fn()
    render(
      <SpherePlayground
        defaultMode="lorenz"
        defaultColorScheme="ember"
        onCodeChange={onCodeChange}
      />,
    )
    const lastCall = onCodeChange.mock.calls.at(-1)?.[0] as string
    expect(lastCall).toContain('mode="lorenz"')
    expect(lastCall).toContain('colorScheme="ember"')
  })

  it("renders draggable panel", () => {
    const { container } = render(<SpherePlayground />)
    expect(container.querySelector("[data-draggable='true']")).toBeInTheDocument()
  })

  // Note: a11y check skipped — axe-core requires canvas getContext which
  // jsdom does not support, and the Sphere component renders a canvas element.
  // Accessibility is covered by the ConfigurationPanel's own tests.
})
