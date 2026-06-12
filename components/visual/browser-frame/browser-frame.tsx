import * as React from "react"
import { LockSimple } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./browser-frame.module.css"

export interface BrowserFrameProps {
  /** Display URL shown in the chrome bar, e.g. "sharlese.epk.pro" */
  url: string
  /** Optional real link target; the URL pill becomes a clickable anchor */
  href?: string
  /** Content rendered inside the frame below the chrome bar */
  children: React.ReactNode
  /** Additional class name applied to the outer wrapper */
  className?: string
}

/**
 * BrowserFrame — browser-chrome mockup frame.
 *
 * Ports Blacklight's `EpkFrame` component (VI-570). Renders a chrome bar with
 * three traffic-light dots, a fake URL pill with a lock icon, and an optional
 * real link. Wraps arbitrary content below the bar.
 *
 * Elevation is deliberately excluded — compose with `.lit` / `.lit-soft` /
 * `.lit-strong` from `@loworbitstudio/visor-core/utilities` to add depth.
 *
 * Focus ring color is driven by `--browser-frame-focus-color` so Blacklight
 * (and any other consumer) can bind a keyed accent without forking the component.
 */
export function BrowserFrame({ url, href, children, className }: BrowserFrameProps) {
  const pill = (
    <span className={styles.pill}>
      <LockSimple
        className={styles.pillIcon}
        aria-hidden="true"
        weight="regular"
        size={10}
      />
      {url}
    </span>
  )

  return (
    <div className={cn(styles.frame, className)}>
      <div className={styles.chrome}>
        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${url} (opens in new tab)`}
            className={styles.pillLink}
          >
            {pill}
          </a>
        ) : (
          pill
        )}
      </div>
      {children}
    </div>
  )
}

BrowserFrame.displayName = "BrowserFrame"
