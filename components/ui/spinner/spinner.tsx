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
  /** Show `label` as visible words beside the spinner. The spinner and the words sit in one `role="status"` wrapper, and `delay` fades both. @default false */
  showLabel?: boolean
  /** Wait this many milliseconds before fading in, so a quick load never flashes the spinner. CSS `animation-delay`, so the server renders the same markup. */
  delay?: number
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  (
    {
      className,
      style,
      size = "md",
      tone = "default",
      label,
      showLabel = false,
      delay,
      variant = "ring",
      orb = "working",
      ...props
    },
    ref
  ) => {
    // The delay goes on the outermost element: the status wrapper when the words show, else the spinner.
    const delayed = {
      "data-delay": delay == null ? undefined : "",
      style:
        delay == null
          ? style
          : ({ ...style, "--spinner-delay": `${delay}ms` } as React.CSSProperties),
    }
    const words = showLabel && label ? label : undefined
    const outer = words
      ? { "aria-hidden": "true" as const }
      : {
          ref,
          ...(label
            ? { role: "status", "aria-label": label }
            : { "aria-hidden": "true" as const }),
          ...props,
          ...delayed,
        }
    const srLabel =
      label && !words ? <span className={styles.srOnly}>{label}</span> : null

    const spinner =
      variant === "orb" ? (
        <SpinnerOrb
          state={orb}
          size={size}
          tone={tone}
          className={words ? undefined : className}
          {...outer}
        >
          {srLabel}
        </SpinnerOrb>
      ) : (
        <span
          data-slot="spinner"
          data-size={size}
          data-tone={tone}
          className={cn(spinnerVariants({ size, tone }), !words && className)}
          {...outer}
        >
          {srLabel}
        </span>
      )

    if (!words) return spinner

    return (
      <span
        ref={ref}
        role="status"
        data-slot="spinner-status"
        className={cn(styles.status, className)}
        {...props}
        {...delayed}
      >
        {spinner}
        <span>{words}</span>
      </span>
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
export type { SpinnerOrbState }
