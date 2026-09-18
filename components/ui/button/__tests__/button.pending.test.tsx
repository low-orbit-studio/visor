/**
 * Button — pending state (VI-643)
 *
 * The three properties that make this prop worth having, in order:
 *   1. it does not paint for a fast action (delay gate),
 *   2. it does not flash once it has painted (minimum duration),
 *   3. it never changes the control's geometry or its accessible name.
 *
 * All three are timing- or layout-shaped, so the delay gate is driven with
 * fake timers and the geometry claim is asserted structurally — the idle
 * children stay mounted inside the box, which is what holds the width.
 */

import { render, screen, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Button, BUTTON_PENDING_DELAY_MS, BUTTON_PENDING_MIN_DURATION_MS } from "../button"
import { checkA11y } from "../../../../test-utils/a11y"

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe("Button — pending, back-compat", () => {
  it("renders identically with pending absent and pending={false}", () => {
    const { container: without } = render(<Button variant="secondary">Save</Button>)
    const { container: withFalse } = render(
      <Button variant="secondary" pending={false}>Save</Button>
    )
    expect(withFalse.innerHTML).toBe(without.innerHTML)
  })

  it("emits no pending attributes when pending is absent", () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })
    expect(button).not.toHaveAttribute("data-pending")
    expect(button).not.toHaveAttribute("aria-busy")
    expect(button).not.toHaveAttribute("aria-disabled")
  })

  it("does not leak the pending config props onto the DOM node", () => {
    render(
      <Button pending={false} pendingLabel="Saving…" pendingDelay={10} pendingMinDuration={10}>
        Save
      </Button>
    )
    const button = screen.getByRole("button", { name: /save/i })
    expect(button).not.toHaveAttribute("pendingLabel")
    expect(button).not.toHaveAttribute("pendingdelay")
    expect(button).not.toHaveAttribute("pendingminduration")
  })
})

describe("Button — pending, delay gate", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("paints nothing for the first BUTTON_PENDING_DELAY_MS", () => {
    render(<Button pending>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })
    expect(button).not.toHaveAttribute("data-pending")

    advance(BUTTON_PENDING_DELAY_MS - 1)
    expect(button).not.toHaveAttribute("data-pending")
  })

  it("paints once the delay elapses", () => {
    render(<Button pending>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })

    advance(BUTTON_PENDING_DELAY_MS)
    expect(button).toHaveAttribute("data-pending", "true")
    expect(button.querySelector('[data-slot="button-pending"]')).not.toBeNull()
  })

  it("an action that resolves inside the delay never paints", () => {
    const { rerender } = render(<Button pending>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })

    advance(BUTTON_PENDING_DELAY_MS - 50)
    rerender(<Button pending={false}>Save</Button>)
    advance(BUTTON_PENDING_DELAY_MS + BUTTON_PENDING_MIN_DURATION_MS)

    expect(button).not.toHaveAttribute("data-pending")
    expect(button.querySelector('[data-slot="button-pending"]')).toBeNull()
  })

  it("honours an explicit pendingDelay over the default", () => {
    render(<Button pending pendingDelay={20}>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })

    advance(19)
    expect(button).not.toHaveAttribute("data-pending")
    advance(1)
    expect(button).toHaveAttribute("data-pending", "true")
  })

  it("paints immediately when pendingDelay is 0", () => {
    render(<Button pending pendingDelay={0}>Save</Button>)
    advance(0)
    expect(screen.getByRole("button", { name: /save/i })).toHaveAttribute("data-pending", "true")
  })
})

describe("Button — pending, minimum visible duration", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("holds the glyph for the minimum once it has painted", () => {
    const { rerender } = render(<Button pending pendingDelay={0}>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })
    advance(0)
    expect(button).toHaveAttribute("data-pending", "true")

    // Action resolves 10ms after the glyph appeared.
    advance(10)
    rerender(<Button pending={false} pendingDelay={0}>Save</Button>)
    expect(button).toHaveAttribute("data-pending", "true")

    advance(BUTTON_PENDING_MIN_DURATION_MS - 10 - 1)
    expect(button).toHaveAttribute("data-pending", "true")

    advance(1)
    expect(button).not.toHaveAttribute("data-pending")
  })

  it("releases immediately when the minimum has already elapsed", () => {
    const { rerender } = render(<Button pending pendingDelay={0}>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })
    advance(0)
    advance(BUTTON_PENDING_MIN_DURATION_MS + 50)

    rerender(<Button pending={false} pendingDelay={0}>Save</Button>)
    expect(button).not.toHaveAttribute("data-pending")
  })

  it("honours an explicit pendingMinDuration over the default", () => {
    const { rerender } = render(
      <Button pending pendingDelay={0} pendingMinDuration={40}>Save</Button>
    )
    const button = screen.getByRole("button", { name: /save/i })
    advance(0)
    rerender(<Button pending={false} pendingDelay={0} pendingMinDuration={40}>Save</Button>)

    advance(39)
    expect(button).toHaveAttribute("data-pending", "true")
    advance(1)
    expect(button).not.toHaveAttribute("data-pending")
  })
})

describe("Button — pending, geometry and name are held", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("keeps the idle children mounted in the box while pending", () => {
    render(<Button pending pendingDelay={0}>Save changes</Button>)
    advance(0)
    const button = screen.getByRole("button")
    const holder = button.querySelector('[data-slot="button-label"]')
    expect(holder).not.toBeNull()
    expect(holder).toHaveTextContent("Save changes")
  })

  it("keeps the accessible name when no pendingLabel is given", () => {
    render(<Button pending pendingDelay={0}>Save changes</Button>)
    advance(0)
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument()
  })

  it("keeps the accessible name when a pendingLabel IS given", () => {
    render(<Button pending pendingDelay={0} pendingLabel="Saving…">Save changes</Button>)
    advance(0)
    // The visible busy text is decorative; the control is not renamed mid-action.
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument()
    const overlay = screen.getByRole("button").querySelector('[data-slot="button-pending"]')
    expect(overlay).toHaveAttribute("aria-hidden", "true")
    expect(overlay).toHaveTextContent("Saving…")
  })

  it("adds no wrapper markup once the pending state releases", () => {
    const { rerender } = render(
      <Button pending pendingDelay={0} pendingMinDuration={0}>Save</Button>
    )
    advance(0)
    rerender(<Button pending={false} pendingDelay={0} pendingMinDuration={0}>Save</Button>)
    advance(0)
    const button = screen.getByRole("button", { name: /save/i })
    expect(button.querySelector('[data-slot="button-label"]')).toBeNull()
    expect(button.querySelector('[data-slot="button-pending"]')).toBeNull()
  })
})

describe("Button — pending, activation and state semantics", () => {
  it("suppresses the click handler before the glyph has even painted", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button pending onClick={onClick}>Save</Button>)
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("fires the click handler again once pending clears", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<Button pending onClick={onClick}>Save</Button>)
    rerender(<Button pending={false} onClick={onClick}>Save</Button>)
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("sets aria-busy while the action is in flight", () => {
    render(<Button pending>Save</Button>)
    expect(screen.getByRole("button", { name: /save/i })).toHaveAttribute("aria-busy", "true")
  })

  it("does not set the native disabled attribute, so the button stays focusable", () => {
    render(<Button pending>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })
    expect(button).not.toBeDisabled()
    button.focus()
    expect(button).toHaveFocus()
  })
})

describe("Button — pending, asChild", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("injects no pending chrome under asChild but still reports busy", () => {
    render(
      <Button asChild pending pendingDelay={0}>
        <a href="/save">Save</a>
      </Button>
    )
    advance(0)
    const link = screen.getByRole("link", { name: /save/i })
    expect(link).toHaveAttribute("aria-busy", "true")
    expect(link).toHaveAttribute("data-pending", "true")
    expect(link.querySelector('[data-slot="button-pending"]')).toBeNull()
  })
})

describe("Button — pending, accessibility", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("has no WCAG 2.1 AA violations while pending", async () => {
    const { container } = render(<Button pending pendingDelay={0}>Save changes</Button>)
    advance(0)
    vi.useRealTimers()
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations while pending with a pendingLabel", async () => {
    const { container } = render(
      <Button pending pendingDelay={0} pendingLabel="Saving…">Save changes</Button>
    )
    advance(0)
    vi.useRealTimers()
    await checkA11y(container)
  })
})

describe("Button — an inert button stops a FORM SUBMIT, not only an onClick", () => {
  /* Found by measurement in a consumer, not by reading. Suppressing `onClick`
     leaves the browser's own activation behaviour intact, so a `type="submit"`
     button in a pending (or gated) state still submitted its form through
     `onSubmit` — which the Button never sees. Most buttons either state exists
     for are submits inside a form, so the primitive has to cancel the default,
     not just the handler. */
  it("does not submit its form while pending", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" pending>Save</Button>
      </form>
    )
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("does not submit its form while gated", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" gated>Save</Button>
      </form>
    )
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits normally when it is neither", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>
    )
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
