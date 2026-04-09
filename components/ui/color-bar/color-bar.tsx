"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { toHex, needsLightText } from "../../../lib/color-utils"
import styles from "./color-bar.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ColorBarProps {
  /** CSS custom property token for the brand color (e.g. "--interactive-primary-bg") */
  token: string
  /** Label shown at the top of the bar */
  label?: string
  className?: string
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Resolves the live color value of a CSS custom property by applying it as
 * backgroundColor on a hidden probe div inside document.body (the theme scope),
 * then reading the fully-resolved getComputedStyle value.
 */
function useLiveCssColor(token: string): string | null {
  const [value, setValue] = React.useState<string | null>(null)

  React.useEffect(() => {
    const probe = document.createElement("div")
    Object.assign(probe.style, {
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      backgroundColor: `var(${token})`,
    })
    document.body.appendChild(probe)

    function read() {
      probe.style.backgroundColor = `var(${token})`
      const resolved = getComputedStyle(probe).backgroundColor
      if (resolved && resolved !== "rgba(0, 0, 0, 0)" && resolved !== "transparent") {
        setValue(toHex(resolved))
      }
    }

    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    obs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] })

    return () => {
      obs.disconnect()
      probe.remove()
    }
  }, [token])

  return value
}

// ─── ColorBar ───────────────────────────────────────────────────────────────

function ColorBar({ token, label = "Brand Color", className }: ColorBarProps) {
  const liveHex = useLiveCssColor(token)
  const useLightText = liveHex ? needsLightText(liveHex) : false
  const textColor = useLightText ? "#ffffff" : "#111827"

  return (
    <div
      data-slot="color-bar"
      className={cn(styles.bar, className)}
      style={{ background: `var(${token})` }}
    >
      <span className={styles.label} style={{ color: textColor }}>
        {label}
      </span>
      <div className={styles.footer}>
        <span className={styles.hex} style={{ color: textColor }}>
          {liveHex ?? ""}
        </span>
        <span className={styles.token} style={{ color: textColor }}>
          {token}
        </span>
      </div>
    </div>
  )
}

export { ColorBar }
