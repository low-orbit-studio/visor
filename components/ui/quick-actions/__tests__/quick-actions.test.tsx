import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { QuickActions } from "../quick-actions"
import { checkA11y } from "../../../../test-utils/a11y"

const sampleActions = [
  { id: "new", label: "New event", keys: ["N"] },
  { id: "cmd", label: "Open command", keys: ["⌘", "K"] },
  { id: "switch", label: "Switch venue", keys: ["⌘", "O"] },
  { id: "help", label: "Help", keys: ["?"] },
]

describe("QuickActions", () => {
  it("renders a row for each action", () => {
    render(<QuickActions actions={sampleActions} />)
    expect(screen.getByText("New event")).toBeInTheDocument()
    expect(screen.getByText("Open command")).toBeInTheDocument()
    expect(screen.getByText("Switch venue")).toBeInTheDocument()
    expect(screen.getByText("Help")).toBeInTheDocument()
  })

  it("renders an empty <ul> when actions is empty", () => {
    const { container } = render(<QuickActions actions={[]} />)
    const list = container.querySelector('[data-slot="quick-actions"]')
    expect(list).toBeInTheDocument()
    expect(list?.children).toHaveLength(0)
  })

  it("applies data-slot='quick-actions' to root", () => {
    const { container } = render(<QuickActions actions={sampleActions} />)
    const list = container.querySelector('[data-slot="quick-actions"]')
    expect(list?.tagName).toBe("UL")
  })

  it("applies data-slot='quick-actions-row' to each row", () => {
    const { container } = render(<QuickActions actions={sampleActions} />)
    const rows = container.querySelectorAll('[data-slot="quick-actions-row"]')
    expect(rows).toHaveLength(sampleActions.length)
  })

  it("renders a semantic <kbd> for each action's keys", () => {
    const { container } = render(
      <QuickActions
        actions={[{ id: "cmd", label: "Open command", keys: ["⌘", "K"] }]}
      />
    )
    const kbds = container.querySelectorAll("kbd")
    expect(kbds).toHaveLength(2)
    expect(kbds[0].textContent).toBe("⌘")
    expect(kbds[1].textContent).toBe("K")
  })

  it("forwards arbitrary props (aria-label) to the root <ul>", () => {
    const { container } = render(
      <QuickActions actions={sampleActions} aria-label="Quick actions" />
    )
    expect(container.querySelector("ul")).toHaveAttribute(
      "aria-label",
      "Quick actions"
    )
  })

  it("root has role='list' in display-only mode", () => {
    const { container } = render(<QuickActions actions={sampleActions} />)
    expect(container.querySelector("ul")).toHaveAttribute("role", "list")
  })

  it("root has role='group' in interactive mode", () => {
    const { container } = render(
      <QuickActions actions={sampleActions} onActivate={() => {}} />
    )
    expect(container.querySelector("ul")).toHaveAttribute("role", "group")
  })

  it("forwards ref to the root <ul>", () => {
    const ref = { current: null as HTMLUListElement | null }
    render(<QuickActions ref={ref} actions={sampleActions} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("UL")
  })

  it("applies custom className to the root", () => {
    const { container } = render(
      <QuickActions actions={sampleActions} className="custom-class" />
    )
    expect(container.querySelector("ul")).toHaveClass("custom-class")
  })

  describe("display-only mode (default)", () => {
    it("rows render as plain <li> with no role='button'", () => {
      const { container } = render(<QuickActions actions={sampleActions} />)
      const rows = container.querySelectorAll('[data-slot="quick-actions-row"]')
      rows.forEach((row) => {
        expect(row.tagName).toBe("LI")
        expect(row.getAttribute("role")).not.toBe("button")
      })
    })

    it("rows have no tabIndex", () => {
      const { container } = render(<QuickActions actions={sampleActions} />)
      const rows = container.querySelectorAll('[data-slot="quick-actions-row"]')
      rows.forEach((row) => {
        expect(row.hasAttribute("tabIndex")).toBe(false)
      })
    })

    it("rows do not carry data-interactive", () => {
      const { container } = render(<QuickActions actions={sampleActions} />)
      const rows = container.querySelectorAll('[data-slot="quick-actions-row"]')
      rows.forEach((row) => {
        expect(row.getAttribute("data-interactive")).toBeNull()
      })
    })
  })

  describe("interactive mode (onActivate supplied)", () => {
    it("rows render with role='button' and tabIndex=0", () => {
      const { container } = render(
        <QuickActions actions={sampleActions} onActivate={() => {}} />
      )
      const rows = container.querySelectorAll('[data-slot="quick-actions-row"]')
      rows.forEach((row) => {
        expect(row.getAttribute("role")).toBe("button")
        expect(row.getAttribute("tabindex")).toBe("0")
      })
    })

    it("rows carry data-interactive='true'", () => {
      const { container } = render(
        <QuickActions actions={sampleActions} onActivate={() => {}} />
      )
      const rows = container.querySelectorAll('[data-slot="quick-actions-row"]')
      rows.forEach((row) => {
        expect(row.getAttribute("data-interactive")).toBe("true")
      })
    })

    it("click fires onActivate with the row's id", () => {
      const onActivate = vi.fn()
      render(
        <QuickActions actions={sampleActions} onActivate={onActivate} />
      )
      fireEvent.click(screen.getByText("New event"))
      expect(onActivate).toHaveBeenCalledWith("new")
    })

    it("Enter key fires onActivate with the row's id", () => {
      const onActivate = vi.fn()
      const { container } = render(
        <QuickActions actions={sampleActions} onActivate={onActivate} />
      )
      const firstRow = container.querySelector(
        '[data-slot="quick-actions-row"]'
      ) as HTMLElement
      fireEvent.keyDown(firstRow, { key: "Enter" })
      expect(onActivate).toHaveBeenCalledWith("new")
    })

    it("Space key fires onActivate with the row's id", () => {
      const onActivate = vi.fn()
      const { container } = render(
        <QuickActions actions={sampleActions} onActivate={onActivate} />
      )
      const firstRow = container.querySelector(
        '[data-slot="quick-actions-row"]'
      ) as HTMLElement
      fireEvent.keyDown(firstRow, { key: " " })
      expect(onActivate).toHaveBeenCalledWith("new")
    })

    it("other keys do not fire onActivate", () => {
      const onActivate = vi.fn()
      const { container } = render(
        <QuickActions actions={sampleActions} onActivate={onActivate} />
      )
      const firstRow = container.querySelector(
        '[data-slot="quick-actions-row"]'
      ) as HTMLElement
      fireEvent.keyDown(firstRow, { key: "Tab" })
      fireEvent.keyDown(firstRow, { key: "Escape" })
      fireEvent.keyDown(firstRow, { key: "ArrowDown" })
      expect(onActivate).not.toHaveBeenCalled()
    })

    it("Enter key prevents default (avoids form submission)", () => {
      const onActivate = vi.fn()
      const { container } = render(
        <QuickActions actions={sampleActions} onActivate={onActivate} />
      )
      const firstRow = container.querySelector(
        '[data-slot="quick-actions-row"]'
      ) as HTMLElement
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      })
      firstRow.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })
  })
})

describe("QuickActions accessibility", () => {
  it("has no WCAG 2.1 AA violations (display-only mode)", async () => {
    const { container } = render(
      <QuickActions aria-label="Quick actions" actions={sampleActions} />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (interactive mode)", async () => {
    const { container } = render(
      <QuickActions
        aria-label="Quick actions"
        actions={sampleActions}
        onActivate={() => {}}
      />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (empty actions)", async () => {
    const { container } = render(
      <QuickActions aria-label="Quick actions" actions={[]} />
    )
    await checkA11y(container)
  })
})
