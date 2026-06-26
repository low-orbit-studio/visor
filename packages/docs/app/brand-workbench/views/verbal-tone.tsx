"use client"

import * as React from "react"
import { Sparkle, WarningCircle, Warning } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { SpecimenCard } from "@/components/ui/specimen-card"
import { TONE_SPECIMENS, VERBAL_VOICE_KEY } from "../lib/journey-fixtures"
import styles from "./verbal-tone.module.css"

/** Render one tone specimen on the real component its UI-state implies (journey.html .tonecard ×5). */
function ToneBody({ kind, body }: { kind: string; body: string }) {
  switch (kind) {
    case "alert-error":
      return (
        <Alert variant="destructive">
          <WarningCircle aria-hidden="true" />
          <AlertDescription>{body}</AlertDescription>
        </Alert>
      )
    case "alert-warn":
      return (
        <Alert variant="warning">
          <Warning aria-hidden="true" />
          <AlertDescription>{body}</AlertDescription>
        </Alert>
      )
    case "toast":
      return (
        <Alert variant="success">
          <AlertDescription>{body}</AlertDescription>
        </Alert>
      )
    case "empty":
      return <div className={styles.empty}>{body}</div>
    case "loading":
      return (
        <div className={styles.loading}>
          <Spinner size="sm" tone="primary" />
          <span>{body}</span>
        </div>
      )
    default:
      return <div className={styles.empty}>{body}</div>
  }
}

/**
 * Verbal stage (journey.html L421–452) — voice is fixed; tone flexes per UI-state. Five tone
 * specimens render live on real components: "the verbal twin of light/dark mode", the half a PDF
 * can't do. The AI tone-drafting loop is VI-562; here the specimens are the frozen Brand Record's.
 */
export function VerbalToneView() {
  return (
    <div className={styles.split}>
      <div className={styles.intro}>
        <div className={styles.eyebrow}>Verbal · Tone by context</div>
        <h2 className={styles.heading}>Voice is fixed. Tone flexes.</h2>
        <p className={styles.voiceRow}>
          <span className={styles.avatar} aria-hidden="true">
            <Sparkle weight="fill" />
          </span>
          Your voice is set — <strong>{VERBAL_VOICE_KEY}</strong>. Voice never changes; tone is how it
          flexes for the reader&apos;s moment. One per real UI state — watch them render on the right.
        </p>
        <p className={styles.lede}>
          This is the half a PDF can&apos;t do — it renders live, on real states, and re-resolves with
          the active theme and mode.
        </p>
      </div>

      <aside className={styles.specimens} aria-label="Tone specimens">
        {TONE_SPECIMENS.map((specimen) => (
          <SpecimenCard
            key={specimen.tone}
            context={specimen.tone}
            feel={specimen.feel}
            data-testid="bw-canvas-section"
          >
            <ToneBody kind={specimen.kind} body={specimen.body} />
          </SpecimenCard>
        ))}
      </aside>
    </div>
  )
}
