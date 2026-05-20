"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "../../../lib/utils"
import {
  MAX_CHROMA,
  HUE_PREVIEW_L,
  HUE_PREVIEW_C,
  safeHexToOklch,
  oklchToHex,
  clampToSrgb,
  rgbToHex,
  isValidHex,
  normalizeHex,
} from "./oklch"
import styles from "./color-picker.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export type ColorPickerSize = "sm" | "md" | "lg"
export type ColorPickerMode = "popover" | "inline"

export interface ColorPickerProps {
  /** Controlled hex value (e.g. "#3b82f6"). */
  value?: string
  /** Uncontrolled initial value. Defaults to `#3b82f6`. */
  defaultValue?: string
  /** Fired on every continuous interaction. */
  onChange?: (hex: string) => void
  /** Fired on pointer-up / popover-close — for debounced consumers. */
  onCommit?: (hex: string) => void
  /** Render in a Radix Popover (default) or inline. */
  mode?: ColorPickerMode
  /** Affects trigger swatch size + plane height. */
  size?: ColorPickerSize
  /** Hide the hex input row. */
  showHex?: boolean
  /** Hide the L/C/H readout row. */
  showReadout?: boolean
  /** Optional hex preset chips. */
  presets?: string[]
  /** Disables interaction. */
  disabled?: boolean
  /** Forwarded to a hidden input for form submission. */
  name?: string
  /** Required for screen readers. Falls back to "Color picker". */
  "aria-label"?: string
  className?: string
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useControlledValue(
  controlled: string | undefined,
  defaultValue: string,
  onChange: ((hex: string) => void) | undefined
): [string, (next: string) => void] {
  const isControlled = controlled !== undefined
  const [internal, setInternal] = React.useState(defaultValue)
  const value = isControlled ? controlled : internal
  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next)
      onChange?.(next)
    },
    [isControlled, onChange]
  )
  return [value, setValue]
}

// ─── Surface (the actual picker UI) ─────────────────────────────────────────

interface ColorPickerSurfaceProps {
  value: string
  onChange: (hex: string) => void
  onCommit?: (hex: string) => void
  showHex: boolean
  showReadout: boolean
  presets?: string[]
  disabled?: boolean
  ariaLabel: string
}

function ColorPickerSurface({
  value,
  onChange,
  onCommit,
  showHex,
  showReadout,
  presets,
  disabled,
  ariaLabel,
}: ColorPickerSurfaceProps) {
  const planeCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const hueCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const planeWrapperRef = React.useRef<HTMLDivElement>(null)
  const hueWrapperRef = React.useRef<HTMLDivElement>(null)
  const isDraggingPlaneRef = React.useRef(false)
  const isDraggingHueRef = React.useRef(false)
  const lastRenderedHueRef = React.useRef<number>(-1)
  const animFrameRef = React.useRef<number>(0)

  const [oklch, setOklch] = React.useState<[number, number, number]>(() =>
    safeHexToOklch(value)
  )
  const [hexDraft, setHexDraft] = React.useState(value)
  const [hexValid, setHexValid] = React.useState(true)

  // Sync external value
  React.useEffect(() => {
    const [L, C, H] = safeHexToOklch(value)
    setOklch((prev) => {
      const prevHex = oklchToHex(prev[0], prev[1], prev[2])
      if (prevHex.toLowerCase() === value.toLowerCase()) return prev
      return [L, C, H]
    })
    setHexDraft(value)
    setHexValid(true)
  }, [value])

  const [L, C, H] = oklch

  // ─── Render Plane ──────────────────────────────────────────────────────
  const renderPlane = React.useCallback((hue: number) => {
    const canvas = planeCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    if (width === 0 || height === 0) return

    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let y = 0; y < height; y++) {
      const lightness = 1.0 - y / (height - 1)
      for (let x = 0; x < width; x++) {
        const chroma = (x / (width - 1)) * MAX_CHROMA
        const idx = (y * width + x) * 4

        // Out-of-gamut detection — same approach as the reference picker
        // in `packages/docs/app/create/components/oklch-picker.tsx`. We
        // compare the clamped sRGB roundtrip to the direct OKLCH→hex
        // conversion; mismatches mean the triple wasn't representable in
        // sRGB and we dim toward neutral grey.
        const clamped = clampToSrgb(lightness, chroma, hue)
        const clampedHex = rgbToHex(clamped)
        const directHex = oklchToHex(lightness, chroma, hue)
        if (clampedHex !== directHex) {
          // Out of gamut — dim toward neutral grey
          data[idx] = Math.round(clamped[0] * 0.4 + 128 * 0.6)
          data[idx + 1] = Math.round(clamped[1] * 0.4 + 128 * 0.6)
          data[idx + 2] = Math.round(clamped[2] * 0.4 + 128 * 0.6)
          data[idx + 3] = 255
        } else {
          data[idx] = clamped[0]
          data[idx + 1] = clamped[1]
          data[idx + 2] = clamped[2]
          data[idx + 3] = 255
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
    lastRenderedHueRef.current = hue
  }, [])

  // ─── Render Hue ───────────────────────────────────────────────────────
  const renderHue = React.useCallback(() => {
    const canvas = hueCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    if (width === 0 || height === 0) return

    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let x = 0; x < width; x++) {
      const hue = (x / (width - 1)) * 360
      const rgb = clampToSrgb(HUE_PREVIEW_L, HUE_PREVIEW_C, hue)

      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4
        data[idx] = rgb[0]
        data[idx + 1] = rgb[1]
        data[idx + 2] = rgb[2]
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [])

  // ─── Canvas Sizing & Initial Render ───────────────────────────────────
  React.useEffect(() => {
    const planeCanvas = planeCanvasRef.current
    const hueCanvas = hueCanvasRef.current
    if (!planeCanvas || !hueCanvas) return

    const planeRect = planeCanvas.getBoundingClientRect()
    const hueRect = hueCanvas.getBoundingClientRect()

    const maxDim = 200
    planeCanvas.width = Math.max(1, Math.min(maxDim, Math.round(planeRect.width)))
    planeCanvas.height = Math.max(
      1,
      Math.min(maxDim, Math.round(planeRect.height))
    )
    hueCanvas.width = Math.max(1, Math.min(maxDim, Math.round(hueRect.width)))
    hueCanvas.height = Math.max(1, Math.min(24, Math.round(hueRect.height)))

    renderHue()
    renderPlane(H)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderHue, renderPlane])

  // Re-render plane when hue changes
  React.useEffect(() => {
    if (lastRenderedHueRef.current === H) return
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(() => {
      renderPlane(H)
    })
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [H, renderPlane])

  // ─── Plane interaction ────────────────────────────────────────────────
  const updatePlane = React.useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = planeWrapperRef.current
      if (!wrapper) return
      const rect = wrapper.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      const newL = 1.0 - y
      const newC = x * MAX_CHROMA
      setOklch([newL, newC, H])
      const hex = oklchToHex(newL, newC, H)
      onChange(hex)
    },
    [H, onChange]
  )

  const handlePlanePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    isDraggingPlaneRef.current = true
    if ((e.target as HTMLElement).setPointerCapture) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
    updatePlane(e.clientX, e.clientY)
  }
  const handlePlanePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingPlaneRef.current || disabled) return
    updatePlane(e.clientX, e.clientY)
  }
  const handlePlanePointerUp = () => {
    if (isDraggingPlaneRef.current) {
      isDraggingPlaneRef.current = false
      onCommit?.(oklchToHex(L, C, H))
    }
  }

  const handlePlaneKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const stepL = e.shiftKey ? 0.05 : 0.01
    const stepC = e.shiftKey ? 0.05 : 0.01
    let newL = L
    let newC = C
    let handled = true
    switch (e.key) {
      case "ArrowUp":
        newL = Math.min(1, L + stepL)
        break
      case "ArrowDown":
        newL = Math.max(0, L - stepL)
        break
      case "ArrowRight":
        newC = Math.min(MAX_CHROMA, C + stepC)
        break
      case "ArrowLeft":
        newC = Math.max(0, C - stepC)
        break
      case "PageUp":
        newL = Math.min(1, L + 0.1)
        break
      case "PageDown":
        newL = Math.max(0, L - 0.1)
        break
      default:
        handled = false
    }
    if (handled) {
      e.preventDefault()
      setOklch([newL, newC, H])
      const hex = oklchToHex(newL, newC, H)
      onChange(hex)
      onCommit?.(hex)
    }
  }

  // ─── Hue interaction ──────────────────────────────────────────────────
  const updateHue = React.useCallback(
    (clientX: number) => {
      const wrapper = hueWrapperRef.current
      if (!wrapper) return
      const rect = wrapper.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const newH = x * 360
      setOklch([L, C, newH])
      const hex = oklchToHex(L, C, newH)
      onChange(hex)
    },
    [L, C, onChange]
  )

  const handleHuePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    isDraggingHueRef.current = true
    if ((e.target as HTMLElement).setPointerCapture) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
    updateHue(e.clientX)
  }
  const handleHuePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingHueRef.current || disabled) return
    updateHue(e.clientX)
  }
  const handleHuePointerUp = () => {
    if (isDraggingHueRef.current) {
      isDraggingHueRef.current = false
      onCommit?.(oklchToHex(L, C, H))
    }
  }

  const handleHueKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const step = e.shiftKey ? 15 : 1
    let newH = H
    let handled = true
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        newH = Math.min(360, H + step)
        break
      case "ArrowLeft":
      case "ArrowDown":
        newH = Math.max(0, H - step)
        break
      case "Home":
        newH = 0
        break
      case "End":
        newH = 360
        break
      default:
        handled = false
    }
    if (handled) {
      e.preventDefault()
      setOklch([L, C, newH])
      const hex = oklchToHex(L, C, newH)
      onChange(hex)
      onCommit?.(hex)
    }
  }

  // ─── Hex input ────────────────────────────────────────────────────────
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    setHexDraft(raw)
    if (raw && !raw.startsWith("#")) raw = `#${raw}`
    const normalized = normalizeHex(raw)
    if (normalized) {
      setHexValid(true)
      onChange(normalized)
    } else {
      setHexValid(raw.length === 0 || raw === "#")
    }
  }

  const handleHexBlur = () => {
    if (!hexValid) {
      setHexDraft(value)
      setHexValid(true)
    } else if (isValidHex(hexDraft)) {
      onCommit?.(hexDraft.toLowerCase())
    }
  }

  // ─── Preset chip ──────────────────────────────────────────────────────
  const handlePresetClick = (hex: string) => {
    if (disabled) return
    const normalized = normalizeHex(hex)
    if (!normalized) return
    onChange(normalized)
    onCommit?.(normalized)
  }

  // ─── Crosshair positions ──────────────────────────────────────────────
  const crosshairX = `${(C / MAX_CHROMA) * 100}%`
  const crosshairY = `${(1.0 - L) * 100}%`
  const hueIndicatorX = `${(H / 360) * 100}%`
  const currentHex = oklchToHex(L, C, H)

  return (
    <div
      className={styles.picker}
      role="group"
      aria-label={ariaLabel}
      data-disabled={disabled ? "" : undefined}
    >
      <div
        ref={planeWrapperRef}
        className={styles.planeWrapper}
        onPointerDown={handlePlanePointerDown}
        onPointerMove={handlePlanePointerMove}
        onPointerUp={handlePlanePointerUp}
        onKeyDown={handlePlaneKeyDown}
        role="slider"
        aria-label="Lightness and chroma"
        aria-valuetext={`Lightness ${L.toFixed(2)}, Chroma ${C.toFixed(3)}`}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        data-slot="color-picker-plane"
      >
        <canvas ref={planeCanvasRef} className={styles.planeCanvas} />
        <div
          className={styles.crosshair}
          style={{ left: crosshairX, top: crosshairY }}
        />
      </div>

      <div
        ref={hueWrapperRef}
        className={styles.hueWrapper}
        onPointerDown={handleHuePointerDown}
        onPointerMove={handleHuePointerMove}
        onPointerUp={handleHuePointerUp}
        onKeyDown={handleHueKeyDown}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(H)}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        data-slot="color-picker-hue"
      >
        <canvas ref={hueCanvasRef} className={styles.hueCanvas} />
        <div
          className={styles.hueIndicator}
          style={{ left: hueIndicatorX }}
        />
      </div>

      {showReadout && (
        <div className={styles.readout} aria-hidden="true">
          <span>Hue: {Math.round(H)}&deg;</span>
          <span>L: {L.toFixed(2)}</span>
          <span>C: {C.toFixed(3)}</span>
        </div>
      )}

      {showHex && (
        <div className={styles.hexRow}>
          <span
            className={styles.hexChip}
            style={{ backgroundColor: currentHex }}
            aria-hidden="true"
          />
          <input
            type="text"
            className={styles.hexInput}
            value={hexDraft}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            placeholder="#000000"
            spellCheck={false}
            autoComplete="off"
            aria-label="Hex value"
            aria-invalid={hexValid ? undefined : true}
            disabled={disabled}
          />
        </div>
      )}

      {presets && presets.length > 0 && (
        <div
          className={styles.presets}
          role="group"
          aria-label="Color presets"
          data-slot="color-picker-presets"
        >
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={styles.presetChip}
              style={{ backgroundColor: preset }}
              onClick={() => handlePresetClick(preset)}
              aria-label={`Use color ${preset}`}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ColorPicker (root) ─────────────────────────────────────────────────────

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      value: controlledValue,
      defaultValue = "#3b82f6",
      onChange: onChangeProp,
      onCommit,
      mode = "popover",
      size = "md",
      showHex = true,
      showReadout = true,
      presets,
      disabled = false,
      name,
      className,
      "aria-label": ariaLabel = "Color picker",
      ...rest
    },
    ref
  ) => {
    const [value, setValue] = useControlledValue(
      controlledValue,
      defaultValue,
      onChangeProp
    )
    const [open, setOpen] = React.useState(false)

    const triggerSizeClass =
      size === "sm"
        ? styles.triggerSm
        : size === "lg"
          ? styles.triggerLg
          : styles.triggerMd

    if (mode === "inline") {
      return (
        <div
          ref={ref}
          className={cn(styles.root, className)}
          data-slot="color-picker"
          data-mode="inline"
          {...rest}
        >
          <ColorPickerSurface
            value={value}
            onChange={setValue}
            onCommit={onCommit}
            showHex={showHex}
            showReadout={showReadout}
            presets={presets}
            disabled={disabled}
            ariaLabel={ariaLabel}
          />
          {name && <input type="hidden" name={name} value={value} />}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(styles.root, className)}
        data-slot="color-picker"
        data-mode="popover"
        {...rest}
      >
        <PopoverPrimitive.Root
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) onCommit?.(value)
          }}
        >
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              className={cn(styles.trigger, triggerSizeClass)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={`${ariaLabel}: ${value}`}
              disabled={disabled}
              data-slot="color-picker-trigger"
            >
              <span
                className={styles.triggerSwatch}
                style={{ backgroundColor: value }}
                aria-hidden="true"
              />
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              className={styles.popoverContent}
              align="start"
              sideOffset={4}
              data-slot="color-picker-content"
            >
              <ColorPickerSurface
                value={value}
                onChange={setValue}
                onCommit={onCommit}
                showHex={showHex}
                showReadout={showReadout}
                presets={presets}
                disabled={disabled}
                ariaLabel={ariaLabel}
              />
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    )
  }
)
ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
