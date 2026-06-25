'use client';

import * as React from "react"
import { Warning } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./conflict-banner.module.css"

// ── State machine types ────────────────────────────────────────────────────

export type ConflictState =
  | "pending"
  | "conflict"
  | "resolving"
  | "resolved-local"
  | "resolved-remote"

export interface ConflictDiff {
  field: string
  yours: string
  theirs: string
}

// ── ConflictBanner ─────────────────────────────────────────────────────────

export interface ConflictBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Current state of the optimistic mutation. */
  state?: ConflictState
  /** Descriptive copy — who else edited this entity. */
  description?: string
  /** Structured diff rows shown under "See what changed". */
  diffs?: ConflictDiff[]
  /** Called when user chooses "Keep my version". */
  onKeepMine?: () => void
  /** Called when user chooses "Load latest". */
  onLoadLatest?: () => void
}

const ConflictBanner = React.forwardRef<HTMLDivElement, ConflictBannerProps>(
  (
    {
      className,
      state = "conflict",
      description = "This record was updated by someone else.",
      diffs = [],
      onKeepMine,
      onLoadLatest,
      ...props
    },
    ref
  ) => {
    const [diffOpen, setDiffOpen] = React.useState(false)

    const isVisible = state === "conflict" || state === "resolving"
    const isResolving = state === "resolving"

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        data-slot="conflict-banner"
        data-state={state}
        role="alert"
        aria-live="assertive"
        className={cn(styles.banner, className)}
        {...props}
      >
        {/* Header row */}
        <div className={styles.header}>
          <Warning
            className={styles.icon}
            size={18}
            weight="fill"
            aria-hidden
          />
          <div className={styles.content}>
            <div className={styles.title}>
              This record was updated by someone else
            </div>
            {description && (
              <div className={styles.description}>{description}</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={cn(styles.btn, styles.btnKeep)}
            onClick={onKeepMine}
            disabled={isResolving}
            aria-busy={isResolving}
          >
            {isResolving && <span className={styles.spinner} aria-hidden />}
            {isResolving ? "Saving…" : "Keep my version"}
          </button>
          <button
            type="button"
            className={cn(styles.btn, styles.btnLoad)}
            onClick={onLoadLatest}
            disabled={isResolving}
          >
            Load latest
          </button>
        </div>

        {/* Optional diff view */}
        {diffs.length > 0 && (
          <>
            <button
              type="button"
              className={styles.diffToggle}
              onClick={() => setDiffOpen((o) => !o)}
              aria-expanded={diffOpen}
              aria-controls="conflict-banner-diff"
            >
              {diffOpen ? "Hide changes" : "See what changed"}
            </button>
            {diffOpen && (
              <div
                id="conflict-banner-diff"
                className={styles.diff}
                role="region"
                aria-label="Conflict diff"
              >
                {diffs.map((d) => (
                  <div key={d.field} className={styles.diffRow}>
                    <span className={styles.diffField}>{d.field} — </span>
                    <span className={styles.diffYours}>
                      Yours: &ldquo;{d.yours}&rdquo;
                    </span>
                    {" · "}
                    <span className={styles.diffTheirs}>
                      Theirs: &ldquo;{d.theirs}&rdquo;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }
)
ConflictBanner.displayName = "ConflictBanner"

// ── useOptimisticMutation ──────────────────────────────────────────────────

export type MutationStatus =
  | "idle"
  | "pending"
  | "conflict"
  | "resolving"
  | "resolved-local"
  | "resolved-remote"

export interface UseOptimisticMutationOptions<T> {
  /** Apply the optimistic value immediately before the async call resolves. */
  onOptimisticApply?: (value: T) => void
  /** Revert to the previous value on conflict or error. */
  onRollback?: (previousValue: T) => void
  /** Load the latest remote value after choosing "Load latest". */
  onLoadLatest?: () => Promise<T>
  /** Submit the user's version when choosing "Keep my version". */
  onKeepMine?: (value: T) => Promise<void>
}

export interface UseOptimisticMutationReturn<T> {
  status: MutationStatus
  conflictState: ConflictState
  /** The value currently displayed (optimistic or remote). */
  currentValue: T | undefined
  /** Call with the mutation function — returns a conflict result on 409. */
  mutate: (
    value: T,
    fn: (value: T) => Promise<void>
  ) => Promise<void>
  /** Resolve by keeping the user's version. */
  keepMine: () => Promise<void>
  /** Resolve by loading the latest remote state. */
  loadLatest: () => Promise<void>
  /** Reset to idle state. */
  reset: () => void
}

export function useOptimisticMutation<T>(
  initialValue: T,
  options: UseOptimisticMutationOptions<T> = {}
): UseOptimisticMutationReturn<T> {
  const { onOptimisticApply, onRollback, onLoadLatest, onKeepMine } = options

  const [status, setStatus] = React.useState<MutationStatus>("idle")
  const [currentValue, setCurrentValue] = React.useState<T>(initialValue)
  const previousValueRef = React.useRef<T>(initialValue)
  const pendingValueRef = React.useRef<T>(initialValue)

  const conflictState = React.useMemo<ConflictState>(() => {
    switch (status) {
      case "idle":
        return "pending"
      case "pending":
        return "pending"
      case "conflict":
        return "conflict"
      case "resolving":
        return "resolving"
      case "resolved-local":
        return "resolved-local"
      case "resolved-remote":
        return "resolved-remote"
      default:
        return "pending"
    }
  }, [status])

  const mutate = React.useCallback(
    async (value: T, fn: (value: T) => Promise<void>) => {
      previousValueRef.current = currentValue
      pendingValueRef.current = value

      // Optimistic apply
      setCurrentValue(value)
      setStatus("pending")
      onOptimisticApply?.(value)

      try {
        await fn(value)
        setStatus("idle")
      } catch {
        // On any error, treat as conflict and rollback
        setCurrentValue(previousValueRef.current)
        onRollback?.(previousValueRef.current)
        setStatus("conflict")
      }
    },
    [currentValue, onOptimisticApply, onRollback]
  )

  const keepMine = React.useCallback(async () => {
    setStatus("resolving")
    try {
      if (onKeepMine) {
        await onKeepMine(pendingValueRef.current)
      }
      setCurrentValue(pendingValueRef.current)
      setStatus("resolved-local")
    } catch {
      setStatus("conflict")
    }
  }, [onKeepMine])

  const loadLatest = React.useCallback(async () => {
    setStatus("resolving")
    try {
      if (onLoadLatest) {
        const latest = await onLoadLatest()
        setCurrentValue(latest)
      }
      setStatus("resolved-remote")
    } catch {
      setStatus("conflict")
    }
  }, [onLoadLatest])

  const reset = React.useCallback(() => {
    setStatus("idle")
  }, [])

  return {
    status,
    conflictState,
    currentValue,
    mutate,
    keepMine,
    loadLatest,
    reset,
  }
}

export { ConflictBanner }
