import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./structured-prompt.module.css"

// StructuredPrompt — inline "mad-lib" fill-in-the-blank card
// Compound: StructuredPrompt > StructuredPromptHeader | StructuredPromptBody | StructuredPromptSlot | StructuredPromptHint

const StructuredPrompt = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="structured-prompt"
      className={cn(styles.root, className)}
      {...props}
    />
  )
)
StructuredPrompt.displayName = "StructuredPrompt"

export interface StructuredPromptHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Phosphor icon rendered before the eyebrow label. */
  icon?: React.ReactNode
}

const StructuredPromptHeader = React.forwardRef<HTMLDivElement, StructuredPromptHeaderProps>(
  ({ className, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="structured-prompt-header"
      className={cn(styles.header, className)}
      {...props}
    >
      {icon ? (
        <span data-slot="structured-prompt-header-icon" className={styles.headerIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span data-slot="structured-prompt-header-label" className={styles.headerLabel}>
        {children}
      </span>
    </div>
  )
)
StructuredPromptHeader.displayName = "StructuredPromptHeader"

const StructuredPromptBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="structured-prompt-body"
      className={cn(styles.body, className)}
      {...props}
    />
  )
)
StructuredPromptBody.displayName = "StructuredPromptBody"

export interface StructuredPromptSlotProps {
  /** When true, renders the filled (primary-tinted) chip treatment. When false/absent, renders the empty (dashed, muted) chip treatment. */
  filled?: boolean
  /** When provided, the slot renders as a <button> with focus ring. Without onClick, it renders as an inline <span>. */
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

const StructuredPromptSlot = React.forwardRef<
  HTMLButtonElement | HTMLSpanElement,
  StructuredPromptSlotProps
>(({ filled = false, onClick, children, className }, ref) => {
  const slotClass = cn(styles.slot, filled ? styles.slotFilled : styles.slotEmpty, className)

  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        data-slot="structured-prompt-slot"
        data-filled={filled ? "true" : "false"}
        type="button"
        onClick={onClick}
        className={slotClass}
      >
        {children}
      </button>
    )
  }

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      data-slot="structured-prompt-slot"
      data-filled={filled ? "true" : "false"}
      className={slotClass}
    >
      {children}
    </span>
  )
})
StructuredPromptSlot.displayName = "StructuredPromptSlot"

const StructuredPromptHint = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="structured-prompt-hint"
      className={cn(styles.hint, className)}
      {...props}
    />
  )
)
StructuredPromptHint.displayName = "StructuredPromptHint"

export {
  StructuredPrompt,
  StructuredPromptHeader,
  StructuredPromptBody,
  StructuredPromptSlot,
  StructuredPromptHint,
}
