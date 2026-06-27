"use client"

// Seed proposal store (VI-594) — the first-draft DraftBrandRecord the seed path proposes, carried
// from Start into Positioning ("land on Positioning with seeded draft"). JSX-free on purpose so this
// stays `.ts` (mirrors use-spine.ts / draft-store.ts): it exports the context + a controller hook;
// page.tsx mounts the provider above the shell, so it survives every view switch. Consumers: useSeed().

import * as React from "react"
import type { DraftBrandRecord } from "../../../../../spec/types"

export interface SeedController {
  /** The proposed first-draft record, or null when the operator hasn't seeded. */
  seeded: DraftBrandRecord | null
  /** Store the proposal (Start, after a successful ingest + AI proposal). */
  setSeeded: (record: DraftBrandRecord) => void
  /** Drop the proposal. */
  clearSeeded: () => void
}

const SeedContext = React.createContext<SeedController | null>(null)

/** Reducer-free controller. `page.tsx` calls this once and feeds it to `SeedProvider`. */
export function useSeedController(): SeedController {
  const [seeded, setSeeded] = React.useState<DraftBrandRecord | null>(null)
  const store = React.useCallback((record: DraftBrandRecord) => setSeeded(record), [])
  const clear = React.useCallback(() => setSeeded(null), [])
  return React.useMemo<SeedController>(
    () => ({ seeded, setSeeded: store, clearSeeded: clear }),
    [seeded, store, clear],
  )
}

/** Provider element identity for `page.tsx`. */
export const SeedProvider = SeedContext.Provider

/** Read the seed store. Throws outside a `SeedProvider`. */
export function useSeed(): SeedController {
  const ctx = React.useContext(SeedContext)
  if (!ctx) throw new Error("useSeed must be used within a SeedProvider")
  return ctx
}
