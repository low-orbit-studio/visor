import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CheckCircle,
  WarningCircle,
  Info,
  Warning,
  X,
} from "@phosphor-icons/react/dist/ssr"
import { cn } from "../../../lib/utils"
import styles from "./toast-card.module.css"

/* Variant → filled icon-badge color. A circular FILLED badge whose
   background is the semantic token and whose glyph reads in --primary-text.
   The whole card is declarative + server-renderable (no Sonner), so a fixed
   stack of these can be statically composed (see ToastCardStack). */
const toastCardVariants = cva(styles.base, {
  variants: {
    variant: {
      success: styles.variantSuccess,
      error: styles.variantError,
      info: styles.variantInfo,
      warning: styles.variantWarning,
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

type ToastCardVariant = NonNullable<VariantProps<typeof toastCardVariants>["variant"]>

/* Default glyph per variant — matches the golden success/error/info stack.
   Overridable via the `icon` prop for bespoke notifications. */
const variantIcon: Record<ToastCardVariant, React.ElementType> = {
  success: CheckCircle,
  error: WarningCircle,
  info: Info,
  warning: Warning,
}

export interface ToastCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof toastCardVariants> {
  /** Bold one-line headline. Required. */
  title: React.ReactNode
  /** Muted supporting line beneath the title. */
  body?: React.ReactNode
  /** Optional primary-colored action affordance (link/button text). */
  action?: React.ReactNode
  /** Handler for the action affordance. When omitted with `action`, the
   *  action renders as static text (server-safe). */
  onAction?: React.MouseEventHandler<HTMLButtonElement>
  /** Dismiss handler. When provided, renders the muted X control. */
  onDismiss?: React.MouseEventHandler<HTMLButtonElement>
  /** Override the leading glyph. Defaults to the per-variant icon. */
  icon?: React.ReactNode
}

const ToastCard = React.forwardRef<HTMLDivElement, ToastCardProps>(
  (
    {
      className,
      variant,
      title,
      body,
      action,
      onAction,
      onDismiss,
      icon,
      ...props
    },
    ref
  ) => {
    const resolvedVariant: ToastCardVariant = variant ?? "info"
    const Glyph = variantIcon[resolvedVariant]

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        data-slot="toast-card"
        data-variant={resolvedVariant}
        className={cn(toastCardVariants({ variant }), className)}
        {...props}
      >
        <span
          data-slot="toast-card-icon"
          className={styles.icon}
          aria-hidden="true"
        >
          {icon ?? <Glyph weight="fill" />}
        </span>
        <div data-slot="toast-card-content" className={styles.content}>
          <div data-slot="toast-card-title" className={styles.title}>
            {title}
          </div>
          {body ? (
            <div data-slot="toast-card-body" className={styles.body}>
              {body}
            </div>
          ) : null}
          {action ? (
            <button
              type="button"
              data-slot="toast-card-action"
              className={styles.action}
              onClick={onAction}
            >
              {action}
            </button>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            data-slot="toast-card-close"
            className={styles.close}
            aria-label="Dismiss notification"
            onClick={onDismiss}
          >
            <X weight="bold" />
          </button>
        ) : null}
      </div>
    )
  }
)
ToastCard.displayName = "ToastCard"

export interface ToastCardStackProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Distance from the top of the viewport. Defaults to --spacing-6. */
  top?: string
  /** Vertical gap between stacked cards. Defaults to --spacing-3. */
  gap?: string
}

/* Fixed top-right column for a vertical stack of ToastCards. Declarative +
   server-renderable: the Feedback screen pins three of these without any
   client toast runtime. Offsets are CSS-var driven so consumers can retune
   without forking the module. */
const ToastCardStack = React.forwardRef<HTMLDivElement, ToastCardStackProps>(
  ({ className, top, gap, style, children, ...props }, ref) => {
    const stackStyle = {
      ...(top ? { ["--toast-card-stack-top" as string]: top } : {}),
      ...(gap ? { ["--toast-card-stack-gap" as string]: gap } : {}),
      ...style,
    } as React.CSSProperties

    return (
      <div
        ref={ref}
        data-slot="toast-card-stack"
        className={cn(styles.stack, className)}
        style={stackStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ToastCardStack.displayName = "ToastCardStack"

export { ToastCard, ToastCardStack, toastCardVariants }
