"use client"

import * as React from "react"
import { XIcon } from "@phosphor-icons/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./chip.module.css"

/* ─── Chip (base) ────────────────────────────────────────────────────── */

const chipVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      outlined: styles.variantOutlined,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  /** Optional avatar/icon rendered before the label. */
  avatar?: React.ReactNode
  /** Optional leading icon rendered before the label (after avatar). */
  leadingIcon?: React.ReactNode
  /** Label content. Renders as children if omitted. */
  label?: React.ReactNode
  /** Custom delete icon. Defaults to XIcon. */
  deleteIcon?: React.ReactNode
  /** Called when the delete button is activated. When provided the delete button is shown. */
  onDeleted?: () => void
  /** Aria label for the delete button. Defaults to "Remove". */
  deleteLabel?: string
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      avatar,
      leadingIcon,
      label,
      children,
      deleteIcon,
      onDeleted,
      deleteLabel = "Remove",
      ...props
    },
    ref,
  ) => {
    const content = label ?? children

    return (
      <div
        ref={ref}
        data-slot="chip"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        className={cn(chipVariants({ variant, size }), className)}
        {...props}
      >
        {avatar ? (
          <span className={styles.avatar} aria-hidden="true">
            {avatar}
          </span>
        ) : null}
        {leadingIcon ? (
          <span className={styles.leadingIcon} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className={styles.label}>{content}</span>
        {onDeleted ? (
          <button
            type="button"
            aria-label={deleteLabel}
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation()
              onDeleted()
            }}
            tabIndex={0}
          >
            {deleteIcon ?? (
              <XIcon
                size={12}
                weight="bold"
                aria-hidden="true"
                className={styles.deleteIcon}
              />
            )}
          </button>
        ) : null}
      </div>
    )
  },
)
Chip.displayName = "Chip"

/* ─── ChoiceChip (radio-style single-select) ─────────────────────────── */

export interface ChoiceChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof chipVariants> {
  /** Whether this chip is currently selected. */
  selected?: boolean
  /** Optional avatar/icon rendered before the label. */
  avatar?: React.ReactNode
  /** Optional leading icon rendered before the label. */
  leadingIcon?: React.ReactNode
  /** Label text or content. */
  label?: React.ReactNode
  /** Called when the chip is pressed. */
  onPressed?: () => void
  /** Value used when in a ChipGroup. */
  value?: string
}

const ChoiceChip = React.forwardRef<HTMLButtonElement, ChoiceChipProps>(
  (
    {
      className,
      variant,
      size,
      selected = false,
      avatar,
      leadingIcon,
      label,
      children,
      onPressed,
      value,
      disabled,
      ...props
    },
    ref,
  ) => {
    const content = label ?? children

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        data-slot="choice-chip"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        data-selected={selected ? "true" : "false"}
        data-value={value}
        disabled={disabled}
        className={cn(
          chipVariants({ variant, size }),
          styles.interactive,
          selected && styles.selected,
          className,
        )}
        onClick={onPressed}
        {...props}
      >
        {avatar ? (
          <span className={styles.avatar} aria-hidden="true">
            {avatar}
          </span>
        ) : null}
        {leadingIcon ? (
          <span className={styles.leadingIcon} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className={styles.label}>{content}</span>
      </button>
    )
  },
)
ChoiceChip.displayName = "ChoiceChip"

/* ─── FilterChip (multi-select toggle-style) ─────────────────────────── */

export interface FilterChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof chipVariants> {
  /** Whether this chip is currently active/selected. */
  selected?: boolean
  /** Optional leading icon. */
  leadingIcon?: React.ReactNode
  /** Label text or content. */
  label?: React.ReactNode
  /** Called when the chip is toggled. */
  onPressed?: () => void
  /** Value used when in a ChipGroup. */
  value?: string
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    {
      className,
      variant,
      size,
      selected = false,
      leadingIcon,
      label,
      children,
      onPressed,
      value,
      disabled,
      ...props
    },
    ref,
  ) => {
    const content = label ?? children

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={selected}
        data-slot="filter-chip"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        data-selected={selected ? "true" : "false"}
        data-value={value}
        disabled={disabled}
        className={cn(
          chipVariants({ variant, size }),
          styles.interactive,
          selected && styles.selected,
          className,
        )}
        onClick={onPressed}
        {...props}
      >
        {leadingIcon ? (
          <span className={styles.leadingIcon} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className={styles.label}>{content}</span>
      </button>
    )
  },
)
FilterChip.displayName = "FilterChip"

export { Chip, chipVariants, ChoiceChip, FilterChip }
