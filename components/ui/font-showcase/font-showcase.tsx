"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./font-showcase.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FontWeightSpecimen {
  label: string
  value: number
}

export interface FontShowcaseProps {
  /** CSS custom property token for font-family (e.g. "--font-heading") */
  token: string
  /** Display role (e.g. "Heading & Body", "Monospace") */
  role: string
  /** Font family display name — omit to read dynamically from the CSS token */
  familyName?: string
  /** Available weights to display */
  weights: FontWeightSpecimen[]
  className?: string
}

export interface FontShowcaseGridProps {
  fonts: FontShowcaseProps[]
  className?: string
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Resolves the first font name from a CSS custom property by applying it to a
 * hidden span and reading the computed fontFamily. Re-syncs on theme class changes.
 */
function useLiveFontName(token: string): string {
  const [name, setName] = React.useState("")

  React.useEffect(() => {
    const span = document.createElement("span")
    Object.assign(span.style, {
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      fontFamily: `var(${token})`,
    })
    document.body.appendChild(span)

    function read() {
      const ff = getComputedStyle(span).fontFamily
      // Parse first font name: "PP Model Plastic", sans-serif → PP Model Plastic
      const first = ff.split(",")[0].trim().replace(/^["']|["']$/g, "")
      setName(first || token)
    }

    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    obs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] })

    return () => {
      obs.disconnect()
      span.remove()
    }
  }, [token])

  return name
}

// ─── FontShowcase ───────────────────────────────────────────────────────────

function FontShowcase({
  token,
  role,
  familyName,
  weights,
  className,
}: FontShowcaseProps) {
  const fontFamily = `var(${token})`
  const liveName = useLiveFontName(token)
  const displayName = familyName ?? liveName

  return (
    <div data-slot="font-showcase" className={cn(styles.card, className)}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.familyName} style={{ fontFamily }}>
            {displayName}
          </span>
          <Text size="xs" color="secondary" as="span">{role}</Text>
          <code className={styles.token}>{token}</code>
        </div>
      </div>

      <span
        className={styles.hero}
        style={{ fontFamily }}
        aria-hidden="true"
      >
        Aa
      </span>

      <hr className={styles.divider} />

      <div className={styles.weights}>
        {weights.map((w) => (
          <div key={w.value} className={styles.weightRow}>
            <span
              className={styles.weightSample}
              style={{ fontFamily, fontWeight: w.value }}
            >
              The quick brown fox jumps
            </span>
            <div className={styles.weightMeta}>
              <Text size="xs" color="secondary" as="span">{w.label}</Text>
              <code className={styles.weightValue}>{w.value}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FontShowcaseGrid ───────────────────────────────────────────────────────

function FontShowcaseGrid({ fonts, className }: FontShowcaseGridProps) {
  return (
    <div data-slot="font-showcase-grid" className={cn(styles.grid, className)}>
      {fonts.map((font) => (
        <FontShowcase key={font.token} {...font} />
      ))}
    </div>
  )
}

export { FontShowcase, FontShowcaseGrid }
