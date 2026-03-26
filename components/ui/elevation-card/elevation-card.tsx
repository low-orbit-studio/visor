import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./elevation-card.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ElevationCardProps {
  /** CSS custom property token for the shadow (e.g. "--shadow-md") */
  token: string
  /** Display name (e.g. "md") */
  name: string
  className?: string
}

// ─── ElevationCard ──────────────────────────────────────────────────────────

function ElevationCard({ token, name, className }: ElevationCardProps) {
  return (
    <div
      data-slot="elevation-card"
      className={cn(styles.card, className)}
      style={{ boxShadow: `var(${token})` }}
    >
      <Text weight="medium" size="sm">{name}</Text>
      <Text size="xs" color="secondary" as="span">{token}</Text>
    </div>
  )
}

export { ElevationCard }
