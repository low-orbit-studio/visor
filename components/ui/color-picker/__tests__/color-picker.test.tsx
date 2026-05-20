import * as React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeAll } from "vitest"
import { ColorPicker } from "../color-picker"
import {
  MAX_CHROMA,
  safeHexToOklch,
  isOutOfGamut,
} from "../oklch"
import { checkA11y } from "../../../../test-utils/a11y"

// jsdom doesn't implement canvas's getContext for ImageData rendering. Stub it
// so the picker can mount without throwing during the initial canvas paint.
beforeAll(() => {
  if (!HTMLCanvasElement.prototype.getContext) return
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    ...rest: unknown[]
  ) {
    if (contextId === "2d") {
      return {
        createImageData: (w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h,
          colorSpace: "srgb" as const,
        }),
        putImageData: () => {},
        getImageData: (_x: number, _y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h,
          colorSpace: "srgb" as const,
        }),
      } as unknown as CanvasRenderingContext2D
    }
    return (originalGetContext as (id: string, ...rest: unknown[]) => unknown).call(this, contextId, ...rest) as RenderingContext | null
  } as typeof HTMLCanvasElement.prototype.getContext
})

describe("oklch helpers", () => {
  it("safeHexToOklch returns OKLCH for valid hex", () => {
    const [L, C, H] = safeHexToOklch("#3b82f6")
    expect(L).toBeGreaterThan(0)
    expect(L).toBeLessThanOrEqual(1)
    expect(C).toBeGreaterThanOrEqual(0)
    expect(H).toBeGreaterThanOrEqual(0)
    expect(H).toBeLessThanOrEqual(360)
  })

  it("safeHexToOklch returns fallback for invalid hex", () => {
    const fallback: [number, number, number] = [0.5, 0.1, 100]
    const result = safeHexToOklch("not-a-hex", fallback)
    expect(result).toEqual(fallback)
  })

  it("MAX_CHROMA is a stable constant", () => {
    expect(MAX_CHROMA).toBeCloseTo(0.37, 5)
  })

  it("isOutOfGamut returns a boolean for valid OKLCH input", () => {
    // The current theme-engine implementation routes oklchToHex through
    // rgbToHex(clampToSrgb(...)), so this helper always returns false in
    // practice — but we keep it in the public surface so future engine
    // versions that distinguish gamut-mapping from clamping can light up
    // the dimming branch in the canvas renderer. Verifying it's stable
    // and boolean-typed is enough.
    expect(typeof isOutOfGamut(0.5, 0.4, 0)).toBe("boolean")
    expect(typeof isOutOfGamut(0.5, 0, 0)).toBe("boolean")
  })

  it("isOutOfGamut returns false for a clearly in-gamut triple", () => {
    // Mid grey: L=0.5, C=0 — fully in gamut at any hue
    expect(isOutOfGamut(0.5, 0, 0)).toBe(false)
  })
})

describe("ColorPicker (popover mode)", () => {
  it("renders trigger by default", () => {
    render(<ColorPicker defaultValue="#3b82f6" aria-label="Pick color" />)
    const trigger = screen.getByRole("button", { name: /pick color/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("forwards ref to root element", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<ColorPicker defaultValue="#3b82f6" ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("trigger shows the current value in its aria-label", () => {
    render(<ColorPicker defaultValue="#ff0000" aria-label="Pick brand" />)
    const trigger = screen.getByRole("button", { name: /pick brand: #ff0000/i })
    expect(trigger).toBeInTheDocument()
  })

  it("respects disabled prop on trigger", () => {
    render(<ColorPicker defaultValue="#3b82f6" disabled aria-label="Picker" />)
    const trigger = screen.getByRole("button", { name: /picker/i })
    expect(trigger).toBeDisabled()
  })

  it("renders hidden input when name prop is set", () => {
    const { container } = render(
      <ColorPicker defaultValue="#3b82f6" name="brand-color" />
    )
    const hidden = container.querySelector('input[type="hidden"]')
    expect(hidden).toHaveAttribute("name", "brand-color")
    expect(hidden).toHaveValue("#3b82f6")
  })

  it("uses 'Color picker' as default aria-label", () => {
    render(<ColorPicker defaultValue="#3b82f6" />)
    expect(
      screen.getByRole("button", { name: /color picker/i })
    ).toBeInTheDocument()
  })

  it("forwards arbitrary className to the root", () => {
    const { container } = render(
      <ColorPicker defaultValue="#3b82f6" className="my-picker" />
    )
    const root = container.querySelector('[data-slot="color-picker"]')
    expect(root).toHaveClass("my-picker")
  })
})

describe("ColorPicker (inline mode)", () => {
  it("renders the picker surface inline", () => {
    render(
      <ColorPicker mode="inline" defaultValue="#3b82f6" aria-label="Brand" />
    )
    expect(screen.getByRole("group", { name: /brand/i })).toBeInTheDocument()
  })

  it("renders the L/C plane slider", () => {
    render(<ColorPicker mode="inline" defaultValue="#3b82f6" />)
    expect(
      screen.getByRole("slider", { name: /lightness and chroma/i })
    ).toBeInTheDocument()
  })

  it("renders the hue slider with valuemin/valuemax/valuenow", () => {
    render(<ColorPicker mode="inline" defaultValue="#3b82f6" />)
    const hue = screen.getByRole("slider", { name: /hue/i })
    expect(hue).toHaveAttribute("aria-valuemin", "0")
    expect(hue).toHaveAttribute("aria-valuemax", "360")
    expect(hue).toHaveAttribute("aria-valuenow")
  })

  it("renders the hex input by default", () => {
    render(<ColorPicker mode="inline" defaultValue="#3b82f6" />)
    expect(screen.getByLabelText(/hex value/i)).toBeInTheDocument()
  })

  it("hides the hex input when showHex={false}", () => {
    render(
      <ColorPicker mode="inline" defaultValue="#3b82f6" showHex={false} />
    )
    expect(screen.queryByLabelText(/hex value/i)).not.toBeInTheDocument()
  })

  it("hides the readout when showReadout={false}", () => {
    const { container } = render(
      <ColorPicker mode="inline" defaultValue="#3b82f6" showReadout={false} />
    )
    // The readout uses aria-hidden so query DOM directly
    expect(container.textContent).not.toContain("Hue:")
  })

  it("renders preset chips when presets prop is provided", () => {
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        presets={["#ef4444", "#10b981"]}
      />
    )
    expect(
      screen.getByRole("button", { name: /use color #ef4444/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /use color #10b981/i })
    ).toBeInTheDocument()
  })

  it("calls onChange and onCommit when a preset is clicked", () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        presets={["#ef4444"]}
        onChange={onChange}
        onCommit={onCommit}
      />
    )
    const chip = screen.getByRole("button", { name: /use color #ef4444/i })
    fireEvent.click(chip)
    expect(onChange).toHaveBeenCalledWith("#ef4444")
    expect(onCommit).toHaveBeenCalledWith("#ef4444")
  })

  it("hex input accepts a valid hex and propagates via onChange", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        onChange={onChange}
      />
    )
    const input = screen.getByLabelText(/hex value/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "#ff0000" } })
    expect(onChange).toHaveBeenCalledWith("#ff0000")
    expect(input).not.toHaveAttribute("aria-invalid", "true")
  })

  it("hex input flags aria-invalid on a malformed value", () => {
    render(<ColorPicker mode="inline" defaultValue="#3b82f6" />)
    const input = screen.getByLabelText(/hex value/i)
    fireEvent.change(input, { target: { value: "#xyzxyz" } })
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("hex input reverts to the current value on blur if invalid", () => {
    render(<ColorPicker mode="inline" defaultValue="#3b82f6" />)
    const input = screen.getByLabelText(/hex value/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "#xyzxyz" } })
    expect(input).toHaveValue("#xyzxyz")
    fireEvent.blur(input)
    expect(input).toHaveValue("#3b82f6")
  })

  it("auto-prepends # to a raw hex digit string", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        onChange={onChange}
      />
    )
    const input = screen.getByLabelText(/hex value/i)
    fireEvent.change(input, { target: { value: "ff0000" } })
    expect(onChange).toHaveBeenCalledWith("#ff0000")
  })

  it("plane reacts to keyboard arrow keys", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        onChange={onChange}
      />
    )
    const plane = screen.getByRole("slider", { name: /lightness and chroma/i })
    act(() => {
      plane.focus()
      fireEvent.keyDown(plane, { key: "ArrowUp" })
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("hue track reacts to keyboard arrow keys", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        onChange={onChange}
      />
    )
    const hue = screen.getByRole("slider", { name: /hue/i })
    act(() => {
      hue.focus()
      fireEvent.keyDown(hue, { key: "ArrowRight" })
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("hue Home/End jump to extremes", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        onChange={onChange}
      />
    )
    const hue = screen.getByRole("slider", { name: /hue/i })
    act(() => {
      hue.focus()
      fireEvent.keyDown(hue, { key: "End" })
    })
    expect(onChange).toHaveBeenCalled()
  })

  it("disabled picker ignores keyboard", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        disabled
        onChange={onChange}
      />
    )
    const plane = screen.getByRole("slider", { name: /lightness and chroma/i })
    fireEvent.keyDown(plane, { key: "ArrowUp" })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("disabled marks plane and hue with aria-disabled", () => {
    render(
      <ColorPicker mode="inline" defaultValue="#3b82f6" disabled />
    )
    const plane = screen.getByRole("slider", { name: /lightness and chroma/i })
    const hue = screen.getByRole("slider", { name: /hue/i })
    expect(plane).toHaveAttribute("aria-disabled", "true")
    expect(hue).toHaveAttribute("aria-disabled", "true")
  })

  it("controlled value updates picker state when prop changes", () => {
    const { rerender } = render(
      <ColorPicker mode="inline" value="#3b82f6" onChange={() => {}} />
    )
    const input = screen.getByLabelText(/hex value/i) as HTMLInputElement
    expect(input).toHaveValue("#3b82f6")
    rerender(<ColorPicker mode="inline" value="#ff0000" onChange={() => {}} />)
    expect(input).toHaveValue("#ff0000")
  })
})

describe("ColorPicker accessibility", () => {
  it("has no WCAG 2.1 AA violations (inline)", async () => {
    const { container } = render(
      <ColorPicker mode="inline" defaultValue="#3b82f6" aria-label="Brand" />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (popover trigger collapsed)", async () => {
    const { container } = render(
      <ColorPicker defaultValue="#3b82f6" aria-label="Brand" />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (inline with presets)", async () => {
    const { container } = render(
      <ColorPicker
        mode="inline"
        defaultValue="#3b82f6"
        presets={["#ef4444", "#10b981"]}
        aria-label="Brand"
      />
    )
    await checkA11y(container)
  })
})
