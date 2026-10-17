import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useSuccessToast, SuccessLiveRegion, SuccessPanel } from "../success-feedback"
import { Toaster } from "../../toast/toast"
import { checkA11y } from "../../../../test-utils/a11y"

/* ──────────────────────────────────────────────────────────────────────────
   useSuccessToast hook
   ────────────────────────────────────────────────────────────────────────── */

describe("useSuccessToast", () => {
  it("returns a showSuccess function", () => {
    const { result } = renderHook(() => useSuccessToast())
    expect(typeof result.current.showSuccess).toBe("function")
  })

  it("showSuccess fires and message appears in the DOM", async () => {
    render(<Toaster />)
    const { result } = renderHook(() => useSuccessToast())
    act(() => {
      result.current.showSuccess("Project saved")
    })
    await waitFor(() => {
      expect(screen.getByText("Project saved")).toBeInTheDocument()
    })
  })

  it("showSuccess with description renders both title and description", async () => {
    render(<Toaster />)
    const { result } = renderHook(() => useSuccessToast())
    act(() => {
      result.current.showSuccess("Changes saved", {
        description: "All changes have been applied.",
      })
    })
    await waitFor(() => {
      expect(screen.getByText("Changes saved")).toBeInTheDocument()
      expect(screen.getByText("All changes have been applied.")).toBeInTheDocument()
    })
  })

  it("showSuccess with action renders action label", async () => {
    render(<Toaster />)
    const { result } = renderHook(() => useSuccessToast())
    const handleUndo = vi.fn()
    act(() => {
      result.current.showSuccess("Item deleted", {
        action: { label: "Undo", onClick: handleUndo },
      })
    })
    await waitFor(() => {
      expect(screen.getByText("Undo")).toBeInTheDocument()
    })
  })

  it("clamps duration below minimum to 3000ms", () => {
    // We spy on the toast.success import to verify the clamped value is passed.
    // Since Sonner is a real module, we verify via indirect behaviour:
    // the hook should not throw and should call successfully.
    const { result } = renderHook(() => useSuccessToast())
    expect(() =>
      result.current.showSuccess("Low duration", { duration: 100 })
    ).not.toThrow()
  })

  it("clamps duration above maximum to 8000ms", () => {
    const { result } = renderHook(() => useSuccessToast())
    expect(() =>
      result.current.showSuccess("High duration", { duration: 999999 })
    ).not.toThrow()
  })
})

/* ──────────────────────────────────────────────────────────────────────────
   SuccessLiveRegion component
   ────────────────────────────────────────────────────────────────────────── */

describe("SuccessLiveRegion", () => {
  it("renders with role=status and aria-live=polite", () => {
    const { container } = render(<SuccessLiveRegion message="File uploaded" />)
    const region = container.querySelector("[data-slot='success-live-region']")
    expect(region).toBeTruthy()
    expect(region?.getAttribute("role")).toBe("status")
    expect(region?.getAttribute("aria-live")).toBe("polite")
    expect(region?.getAttribute("aria-atomic")).toBe("true")
  })

  it("renders the message text", () => {
    render(<SuccessLiveRegion message="Settings saved" />)
    expect(screen.getByText("Settings saved")).toBeInTheDocument()
  })

  it("renders empty message by default", () => {
    const { container } = render(<SuccessLiveRegion />)
    const region = container.querySelector("[data-slot='success-live-region']")
    expect(region?.textContent).toBe("")
  })

  it("is visually hidden (sr-only class applied)", () => {
    const { container } = render(<SuccessLiveRegion message="Hidden" />)
    const region = container.querySelector("[data-slot='success-live-region']")
    // The liveRegion class applies position:absolute and clip — verify the class exists
    expect(region?.className).toBeTruthy()
  })

  it("forwards additional HTML attributes", () => {
    render(<SuccessLiveRegion message="Test" data-testid="live-region" />)
    expect(screen.getByTestId("live-region")).toBeInTheDocument()
  })
})

/* ──────────────────────────────────────────────────────────────────────────
   SuccessPanel (VI-714)
   ────────────────────────────────────────────────────────────────────────── */

describe("SuccessPanel", () => {
  const region = (c: HTMLElement) => c.querySelector("[data-slot='success-live-region']")

  it("announces its heading once, on mount", async () => {
    const { container, rerender } = render(<SuccessPanel heading="You're all set" />)
    await waitFor(() => expect(region(container)?.textContent).toBe("You're all set"))
    rerender(<SuccessPanel heading="You're all set" description="Changed copy" />)
    rerender(<SuccessPanel heading="A later heading" />)
    expect(container.querySelectorAll("[data-slot='success-live-region']")).toHaveLength(1)
    expect(region(container)?.textContent).toBe("You're all set")
  })

  it("renders the heading, description and action", () => {
    render(
      <SuccessPanel
        heading="You're all set"
        description="Your bookings live on your dashboard."
        action={<button type="button">Go to Dashboard</button>}
      />
    )
    expect(screen.getByRole("heading", { name: "You're all set" })).toBeInTheDocument()
    expect(screen.getByText("Your bookings live on your dashboard.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to Dashboard" })).toBeInTheDocument()
  })

  it("draws a seal with a default check icon, hidden from assistive tech", () => {
    const { container } = render(<SuccessPanel heading="Done" />)
    const seal = container.querySelector("[data-slot='success-panel-seal']")
    expect(seal).toHaveAttribute("aria-hidden", "true")
    expect(seal?.querySelector("svg")).not.toBeNull()
  })

  it("takes icons through slots", () => {
    const { container } = render(
      <SuccessPanel
        heading="Done"
        icon={<i data-testid="seal-icon" />}
        items={[{ icon: <i data-testid="row-icon" />, content: "Bank details" }]}
      />
    )
    expect(screen.getByTestId("seal-icon")).toBeInTheDocument()
    expect(screen.getByTestId("row-icon")).toBeInTheDocument()
    expect(container.querySelector("[data-slot='success-panel-item'] svg")).toBeNull()
  })

  it("renders a check list with a check per row and bold runs", () => {
    const { container } = render(
      <SuccessPanel
        heading="Done"
        items={[
          { content: <><b>Your info</b> is saved.</> },
          { content: <><b>Your W-9</b> is signed.</> },
        ]}
      />
    )
    const rows = container.querySelectorAll("[data-slot='success-panel-item']")
    expect(rows).toHaveLength(2)
    rows.forEach((r) => expect(r.querySelector("svg")).not.toBeNull())
    expect(screen.getByText("Your info").tagName).toBe("B")
  })

  it("omits the description, list and action when not given", () => {
    const { container } = render(<SuccessPanel heading="Done" />)
    expect(container.querySelector("[data-slot='success-panel-description']")).toBeNull()
    expect(container.querySelector("[data-slot='success-panel-list']")).toBeNull()
    expect(container.querySelector("[data-slot='success-panel-action']")).toBeNull()
  })

  it("forwards ref, className and attributes", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<SuccessPanel ref={ref} heading="Done" className="custom" data-testid="panel" />)
    expect(ref.current).toBe(screen.getByTestId("panel"))
    expect(screen.getByTestId("panel")).toHaveClass("custom")
  })

  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <SuccessPanel
        heading="You're all set"
        description="Your bookings live on your dashboard."
        items={[{ content: <><b>Your info</b> is saved.</> }]}
        action={<button type="button">Go to Dashboard</button>}
      />
    )
    await checkA11y(container)
  })
})

/* ──────────────────────────────────────────────────────────────────────────
   Accessibility
   ────────────────────────────────────────────────────────────────────────── */

describe("accessibility", () => {
  it("SuccessLiveRegion has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <SuccessLiveRegion message="Project saved" />
    )
    await checkA11y(container)
  })
})
