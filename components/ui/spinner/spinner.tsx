import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./spinner.module.css"
import { SpinnerOrb, type SpinnerOrbState } from "./spinner-orb"

const spinnerVariants = cva(styles.root, {
  variants: {
    size: {
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      md: styles.sizeMd,
    },
    tone: {
      default: styles.toneDefault,
      primary: styles.tonePrimary,
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
  },
})

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof spinnerVariants> {
  /** Visual size. Ring: xs 12px, sm 16px, md 24px. Orb: xs 20px, sm 32px, md 64px. @default "md" */
  size?: "xs" | "sm" | "md"
  /** Color tone — the ring's leading edge, or the orb's ink. @default "default" */
  tone?: "default" | "primary"
  /** `ring` is the inline rotating border; `orb` is a dotted thinking-orb for waits over larger surfaces. @default "ring" */
  variant?: "ring" | "orb"
  /** Which orb animation to show. Read only when `variant="orb"`. @default "working" */
  orb?: SpinnerOrbState
  /** Accessible label. When provided, renders role="status" with visually-hidden text. When omitted, aria-hidden="true". */
  label?: string
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  (
    {
      className,
      size = "md",
      tone = "default",
      label,
      variant = "ring",
      orb = "working",
      ...props
    },
    ref
  ) => {
    if (variant === "orb") {
      return (
        <SpinnerOrb
          ref={ref}
          state={orb}
          size={size}
          tone={tone}
          className={className}
          {...(label
            ? { role: "status", "aria-label": label }
            : { "aria-hidden": "true" })}
          {...props}
        >
          {label ? <span className={styles.srOnly}>{label}</span> : null}
        </SpinnerOrb>
      )
    }

    return (
      <span
        ref={ref}
        data-slot="spinner"
        data-size={size}
        data-tone={tone}
        className={cn(spinnerVariants({ size, tone }), className)}
        {...(label
          ? { role: "status", "aria-label": label }
          : { "aria-hidden": "true" })}
        {...props}
      >
        {label ? (
          <span className={styles.srOnly}>{label}</span>
        ) : null}
      </span>
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
export type { SpinnerOrbState }
