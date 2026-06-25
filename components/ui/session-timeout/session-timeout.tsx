"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Lock } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./session-timeout.module.css"

export interface SessionTimeoutProps {
  /**
   * Whether the session timeout overlay is visible.
   * Typically driven by an auth event listener (JWT expiry, 401, Supabase SIGNED_OUT).
   */
  open?: boolean
  /**
   * Called when the user clicks the primary "Sign in" button.
   * Returning a Promise puts the overlay into the `redirecting` state automatically.
   * @default undefined
   */
  onSignIn?: () => void | Promise<void>
  /**
   * Called when the user clicks the optional "Return home" ghost link.
   * If omitted, the link is not rendered.
   * @default undefined
   */
  onReturnHome?: () => void
  /**
   * Label for the primary CTA. Defaults to "Sign in".
   * @default "Sign in"
   */
  signInLabel?: React.ReactNode
  /**
   * Label for the optional ghost link. Defaults to "Return home".
   * @default "Return home"
   */
  returnHomeLabel?: React.ReactNode
  /**
   * Additional class name applied to the card surface.
   * @default undefined
   */
  className?: string
}

/**
 * SessionTimeout renders a non-dismissible full-screen overlay when an auth
 * session expires. The overlay covers the entire viewport via a React portal,
 * blurs the app content beneath, and presents a centered card with a primary
 * Sign in CTA and an optional Return home escape hatch.
 *
 * - ESC key and backdrop click are inert — the user must explicitly act.
 * - Clicking "Sign in" transitions to the `redirecting` state (spinner +
 *   disabled CTA) while the async `onSignIn` handler runs.
 * - The current path should be stored in a `redirect` query param before
 *   navigating to /login (handled by the `onSignIn` prop).
 */
const SessionTimeout = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SessionTimeoutProps
>(
  (
    {
      open = false,
      onSignIn,
      onReturnHome,
      signInLabel = "Sign in",
      returnHomeLabel = "Return home",
      className,
    },
    ref
  ) => {
    const [isRedirecting, setIsRedirecting] = React.useState(false)

    // Reset redirecting state whenever the overlay closes (e.g. open flips to false)
    React.useEffect(() => {
      if (!open) {
        setIsRedirecting(false)
      }
    }, [open])

    const handleSignIn = React.useCallback(async () => {
      if (!onSignIn) return
      const result = onSignIn()
      if (result && typeof (result as Promise<void>).then === "function") {
        setIsRedirecting(true)
        try {
          await result
        } finally {
          setIsRedirecting(false)
        }
      }
    }, [onSignIn])

    return (
      <DialogPrimitive.Root open={open} data-slot="session-timeout-root">
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            data-slot="session-timeout-overlay"
            className={styles.overlay}
          />
          <DialogPrimitive.Content
            ref={ref}
            data-slot="session-timeout"
            data-state={isRedirecting ? "redirecting" : "expired"}
            className={styles.content}
            aria-labelledby="session-timeout-title"
            aria-describedby="session-timeout-description"
            /* Non-dismissible: prevent ESC and backdrop click from closing */
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            {/* Visually hidden title for screen readers */}
            <DialogPrimitive.Title className={styles.srOnly}>
              Session expired
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className={styles.srOnly}>
              Your session has expired. Sign in again to continue.
            </DialogPrimitive.Description>

            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="session-timeout-title"
              aria-describedby="session-timeout-description"
              className={cn(styles.card, className)}
            >
              {/* Lock icon */}
              <div className={styles.iconWrap} aria-hidden="true">
                <Lock
                  size={28}
                  weight="bold"
                  className={styles.icon}
                />
              </div>

              <h2
                id="session-timeout-title"
                className={styles.headline}
              >
                Your session has expired
              </h2>

              <p
                id="session-timeout-description"
                className={styles.copy}
              >
                Sign in again to continue where you left off.
              </p>

              <button
                type="button"
                className={styles.signinBtn}
                onClick={handleSignIn}
                disabled={isRedirecting}
                aria-busy={isRedirecting || undefined}
                data-slot="session-timeout-signin"
              >
                {isRedirecting && (
                  <span
                    className={styles.signinSpinner}
                    aria-hidden="true"
                  />
                )}
                <span>
                  {isRedirecting ? "Signing in…" : signInLabel}
                </span>
              </button>

              {onReturnHome && (
                <button
                  type="button"
                  className={styles.returnHomeBtn}
                  onClick={onReturnHome}
                  disabled={isRedirecting}
                  data-slot="session-timeout-return-home"
                >
                  {returnHomeLabel}
                </button>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }
)
SessionTimeout.displayName = "SessionTimeout"

export { SessionTimeout }
