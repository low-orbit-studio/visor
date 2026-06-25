import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./empty-state.module.css"

const emptyStateVariants = cva(styles.base, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
    tone: {
      default: styles.toneDefault,
      subtle: styles.toneSubtle,
    },
    /**
     * Surface treatment.
     * - `default` — base placeholder (dashed/borderless per `tone`).
     * - `editorial` — filled card on `--surface-card` with a 64px circular
     *   icon chip; an admin-editorial composition. Opt-in; overrides the
     *   `tone` surface and `size` icon/heading scale.
     */
    variant: {
      default: undefined,
      editorial: styles.editorial,
    },
    /**
     * Semantic intent — clarifies the cause of the empty state and styles
     * the icon chip accordingly (Borealis spec §5).
     * - `first-use` — no items yet; accent-tinted chip; encourages a creation CTA.
     * - `zero-results` — filter or search returned nothing; accent-tinted chip;
     *   encourages a clear-filter action.
     * - `no-access` — permission or feature gate; neutral chip with lock icon.
     */
    intent: {
      "first-use": styles.intentFirstUse,
      "zero-results": styles.intentZeroResults,
      "no-access": styles.intentNoAccess,
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
    variant: "default",
  },
})

type HeadingElement = "h2" | "h3" | "h4"

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Optional leading visual — typically a Phosphor icon. */
  icon?: React.ReactNode
  /**
   * When true (or when `intent` is set), wraps the icon in a circular chip
   * whose color is controlled by the `intent` variant. Ignored if no `icon` is
   * provided.
   */
  iconWrap?: boolean
  /** Short direct statement of the empty condition. Required. */
  heading: React.ReactNode
  /** Optional 1-2 sentence explanation or guidance. */
  description?: React.ReactNode
  /** Primary CTA slot — typically a Button. */
  action?: React.ReactNode
  /** De-emphasized fallback action — typically a Button. */
  secondaryAction?: React.ReactNode
  /** Heading level for the heading slot. Defaults to `h3`. */
  headingAs?: HeadingElement
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      size,
      tone,
      variant,
      intent,
      icon,
      iconWrap,
      heading,
      description,
      action,
      secondaryAction,
      headingAs = "h3",
      ...props
    },
    ref
  ) => {
    const Heading = headingAs as React.ElementType
    const hasBothActions = Boolean(action) && Boolean(secondaryAction)
    const hasAnyAction = Boolean(action) || Boolean(secondaryAction)
    // Auto-activate icon wrap when intent is set, unless explicitly disabled
    const shouldWrapIcon = icon != null && (iconWrap ?? intent != null)

    return (
      <div
        ref={ref}
        role="status"
        data-slot="empty-state"
        data-tone={tone ?? "default"}
        data-variant={variant ?? "default"}
        {...(intent ? { "data-intent": intent } : {})}
        className={cn(emptyStateVariants({ size, tone, variant, intent }), className)}
        {...props}
      >
        {icon ? (
          shouldWrapIcon ? (
            <div
              data-slot="empty-state-icon"
              className={styles.iconWrap}
              aria-hidden="true"
            >
              {icon}
            </div>
          ) : (
            <div
              data-slot="empty-state-icon"
              className={styles.icon}
              aria-hidden="true"
            >
              {icon}
            </div>
          )
        ) : null}
        <Heading data-slot="empty-state-heading" className={styles.heading}>
          {heading}
        </Heading>
        {description ? (
          <p
            data-slot="empty-state-description"
            className={styles.description}
          >
            {description}
          </p>
        ) : null}
        {hasAnyAction ? (
          <div
            data-slot="empty-state-actions"
            className={styles.actions}
            {...(hasBothActions ? { role: "group" } : {})}
          >
            {action ? (
              <div
                data-slot="empty-state-action"
                className={styles.action}
              >
                {action}
              </div>
            ) : null}
            {secondaryAction ? (
              <div
                data-slot="empty-state-secondary-action"
                className={styles.secondaryAction}
              >
                {secondaryAction}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState, emptyStateVariants }
