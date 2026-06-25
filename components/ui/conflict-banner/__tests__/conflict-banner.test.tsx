import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { ConflictBanner, useOptimisticMutation } from "../conflict-banner"
import { checkA11y } from "../../../../test-utils/a11y"

// ── ConflictBanner component ───────────────────────────────────────────────

describe("ConflictBanner", () => {
  it("renders when state is 'conflict'", () => {
    render(<ConflictBanner state="conflict" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("renders when state is 'resolving'", () => {
    render(<ConflictBanner state="resolving" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("does not render when state is 'pending'", () => {
    render(<ConflictBanner state="pending" />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("does not render when state is 'resolved-local'", () => {
    render(<ConflictBanner state="resolved-local" />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("does not render when state is 'resolved-remote'", () => {
    render(<ConflictBanner state="resolved-remote" />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("applies data-slot attribute", () => {
    render(<ConflictBanner state="conflict" />)
    expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "conflict-banner")
  })

  it("applies data-state attribute", () => {
    render(<ConflictBanner state="conflict" />)
    expect(screen.getByRole("alert")).toHaveAttribute("data-state", "conflict")
  })

  it("renders the default title", () => {
    render(<ConflictBanner state="conflict" />)
    expect(screen.getByText("This record was updated by someone else")).toBeInTheDocument()
  })

  it("renders custom description", () => {
    render(
      <ConflictBanner state="conflict" description="Jordan Kim edited this record." />
    )
    expect(screen.getByText("Jordan Kim edited this record.")).toBeInTheDocument()
  })

  it("renders Keep my version button", () => {
    render(<ConflictBanner state="conflict" />)
    expect(screen.getByRole("button", { name: "Keep my version" })).toBeInTheDocument()
  })

  it("renders Load latest button", () => {
    render(<ConflictBanner state="conflict" />)
    expect(screen.getByRole("button", { name: "Load latest" })).toBeInTheDocument()
  })

  it("calls onKeepMine when Keep my version clicked", () => {
    const onKeepMine = vi.fn()
    render(<ConflictBanner state="conflict" onKeepMine={onKeepMine} />)
    fireEvent.click(screen.getByRole("button", { name: "Keep my version" }))
    expect(onKeepMine).toHaveBeenCalledOnce()
  })

  it("calls onLoadLatest when Load latest clicked", () => {
    const onLoadLatest = vi.fn()
    render(<ConflictBanner state="conflict" onLoadLatest={onLoadLatest} />)
    fireEvent.click(screen.getByRole("button", { name: "Load latest" }))
    expect(onLoadLatest).toHaveBeenCalledOnce()
  })

  it("disables buttons when state is 'resolving'", () => {
    render(<ConflictBanner state="resolving" />)
    const buttons = screen.getAllByRole("button").filter((b) =>
      ["Load latest", "Saving…"].some((t) => b.textContent?.includes(t))
    )
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it("shows 'Saving…' text when resolving", () => {
    render(<ConflictBanner state="resolving" />)
    expect(screen.getByText(/Saving/)).toBeInTheDocument()
  })
})

describe("ConflictBanner diff view", () => {
  const diffs = [
    { field: "Title", yours: "Q3 Draft", theirs: "Q3 Brief" },
    { field: "Status", yours: "Draft", theirs: "In Review" },
  ]

  it("does not show diff panel initially", () => {
    render(<ConflictBanner state="conflict" diffs={diffs} />)
    expect(screen.queryByRole("region", { name: "Conflict diff" })).toBeNull()
  })

  it("shows diff toggle when diffs provided", () => {
    render(<ConflictBanner state="conflict" diffs={diffs} />)
    expect(screen.getByText("See what changed")).toBeInTheDocument()
  })

  it("does not show diff toggle when no diffs", () => {
    render(<ConflictBanner state="conflict" diffs={[]} />)
    expect(screen.queryByText("See what changed")).toBeNull()
  })

  it("expands diff panel on toggle click", () => {
    render(<ConflictBanner state="conflict" diffs={diffs} />)
    fireEvent.click(screen.getByText("See what changed"))
    expect(screen.getByRole("region", { name: "Conflict diff" })).toBeInTheDocument()
    expect(screen.getByText(/Q3 Draft/)).toBeInTheDocument()
    expect(screen.getByText(/Q3 Brief/)).toBeInTheDocument()
  })

  it("collapses diff panel on second toggle click", () => {
    render(<ConflictBanner state="conflict" diffs={diffs} />)
    const toggle = screen.getByText("See what changed")
    fireEvent.click(toggle)
    expect(screen.getByRole("region", { name: "Conflict diff" })).toBeInTheDocument()
    fireEvent.click(screen.getByText("Hide changes"))
    expect(screen.queryByRole("region", { name: "Conflict diff" })).toBeNull()
  })

  it("toggles aria-expanded on the diff toggle button", () => {
    render(<ConflictBanner state="conflict" diffs={diffs} />)
    const toggle = screen.getByText("See what changed")
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(toggle)
    expect(screen.getByText("Hide changes")).toHaveAttribute("aria-expanded", "true")
  })

  it("renders all diff rows", () => {
    render(<ConflictBanner state="conflict" diffs={diffs} />)
    fireEvent.click(screen.getByText("See what changed"))
    expect(screen.getByText(/Title/)).toBeInTheDocument()
    expect(screen.getByText(/Status/)).toBeInTheDocument()
  })
})

// ── useOptimisticMutation hook ─────────────────────────────────────────────

describe("useOptimisticMutation", () => {
  it("initialises with idle status", () => {
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial")
    )
    expect(result.current.status).toBe("idle")
    expect(result.current.currentValue).toBe("initial")
  })

  it("applies optimistic value and status during mutate", async () => {
    const onOptimisticApply = vi.fn()
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial", { onOptimisticApply })
    )

    const slowMutation = () =>
      new Promise<void>((resolve) => setTimeout(resolve, 50))

    act(() => {
      result.current.mutate("optimistic", slowMutation)
    })

    await waitFor(() => {
      expect(result.current.status).toBe("idle")
    })
    expect(onOptimisticApply).toHaveBeenCalledWith("optimistic")
  })

  it("rolls back and enters conflict state on mutation error", async () => {
    const onRollback = vi.fn()
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial", { onRollback })
    )

    await act(async () => {
      await result.current.mutate("optimistic", async () => {
        throw new Error("409 Conflict")
      })
    })

    expect(result.current.status).toBe("conflict")
    expect(result.current.currentValue).toBe("initial")
    expect(onRollback).toHaveBeenCalledWith("initial")
  })

  it("conflictState maps correctly from status", async () => {
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial")
    )

    await act(async () => {
      await result.current.mutate("optimistic", async () => {
        throw new Error("conflict")
      })
    })

    expect(result.current.conflictState).toBe("conflict")
  })

  it("keepMine resolves to resolved-local", async () => {
    const onKeepMine = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial", { onKeepMine })
    )

    // First trigger a conflict
    await act(async () => {
      await result.current.mutate("optimistic", async () => {
        throw new Error("conflict")
      })
    })

    // Then resolve by keeping mine
    await act(async () => {
      await result.current.keepMine()
    })

    expect(result.current.status).toBe("resolved-local")
    expect(result.current.conflictState).toBe("resolved-local")
  })

  it("loadLatest resolves to resolved-remote", async () => {
    const onLoadLatest = vi.fn().mockResolvedValue("remote-value")
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial", { onLoadLatest })
    )

    // Trigger conflict
    await act(async () => {
      await result.current.mutate("optimistic", async () => {
        throw new Error("conflict")
      })
    })

    // Resolve by loading latest
    await act(async () => {
      await result.current.loadLatest()
    })

    expect(result.current.status).toBe("resolved-remote")
    expect(result.current.currentValue).toBe("remote-value")
  })

  it("reset returns to idle", async () => {
    const { result } = renderHook(() =>
      useOptimisticMutation<string>("initial")
    )

    await act(async () => {
      await result.current.mutate("optimistic", async () => {
        throw new Error("conflict")
      })
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe("idle")
  })
})

// ── Accessibility ──────────────────────────────────────────────────────────

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (conflict state)", async () => {
    const { container } = render(
      <ConflictBanner
        state="conflict"
        description="Jordan Kim saved changes 30 seconds ago."
        onKeepMine={() => void 0}
        onLoadLatest={() => void 0}
      />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (resolving state)", async () => {
    const { container } = render(
      <ConflictBanner state="resolving" />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with diff)", async () => {
    const { container } = render(
      <ConflictBanner
        state="conflict"
        diffs={[{ field: "Title", yours: "Draft", theirs: "Final" }]}
      />
    )
    fireEvent.click(screen.getByText("See what changed"))
    await checkA11y(container)
  })
})
