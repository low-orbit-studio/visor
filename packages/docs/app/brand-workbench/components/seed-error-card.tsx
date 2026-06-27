"use client"

import * as React from "react"
import {
  LinkBreak,
  CloudWarning,
  Prohibit,
  FileX,
  FileDashed,
  WarningCircle,
  ArrowClockwise,
} from "@phosphor-icons/react"
import { ErrorPlacard } from "@/components/ui/error-placard"
import { Button } from "@/components/ui/button"
import type { SeedFailure } from "../lib/seed-ingest"

// Seed ingestion error surface (VI-594, UJ-F step 4). Maps the LOCAL D4 taxonomy to a designed
// recovery placard (reuses the Visor ErrorPlacard) with three fix actions: retry, switch input, or
// fall back to blank onboarding (UJ-A). Theme-agnostic — all visuals come from ErrorPlacard tokens.

interface FailureCopy {
  title: string
  body: string
  icon: React.ReactNode
}

const COPY: Record<SeedFailure, FailureCopy> = {
  "bad-url": {
    icon: <LinkBreak weight="fill" />,
    title: "That doesn't look like a URL",
    body: "Check the address, or paste your notes / drop a file instead.",
  },
  "fetch-failed": {
    icon: <CloudWarning weight="fill" />,
    title: "Couldn't reach that page",
    body: "The site didn't respond. Try again, or seed from a file or pasted text.",
  },
  "cors-blocked": {
    icon: <Prohibit weight="fill" />,
    title: "That site blocked the read",
    body: "Its server won't allow an in-browser read. Paste the text or drop a file instead.",
  },
  unparseable: {
    icon: <FileX weight="fill" />,
    title: "Couldn't read that file",
    body: "Try a PDF, plain text, or markdown — or paste the text directly.",
  },
  "extraction-empty": {
    icon: <FileDashed weight="fill" />,
    title: "Nothing to read there",
    body: "We found no text to work from. Try a different source, or paste your notes.",
  },
  "proposal-failed": {
    icon: <WarningCircle weight="fill" />,
    title: "The draft proposal failed",
    body: "We read the source but couldn't draft a positioning. Retry, or start from scratch.",
  },
}

export interface SeedErrorCardProps {
  failure: SeedFailure
  /** The real underlying reason (provider message, HTTP status), shown in muted parentheses. */
  detail?: string
  /** Re-run the same ingestion. */
  onRetry: () => void
  /** Clear the input so the operator can try a different URL / file / paste. */
  onSwitchInput: () => void
  /** Abandon the seed path and start blank onboarding (UJ-A). */
  onFallback: () => void
}

export function SeedErrorCard({
  failure,
  detail,
  onRetry,
  onSwitchInput,
  onFallback,
}: SeedErrorCardProps) {
  const copy = COPY[failure]
  return (
    <ErrorPlacard
      data-testid="bw-seed-error"
      data-failure={failure}
      icon={copy.icon}
      title={copy.title}
      body={detail ? `${copy.body} (${detail})` : copy.body}
      actions={
        <>
          <Button size="sm" variant="secondary" onClick={onRetry} data-testid="bw-seed-error-retry">
            <ArrowClockwise aria-hidden="true" />
            Retry
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSwitchInput}
            data-testid="bw-seed-error-switch"
          >
            Try another
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onFallback}
            data-testid="bw-seed-error-fallback"
          >
            Start from scratch
          </Button>
        </>
      }
    />
  )
}
