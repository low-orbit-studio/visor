"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { Button } from "../button/button"
import { Kbd } from "../kbd/kbd"
import { Composer, ComposerField, ComposerSend, ComposerSpacer, ComposerToolbar } from "../composer/composer"
import styles from "./decision-dock.module.css"

export type DecisionDockKind = "approve" | "pick" | "run"

export interface DecisionDockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the answer is: `approve` (Needs Work / Approve), `pick` (Needs Work / Send X) or `run` (Needs Work / I Ran It). Default `approve`. */
  kind?: DecisionDockKind
  /** The item's short name, drawn bold before the question (a ticket ID, for example). */
  label?: React.ReactNode
  /** The question being answered. One line; it truncates on a wide bar and wraps on a phone. */
  question: React.ReactNode
  /** `pick` only: the chosen option's short name ("A"). `null` or unset disables Send until one is chosen. */
  choice?: string | null
  /** Called once with the verdict line ("Approved", "Sent A", "Ran it", "Needs work") and, for Needs Work, the note. */
  onAnswer?: (verdict: string, note?: string) => void
  /** The sent state's line after the verdict. Default "Your answer is in." */
  sentText?: React.ReactNode
  /** Called when the sent state's progress bar fills: move to the next item. */
  onAdvance?: () => void
}

type Phase = "idle" | "note" | "done"

/**
 * A floating answer bar: the item's context and its answer buttons, each with its key.
 * Needs Work opens a note in place; an answer turns the bar into a sent state whose
 * progress bar runs to the next item. Show the next item by changing the dock's `key`.
 */
const DecisionDock = React.forwardRef<HTMLDivElement, DecisionDockProps>(
  (
    { kind = "approve", label, question, choice = null, onAnswer, sentText = "Your answer is in.", onAdvance, className, ...props },
    ref
  ) => {
    const [phase, setPhase] = React.useState<Phase>("idle")
    const [note, setNote] = React.useState("")
    const [verdict, setVerdict] = React.useState("")
    const noteId = React.useId()
    const noteRef = React.useRef<HTMLTextAreaElement>(null)

    const send = (line: string, text?: string) => {
      setVerdict(line)
      setPhase("done")
      onAnswer?.(line, text)
    }

    const waiting = kind === "pick" && !choice
    const primary =
      kind === "approve"
        ? { label: "Approve", key: "a", hint: "A", go: () => send("Approved") }
        : kind === "pick"
          ? { label: choice ? `Send ${choice}` : "Choose an Option", key: "Enter", hint: "↵", go: () => choice && send(`Sent ${choice}`) }
          : { label: "I Ran It", key: "r", hint: "R", go: () => send("Ran it") }

    // One key map for the page; keys typed into a field, or with a modifier, are left alone.
    const keys = React.useRef<Record<string, () => void>>({})
    keys.current =
      phase === "idle"
        ? { [primary.key]: primary.go, n: () => setPhase("note") }
        : phase === "note"
          ? { Escape: () => setPhase("idle") }
          : {}
    React.useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return
        if (e.key !== "Escape" && (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]")) return
        const fn = keys.current[e.key]
        if (!fn) return
        e.preventDefault()
        fn()
      }
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }, [])

    React.useEffect(() => {
      if (phase === "note") noteRef.current?.focus()
    }, [phase])

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Your answer"
        data-slot="decision-dock"
        data-kind={kind}
        data-phase={phase}
        className={cn(styles.root, className)}
        {...props}
      >
        {phase === "done" ? (
          <div className={styles.done} role="status" data-slot="decision-dock-sent">
            <svg className={styles.tick} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <circle cx="14" cy="14" r="13" className={styles.tickRing} />
              <path className={styles.tickMark} d="M8.5 14.5l3.8 3.8 7.4-8" pathLength={1} />
            </svg>
            <span className={styles.doneText}>
              <strong>{verdict}.</strong> {sentText}
            </span>
            <span className={styles.progress} aria-hidden="true" data-slot="decision-dock-progress" onAnimationEnd={onAdvance} />
          </div>
        ) : phase === "note" ? (
          <div className={styles.note} data-slot="decision-dock-note">
            <label htmlFor={noteId} className={styles.noteLabel}>
              What needs work?
            </label>
            <Composer value={note} onValueChange={setNote} onSubmit={(text) => send("Needs work", text.trim())}>
              <ComposerField id={noteId} ref={noteRef} placeholder="Name what looks wrong." />
              <ComposerToolbar>
                <ComposerSpacer />
                <Button type="button" variant="ghost" size="sm" onClick={() => setPhase("idle")}>
                  Cancel <Kbd size="sm">Esc</Kbd>
                </Button>
                <ComposerSend aria-label="Send note" />
              </ComposerToolbar>
            </Composer>
          </div>
        ) : (
          <div className={styles.idle}>
            <p className={styles.ask}>
              {label != null && <span className={styles.askLabel}>{label}</span>}
              <span className={styles.askText}>{question}</span>
            </p>
            <div className={styles.row}>
              <Button type="button" variant="outline" onClick={() => setPhase("note")}>
                Needs Work <Kbd size="sm">N</Kbd>
              </Button>
              <Button type="button" className={styles.primary} onClick={primary.go} disabled={waiting}>
                {primary.label}
                {/* No key hint while there is nothing to send: the key does nothing yet. */}
                {!waiting && <Kbd size="sm">{primary.hint}</Kbd>}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
)
DecisionDock.displayName = "DecisionDock"

export { DecisionDock }
