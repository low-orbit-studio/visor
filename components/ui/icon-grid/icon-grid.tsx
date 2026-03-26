import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./icon-grid.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IconGridItemProps {
  /** Display name for the icon */
  name: string
  /** Usage description (e.g. "Search", "Home / dashboard") */
  usage: string
  /** The rendered icon element */
  icon: React.ReactNode
}

export interface IconGridProps {
  /** Array of icon items to display */
  icons: IconGridItemProps[]
  className?: string
}

export interface IconSizeRowProps {
  /** Array of sizes with icon elements to display */
  sizes: { size: number; icon: React.ReactNode }[]
  className?: string
}

// ─── IconGrid ───────────────────────────────────────────────────────────────

function IconGrid({ icons, className }: IconGridProps) {
  return (
    <div data-slot="icon-grid" className={cn(styles.grid, className)}>
      {icons.map((item) => (
        <div key={item.name} className={styles.gridItem}>
          <div className={styles.gridBox}>
            {item.icon}
          </div>
          <Text size="xs" weight="medium" as="span">{item.name}</Text>
          <Text size="xs" color="tertiary" as="span">{item.usage}</Text>
        </div>
      ))}
    </div>
  )
}

// ─── IconSizeRow ────────────────────────────────────────────────────────────

function IconSizeRow({ sizes, className }: IconSizeRowProps) {
  return (
    <div data-slot="icon-size-row" className={cn(styles.sizeRow, className)}>
      {sizes.map(({ size, icon }) => (
        <div key={size} className={styles.sizeItem}>
          <div className={styles.sizeBox}>
            {icon}
          </div>
          <Text size="xs" color="secondary" as="span">{size}px</Text>
        </div>
      ))}
    </div>
  )
}

export { IconGrid, IconSizeRow }
