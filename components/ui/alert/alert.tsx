import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { IconProps } from "@phosphor-icons/react"
import { CheckCircle, Info, Warning, WarningOctagon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "../../../lib/utils"
import styles from "./alert.module.css"

/*
 * Two appearances share one component (VI-698):
 *
 * - `default` — the edged callout every current Alert draws. Its class list is
 *   unchanged: base + one variant class.
 * - `soft` — the inline alert Animal Booking (AN-724) and Blacklight (BL-1204)
 *   each built locally: a soft tinted fill with no edge and no shadow, a 32px
 *   outline icon in the tone's colour, and the body in secondary ink. Under
 *   `soft` the edged variant classes are not applied at all, so their border,
 *   shadow and tone-tinted ink cannot leak in.
 */
const alertVariants = cva(styles.base, {
  variants: {
    variant: {
      default: "",
      destructive: "",
      success: "",
      warning: "",
      info: "",
    },
    appearance: {
      default: "",
      soft: styles.soft,
    },
  },
  compoundVariants: [
    { appearance: "default", variant: "default", class: styles.variantDefault },
    { appearance: "default", variant: "destructive", class: styles.variantDestructive },
    { appearance: "default", variant: "success", class: styles.variantSuccess },
    { appearance: "default", variant: "warning", class: styles.variantWarning },
    { appearance: "default", variant: "info", class: styles.variantInfo },
    // `info` has no soft surface yet (no `--surface-info-soft`), so it falls
    // back to the neutral note.
    { appearance: "soft", variant: ["default", "info"], class: styles.softNote },
    { appearance: "soft", variant: "destructive", class: styles.softDestructive },
    { appearance: "soft", variant: "success", class: styles.softSuccess },
    { appearance: "soft", variant: "warning", class: styles.softWarning },
  ],
  defaultVariants: {
    variant: "default",
    appearance: "default",
  },
})

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>

/** Each soft tone's default icon. Danger is an octagon so it differs from a
 *  warning by shape as well as colour (WCAG 1.4.1). */
const SOFT_ICON: Record<AlertVariant, React.ElementType<IconProps>> = {
  default: Info,
  info: Info,
  destructive: WarningOctagon,
  warning: Warning,
  success: CheckCircle,
}

/** The soft icon size for every tone but the neutral note. Matches the
 *  `--alert-icon-size` fallback; the CSS token governs the rendered size. */
export const ALERT_ICON_SIZE = 32
/** The neutral note is usually one line, where 32px reads heavy. Matches the
 *  `--alert-icon-size-note` fallback. */
export const ALERT_ICON_SIZE_NOTE = 24

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * `soft` only: replaces the tone's default icon. Drawn at the tone's size and
   * hidden from assistive tech; its weight stays the caller's.
   */
  icon?: React.ReactElement<IconProps>
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, appearance, icon, role, children, ...props }, ref) => {
    const tone: AlertVariant = variant ?? "default"

    if (appearance !== "soft") {
      return (
        <div
          ref={ref}
          data-slot="alert"
          role={role ?? "alert"}
          className={cn(alertVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      )
    }

    const isNote = tone === "default" || tone === "info"
    const DefaultIcon = SOFT_ICON[tone]
    const glyph = icon ?? <DefaultIcon />

    return (
      <div
        ref={ref}
        data-slot="alert"
        data-appearance="soft"
        role={role ?? (tone === "destructive" ? "alert" : "status")}
        className={cn(alertVariants({ variant, appearance }), className)}
        {...props}
      >
        <span data-slot="alert-icon" className={styles.icon}>
          {React.cloneElement(glyph, {
            size: isNote ? ALERT_ICON_SIZE_NOTE : ALERT_ICON_SIZE,
            "aria-hidden": true,
          })}
        </span>
        <div data-slot="alert-content" className={styles.content}>
          {children}
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="alert-title"
        className={cn(styles.title, className)}
        {...props}
      />
    )
  }
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="alert-description"
        className={cn(styles.description, className)}
        {...props}
      />
    )
  }
)
AlertDescription.displayName = "AlertDescription"

/**
 * A bold lead sentence, set inline at the start of an `AlertDescription`, in
 * primary ink: `<AlertDescription><AlertLead>Can't sign in.</AlertLead> That
 * email isn't on the list.</AlertDescription>`.
 */
const AlertLead = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <strong
        ref={ref}
        data-slot="alert-lead"
        className={cn(styles.lead, className)}
        {...props}
      />
    )
  }
)
AlertLead.displayName = "AlertLead"

const AlertActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="alert-actions"
        className={cn(styles.actions, className)}
        {...props}
      />
    )
  }
)
AlertActions.displayName = "AlertActions"

export { Alert, AlertTitle, AlertDescription, AlertLead, AlertActions, alertVariants }
