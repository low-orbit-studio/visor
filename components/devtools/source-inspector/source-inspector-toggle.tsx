"use client"

import * as React from "react"
import { Scan } from "@phosphor-icons/react"
import styles from "./source-inspector-toggle.module.css"
import {
  SourceInspectorProvider,
  SourceInspectorContext,
  type Mode,
} from "./source-inspector"

const MODE_LABEL: Record<Mode, string> = {
  off: "Source inspector off",
  "highlight-visor": "Highlighting Visor regions",
  "highlight-non-visor": "Highlighting non-Visor regions",
}

export interface SourceInspectorToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "title"> {
  className?: string
}

function ToggleButton({ className, ...props }: SourceInspectorToggleProps) {
  const ctx = React.useContext(SourceInspectorContext)
  if (!ctx) {
    throw new Error(
      "SourceInspectorToggle internal error: missing context. Wrap in <SourceInspectorProvider>.",
    )
  }
  const { mode, cycleMode } = ctx
  const dotClass =
    mode === "highlight-visor"
      ? styles.dotVisor
      : mode === "highlight-non-visor"
        ? styles.dotNonVisor
        : null

  return (
    <button
      type="button"
      className={className ? `${styles.button} ${className}` : styles.button}
      title={MODE_LABEL[mode]}
      aria-label={MODE_LABEL[mode]}
      data-mode={mode}
      onClick={cycleMode}
      {...props}
    >
      <Scan size={16} weight="duotone" aria-hidden="true" />
      {dotClass ? <span className={`${styles.dot} ${dotClass}`} aria-hidden="true" /> : null}
    </button>
  )
}

function ToggleDevImpl(props: SourceInspectorToggleProps) {
  const ctx = React.useContext(SourceInspectorContext)
  if (ctx) return <ToggleButton {...props} />
  return (
    <SourceInspectorProvider>
      <ToggleButton {...props} />
    </SourceInspectorProvider>
  )
}

const IS_PRODUCTION = process.env.NODE_ENV === "production"

/**
 * Phosphor `Scan` icon button that cycles the SourceInspector overlay through
 * off → highlight-visor → highlight-non-visor → off. Mounts a default
 * SourceInspectorProvider lazily if no provider is in scope, so apps can
 * mount this widget standalone without wiring up state explicitly.
 */
export function SourceInspectorToggle(props: SourceInspectorToggleProps) {
  if (IS_PRODUCTION) return null
  return <ToggleDevImpl {...props} />
}
