import { render, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Spinner } from "../spinner"

/* VI-660 — the ring must not pay for the orb. `spinner.tsx` imports
   `spinner-orb.tsx` for every Spinner, so a static `thinking-orbs` import there
   shipped the canvas engine to every busy button. The factory runs the first
   time the module is actually loaded, which is what these two tests read. The
   order matters: the module cache is per file, so the ring runs first. */
const loaded = vi.hoisted(() => vi.fn())
vi.mock("thinking-orbs", async (importOriginal) => {
  loaded()
  return importOriginal()
})

describe("Spinner — thinking-orbs loads only for an orb", () => {
  it("a ring never loads thinking-orbs", () => {
    render(<Spinner />)
    render(<Spinner size="xs" tone="primary" label="Saving" />)
    expect(loaded).not.toHaveBeenCalled()
  })

  it("an orb loads it once it mounts", async () => {
    render(<Spinner variant="orb" />)
    await waitFor(() => expect(loaded).toHaveBeenCalledTimes(1))
  })
})
