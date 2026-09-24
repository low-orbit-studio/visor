"use client"

import * as React from "react"
import type { OrbState, ThinkingOrb as ThinkingOrbType } from "thinking-orbs"
import { cn } from "../../../lib/utils"
import styles from "./spinner.module.css"

/** The nine thinking-orbs animations. */
export type SpinnerOrbState = OrbState

/**
 * thinking-orbs is fetched the first time an orb mounts, never before (VI-660).
 * `spinner.tsx` imports this file for every Spinner, so a static import here
 * shipped the canvas engine to every consumer of the ring — a busy button,
 * a "Saving…" line — which never draws an orb.
 */
let thinkingOrb: Promise<typeof ThinkingOrbType> | undefined

function useThinkingOrb(): typeof ThinkingOrbType | null {
  const [Orb, setOrb] = React.useState<typeof ThinkingOrbType | null>(null)
  React.useEffect(() => {
    let live = true
    thinkingOrb ??= import("thinking-orbs").then((m) => m.ThinkingOrb)
    thinkingOrb.then(
      (loaded) => {
        if (live) setOrb(() => loaded)
      },
      // A chunk that fails to load leaves the box empty, as before ink resolves.
      () => {}
    )
    return () => {
      live = false
    }
  }, [])
  return Orb
}

/**
 * Spinner size → orb preset. thinking-orbs ships 20 and 64 as hand-tuned
 * designs (not a scale factor); 32 is interpolated between them upstream.
 */
const ORB_PX = { xs: 20, sm: 32, md: 64 } as const

interface OrbInk {
  /** rgb() tint for the dots — the orb keeps its depth ramp on it. */
  color?: string
  /** True when the surrounding text is light, i.e. the orb sits on a dark substrate. */
  dark: boolean
}

let probeCtx: CanvasRenderingContext2D | null | undefined

/**
 * Normalise any computed CSS colour (oklch, color-mix, hex, …) to the
 * `rgb()` form thinking-orbs accepts, by painting one pixel.
 */
function toRgb(value: string): [number, number, number] | null {
  if (probeCtx === undefined) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    probeCtx = canvas.getContext("2d", { willReadFrequently: true })
  }
  if (!probeCtx || !value) return null
  probeCtx.clearRect(0, 0, 1, 1)
  probeCtx.fillStyle = value
  probeCtx.fillRect(0, 0, 1, 1)
  const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function readInk(host: HTMLElement, probe: HTMLElement): OrbInk | null {
  const text = toRgb(getComputedStyle(host).color)
  const tint = toRgb(getComputedStyle(probe).color)
  if (!text || !tint) return null
  const [r, g, b] = text
  return {
    color: `rgb(${tint.join(", ")})`,
    dark: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5,
  }
}

/**
 * Resolve the orb's ink from Visor's tokens rather than thinking-orbs' own
 * `auto` detection, which only knows a `.dark`/`.light` class or the OS
 * preference and so misreads Visor's `html:not(.dark)` light mode. Re-reads
 * when the root theme or the OS scheme changes.
 */
function useOrbInk(
  hostRef: React.RefObject<HTMLSpanElement | null>,
  probeRef: React.RefObject<HTMLSpanElement | null>,
  tone: string
): OrbInk | null {
  const [ink, setInk] = React.useState<OrbInk | null>(null)

  React.useLayoutEffect(() => {
    const host = hostRef.current
    const probe = probeRef.current
    if (!host || !probe) return
    const read = () => {
      const next = readInk(host, probe)
      setInk((prev) =>
        prev?.color === next?.color && prev?.dark === next?.dark ? prev : next
      )
    }
    read()
    const observer = new MutationObserver(read)
    for (const el of [document.documentElement, document.body]) {
      observer.observe(el, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      })
    }
    const scheme =
      typeof matchMedia === "undefined"
        ? null
        : matchMedia("(prefers-color-scheme: dark)")
    scheme?.addEventListener("change", read)
    return () => {
      observer.disconnect()
      scheme?.removeEventListener("change", read)
    }
  }, [hostRef, probeRef, tone])

  return ink
}

export interface SpinnerOrbProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  state: SpinnerOrbState
  size: "xs" | "sm" | "md"
  tone: "default" | "primary"
}

const SpinnerOrb = React.forwardRef<HTMLSpanElement, SpinnerOrbProps>(
  ({ className, style, state, size, tone, children, ...props }, ref) => {
    const hostRef = React.useRef<HTMLSpanElement | null>(null)
    const probeRef = React.useRef<HTMLSpanElement | null>(null)
    const ink = useOrbInk(hostRef, probeRef, tone)
    const ThinkingOrb = useThinkingOrb()
    const px = ORB_PX[size]

    const setRef = React.useCallback(
      (node: HTMLSpanElement | null) => {
        hostRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )

    return (
      <span
        ref={setRef}
        data-slot="spinner"
        data-variant="orb"
        data-orb={state}
        data-size={size}
        data-tone={tone}
        className={cn(styles.orb, className)}
        style={{ width: px, height: px, ...style }}
        {...props}
      >
        <span
          ref={probeRef}
          className={cn(
            styles.orbInk,
            tone === "primary" && styles.orbInkPrimary
          )}
        />
        {/* The box is sized inline, so it holds still on hydrate and while
            thinking-orbs loads; the canvas mounts into it once it arrives. */}
        {ThinkingOrb ? (
          <ThinkingOrb
            state={state}
            size={px}
            theme={ink ? (ink.dark ? "dark" : "light") : "auto"}
            color={ink?.color}
            role="presentation"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </span>
    )
  }
)
SpinnerOrb.displayName = "SpinnerOrb"

export { SpinnerOrb }
