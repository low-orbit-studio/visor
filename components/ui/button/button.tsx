import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./button.module.css"
import { Spinner } from "../spinner/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../tooltip/tooltip"

const buttonVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      secondary: styles.variantSecondary,
      outline: styles.variantOutline,
      ghost: styles.variantGhost,
      destructive: styles.variantDestructive,
    },
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
      dlg: styles.sizeDlg,
      icon: styles.sizeIcon,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

/**
 * Fallback thresholds for the `pending` affordance, in milliseconds.
 *
 * The delay suppresses the busy glyph for actions that resolve fast enough
 * that showing one would read as a flicker; the minimum duration keeps it on
 * screen long enough to be legible once it has appeared. Both are overridable
 * per call site (`pendingDelay` / `pendingMinDuration`) and per theme
 * (`--button-pending-delay` / `--button-pending-min-duration`).
 */
export const BUTTON_PENDING_DELAY_MS = 200
export const BUTTON_PENDING_MIN_DURATION_MS = 300

/** Parses a CSS time value (`200ms`, `0.2s`, bare `200`) into milliseconds. */
function parseCssDuration(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined
  const match = /^(\d+(?:\.\d+)?)\s*(ms|s)?$/.exec(raw.trim())
  if (!match) return undefined
  const value = Number.parseFloat(match[1])
  if (!Number.isFinite(value)) return undefined
  return match[2] === "s" ? value * 1000 : value
}

/**
 * Resolution order for a threshold: explicit prop, then the themed custom
 * property read off the live element, then the module fallback.
 *
 * The custom properties are deliberately NOT declared on `.base` — an
 * element-level declaration would shadow anything a theme emits on `:root`,
 * which is the defect VI-625 fixed on Spinner.
 */
function resolveThreshold(
  element: HTMLElement | null,
  customProperty: string,
  propValue: number | undefined,
  fallback: number
): number {
  if (typeof propValue === "number" && Number.isFinite(propValue)) {
    return Math.max(0, propValue)
  }
  if (element && typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    const themed = parseCssDuration(
      window.getComputedStyle(element).getPropertyValue(customProperty)
    )
    if (themed !== undefined) return themed
  }
  return fallback
}

/**
 * Turns a raw `pending` boolean into a *paintable* one: false for the first
 * `delay` ms, then true for at least `minDuration` ms once shown.
 *
 * Without the delay a 150ms action strobes; without the minimum a 250ms action
 * shows a one-frame flash, which reads as a glitch rather than as progress.
 */
function usePendingVisibility(
  pending: boolean,
  elementRef: React.RefObject<HTMLElement | null>,
  delay: number | undefined,
  minDuration: number | undefined
): boolean {
  const [visible, setVisible] = React.useState(false)
  const visibleRef = React.useRef(false)
  const shownAtRef = React.useRef(0)

  const show = React.useCallback((next: boolean) => {
    visibleRef.current = next
    setVisible(next)
  }, [])

  React.useEffect(() => {
    if (pending) {
      const delayMs = resolveThreshold(
        elementRef.current,
        "--button-pending-delay",
        delay,
        BUTTON_PENDING_DELAY_MS
      )
      if (delayMs <= 0) {
        shownAtRef.current = Date.now()
        show(true)
        return
      }
      const armed = setTimeout(() => {
        shownAtRef.current = Date.now()
        show(true)
      }, delayMs)
      return () => clearTimeout(armed)
    }

    // Never painted — nothing to unwind, and no minimum to honour.
    if (!visibleRef.current) return

    const minMs = resolveThreshold(
      elementRef.current,
      "--button-pending-min-duration",
      minDuration,
      BUTTON_PENDING_MIN_DURATION_MS
    )
    const remaining = minMs - (Date.now() - shownAtRef.current)
    if (remaining <= 0) {
      show(false)
      return
    }
    const held = setTimeout(() => show(false), remaining)
    return () => clearTimeout(held)
  }, [pending, delay, minDuration, elementRef, show])

  return visible
}

/** Spinner ring size that reads correctly inside each button size. */
const PENDING_SPINNER_SIZE: Record<string, "xs" | "sm"> = {
  sm: "xs",
  dlg: "xs",
  md: "sm",
  lg: "sm",
  icon: "sm",
}

/**
 * An icon-only button has no text for assistive tech to read, so it needs an
 * `aria-label` (or `aria-labelledby`). Warns once per mount in development;
 * silent in production.
 */
function useIconLabelWarning(size: string | null | undefined, props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const unlabelled = size === "icon" && !props["aria-label"] && !props["aria-labelledby"]
  React.useEffect(() => {
    if (unlabelled && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        '[Button] size="icon" renders no text, so it needs an accessible name. ' +
          "Pass aria-label (or aria-labelledby) describing the action."
      )
    }
  }, [unlabelled])
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * When true, the button renders in an inert gated state — visually dimmed,
   * cursor not-allowed, and click handlers suppressed. Uses `aria-disabled`
   * instead of the native `disabled` attribute so the button remains
   * keyboard-focusable (required for the tooltip to be accessible).
   *
   * Note: a `<TooltipProvider>` ancestor is required when `gatedReason` is set.
   */
  gated?: boolean
  /**
   * Explanation surfaced in an anchored tooltip when the button is gated.
   * Only rendered when `gated` is also true.
   * Example: "You can't delete this — you're not an owner"
   */
  gatedReason?: string
  /**
   * When true, the button reports that its action is in flight: a busy glyph
   * appears, `aria-busy` is set, and activation is suppressed so the action
   * cannot be double-submitted.
   *
   * **The geometry is held.** The idle children stay in the box at zero
   * opacity and the glyph paints over them, so the control never resizes and
   * never shoves its siblings. That is the whole point — a pending state that
   * reflows has not fixed the visible defect.
   *
   * Like `gated`, this does NOT set the native `disabled` attribute: the
   * button stays focusable, which matters because it is the user's focus
   * anchor while they wait.
   */
  pending?: boolean
  /**
   * Optional text shown beside the busy glyph while pending. Purely visual —
   * it is `aria-hidden`, and the accessible name stays the idle label so the
   * control is not renamed mid-action. Pair `pending` with your own
   * `role="status"` region when the message needs to be spoken.
   */
  pendingLabel?: React.ReactNode
  /**
   * Milliseconds to wait before painting the busy glyph. Overrides the themed
   * `--button-pending-delay`. @default 200
   */
  pendingDelay?: number
  /**
   * Milliseconds to keep the busy glyph on screen once painted. Overrides the
   * themed `--button-pending-min-duration`. @default 300
   */
  pendingMinDuration?: number
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild,
      gated,
      gatedReason,
      pending,
      pendingLabel,
      pendingDelay,
      pendingMinDuration,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    useIconLabelWarning(size, props)

    const elementRef = React.useRef<HTMLButtonElement | null>(null)
    const mergeRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        elementRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )

    const pendingVisible = usePendingVisibility(
      pending === true,
      elementRef,
      pendingDelay,
      pendingMinDuration
    )

    // Activation follows what the user can see: suppressed while the action is
    // in flight AND for as long as the glyph is still held on screen, so a
    // control that looks busy never silently accepts a click.
    const inert = gated === true || pending === true || pendingVisible

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (inert) {
          /* `preventDefault` as well as swallowing the handler, and this is
           * load-bearing: most buttons `pending` and `gated` exist for are a
           * `type="submit"` inside a form, and suppressing `onClick` alone
           * leaves the browser's own ACTIVATION BEHAVIOUR intact — the form
           * submits anyway, through `onSubmit`, which this never sees. Measured
           * in a consumer: a second click on a pending submit mailed a second
           * one-time code. A keyboard Enter on a focused submit button
           * dispatches a click too, so this covers that path as well. */
          e.preventDefault()
          return
        }
        onClick?.(e)
      },
      [inert, onClick]
    )

    // `asChild` hands a single child straight to Slot, so the pending chrome
    // (which needs its own wrapper elements) cannot be injected. The state
    // attributes and activation suppression still apply.
    const showPendingChrome = !asChild && pendingVisible
    const spinnerSize = PENDING_SPINNER_SIZE[size ?? "md"] ?? "sm"

    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={mergeRef}
        aria-disabled={gated || pendingVisible ? true : undefined}
        aria-busy={pending === true || pendingVisible ? true : undefined}
        data-gated={gated ? "true" : undefined}
        data-gated-reason={gated && gatedReason ? gatedReason : undefined}
        data-pending={pendingVisible ? "true" : undefined}
        onClick={handleClick}
        {...props}
      >
        {showPendingChrome ? (
          <>
            <span className={styles.pendingLabel} data-slot="button-label">
              {children}
            </span>
            <span
              className={styles.pendingOverlay}
              data-slot="button-pending"
              aria-hidden="true"
            >
              <Spinner size={spinnerSize} />
              {pendingLabel ? (
                <span className={styles.pendingText}>{pendingLabel}</span>
              ) : null}
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    )

    if (gated && gatedReason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{gatedReason}</TooltipContent>
        </Tooltip>
      )
    }

    return button
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
