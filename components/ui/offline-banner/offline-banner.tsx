'use client';

import * as React from "react"
import { WifiSlashIcon, ArrowsClockwiseIcon, CheckCircleIcon } from "@phosphor-icons/react"
import styles from "./offline-banner.module.css"

// ─── Network status types ────────────────────────────────────────────────────

export type NetworkState = "online" | "offline" | "reconnecting" | "restored"

// ─── useNetworkStatus hook ───────────────────────────────────────────────────

export interface UseNetworkStatusOptions {
  /** Called when manual retry check completes (resolve to report online/offline result). */
  onRetry?: () => Promise<boolean>
  /** Duration (ms) to show the "restored" state before auto-dismissing. Default: 1500. */
  restoredDisplayDuration?: number
}

export interface UseNetworkStatusReturn {
  networkState: NetworkState
  retry: () => void
}

/**
 * Hook that tracks navigator.onLine and drives the offline banner state machine.
 *
 * States:
 *   online       → No banner shown (initial state when online)
 *   offline      → Network lost; banner visible with "You're offline" + Retry button
 *   reconnecting → Retry pressed; spinner shown, Retry hidden
 *   restored     → Back online; brief "Back online" confirmation, auto-dismisses after 1.5s
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}): UseNetworkStatusReturn {
  const { onRetry, restoredDisplayDuration = 1500 } = options

  const [networkState, setNetworkState] = React.useState<NetworkState>(
    // SSR-safe: default to "online" on server; browser will correct on mount
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online"
  )

  // Listen to browser online/offline events
  React.useEffect(() => {
    function handleOnline() {
      setNetworkState("restored")
    }

    function handleOffline() {
      setNetworkState("offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Sync initial state on mount (in case it changed between server render and mount)
    if (!navigator.onLine) {
      setNetworkState("offline")
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Auto-dismiss "restored" state after display duration
  React.useEffect(() => {
    if (networkState !== "restored") return

    const timer = setTimeout(() => {
      setNetworkState("online")
    }, restoredDisplayDuration)

    return () => clearTimeout(timer)
  }, [networkState, restoredDisplayDuration])

  const retry = React.useCallback(async () => {
    setNetworkState("reconnecting")

    if (onRetry) {
      try {
        const isOnline = await onRetry()
        setNetworkState(isOnline ? "restored" : "offline")
      } catch {
        setNetworkState("offline")
      }
    } else {
      // Default: check navigator.onLine
      if (navigator.onLine) {
        setNetworkState("restored")
      } else {
        // Brief pause to show reconnecting state, then revert to offline
        await new Promise<void>((resolve) => setTimeout(resolve, 800))
        setNetworkState("offline")
      }
    }
  }, [onRetry])

  return { networkState, retry }
}

// ─── OfflineBanner component ─────────────────────────────────────────────────

export interface OfflineBannerProps {
  /** Current network state. Use with `useNetworkStatus()` or control manually. */
  networkState: NetworkState
  /** Called when the user presses "Retry". */
  onRetry?: () => void
  /** Additional className for the banner root. */
  className?: string
  /** Custom label for the offline state. Default: "You're offline". */
  offlineLabel?: string
  /** Custom label for the reconnecting state. Default: "Reconnecting…". */
  reconnectingLabel?: string
  /** Custom label for the restored state. Default: "Back online". */
  restoredLabel?: string
  /** Custom label for the retry button. Default: "Retry". */
  retryLabel?: string
}

/**
 * OfflineBanner — full-width sticky banner for network connectivity loss.
 *
 * Composes the existing Banner pattern: dark surface, inverse text, accent icon.
 * Mounts below the navigation bar using sticky positioning — does not overlay content.
 *
 * Usage:
 *   const { networkState, retry } = useNetworkStatus();
 *   <OfflineBanner networkState={networkState} onRetry={retry} />
 */
export const OfflineBanner = React.forwardRef<HTMLDivElement, OfflineBannerProps>(
  function OfflineBanner(
    {
      networkState,
      onRetry,
      className,
      offlineLabel = "You're offline",
      reconnectingLabel = "Reconnecting…",
      restoredLabel = "Back online",
      retryLabel = "Retry",
    },
    ref
  ) {
    // Hidden when online
    if (networkState === "online") return null

    const isOffline = networkState === "offline"
    const isReconnecting = networkState === "reconnecting"
    const isRestored = networkState === "restored"

    const bannerClass = [
      styles.banner,
      isRestored ? styles.bannerRestored : styles.bannerOffline,
      className,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div
        ref={ref}
        data-slot="offline-banner"
        data-state={networkState}
        role="status"
        aria-live="polite"
        aria-label={
          isRestored
            ? restoredLabel
            : isReconnecting
              ? reconnectingLabel
              : offlineLabel
        }
        className={bannerClass}
      >
        {/* Left: icon or spinner */}
        <span className={styles.iconSlot} aria-hidden="true">
          {isRestored ? (
            <CheckCircleIcon weight="fill" className={styles.iconRestored} />
          ) : isReconnecting ? (
            <span className={styles.spinner} />
          ) : (
            <WifiSlashIcon weight="bold" className={styles.iconOffline} />
          )}
        </span>

        {/* Center: status label */}
        <span className={styles.label}>
          {isRestored
            ? restoredLabel
            : isReconnecting
              ? reconnectingLabel
              : offlineLabel}
        </span>

        {/* Right: retry button (offline state only) */}
        {isOffline && onRetry && (
          <button
            type="button"
            className={styles.retryBtn}
            onClick={onRetry}
            aria-label={`${retryLabel} — check network connection`}
          >
            <ArrowsClockwiseIcon weight="bold" className={styles.retryIcon} aria-hidden="true" />
            {retryLabel}
          </button>
        )}
      </div>
    )
  }
)
OfflineBanner.displayName = "OfflineBanner"
