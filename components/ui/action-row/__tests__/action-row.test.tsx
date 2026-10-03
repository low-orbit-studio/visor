import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ActionRow, ActionRowList } from "../action-row"
import { checkA11y } from "../../../../test-utils/a11y"

const Icon = () => <svg data-testid="icon" aria-hidden="true" width="16" height="16" />

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ActionRow slots", () => {
  it("renders a button with a title", () => {
    render(<ActionRow>Address</ActionRow>)
    const row = screen.getByRole("button", { name: "Address" })
    expect(row.tagName).toBe("BUTTON")
    expect(row).toHaveAttribute("type", "button")
    expect(row).toHaveAttribute("data-slot", "action-row")
    expect(row.querySelector('[data-slot="action-row-title"]')).toHaveTextContent("Address")
  })

  it("renders the leading slot, hidden from assistive tech", () => {
    render(<ActionRow leading={<Icon />}>Address</ActionRow>)
    const leading = screen.getByTestId("icon").closest('[data-slot="action-row-leading"]')
    expect(leading).toBeInTheDocument()
    expect(leading).toHaveAttribute("aria-hidden", "true")
  })

  it("renders the second line, and it is part of the accessible name", () => {
    render(<ActionRow line="Open in Maps">Address</ActionRow>)
    expect(screen.getByText("Open in Maps").closest('[data-slot="action-row-line"]')).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Address Open in Maps" })).toBeInTheDocument()
  })

  it("renders the trailing slot", () => {
    render(<ActionRow trailing="2 riders">Riders</ActionRow>)
    expect(screen.getByText("2 riders").closest('[data-slot="action-row-trailing"]')).toBeInTheDocument()
  })

  it("renders no slot wrappers that were not given", () => {
    const { container } = render(<ActionRow>Plain</ActionRow>)
    expect(container.querySelector('[data-slot="action-row-leading"]')).toBeNull()
    expect(container.querySelector('[data-slot="action-row-line"]')).toBeNull()
    expect(container.querySelector('[data-slot="action-row-trailing"]')).toBeNull()
  })

  it("merges className and forwards the ref", () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(
      <ActionRow ref={ref} className="extra">
        Row
      </ActionRow>
    )
    expect(ref.current).toBe(screen.getByRole("button"))
    expect(ref.current?.className).toContain("extra")
  })

  it("lets a consumer set type=submit", () => {
    render(<ActionRow type="submit">Save</ActionRow>)
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit")
  })
})

describe("ActionRow asChild", () => {
  it("renders as the child anchor with every slot around its text", () => {
    render(
      <ActionRow asChild leading={<Icon />} line="Opens Billing Details" trailing="Visa 4242">
        <a href="/billing">Payment</a>
      </ActionRow>
    )
    const link = screen.getByRole("link", { name: "Payment Opens Billing Details Visa 4242" })
    expect(link.tagName).toBe("A")
    expect(link).toHaveAttribute("href", "/billing")
    expect(link).toHaveAttribute("data-slot", "action-row")
    expect(link).not.toHaveAttribute("type")
    expect(link.querySelector('[data-slot="action-row-title"]')).toHaveTextContent("Payment")
    expect(link.querySelector('[data-slot="action-row-leading"]')).toBeInTheDocument()
    expect(link.querySelector('[data-slot="action-row-line"]')).toBeInTheDocument()
    expect(link.querySelector('[data-slot="action-row-trailing"]')).toBeInTheDocument()
  })

  it("activates the link with Enter", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    render(
      <ActionRow asChild onClick={onClick}>
        <a href="/billing">Payment</a>
      </ActionRow>
    )
    await user.tab()
    expect(screen.getByRole("link")).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe("ActionRow keyboard activation", () => {
  it("is in the tab order and activates with Enter and Space", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ActionRow onClick={onClick}>Visibility</ActionRow>)
    await user.tab()
    expect(screen.getByRole("button")).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("activates on click", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ActionRow onClick={onClick}>Visibility</ActionRow>)
    await user.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe("ActionRow selected state", () => {
  it("is not current at rest", () => {
    render(<ActionRow>Row</ActionRow>)
    const row = screen.getByRole("button")
    expect(row).not.toHaveAttribute("aria-current")
    expect(row).not.toHaveAttribute("data-selected")
  })

  it("sets aria-current and data-selected when selected", () => {
    render(<ActionRow selected>Row</ActionRow>)
    const row = screen.getByRole("button")
    expect(row).toHaveAttribute("aria-current", "true")
    expect(row).toHaveAttribute("data-selected", "true")
  })

  it("lets a consumer say which kind of current (a link to the current page)", () => {
    render(
      <ActionRow asChild selected aria-current="page">
        <a href="/here">Here</a>
      </ActionRow>
    )
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page")
  })

  it("uses aria-selected on a selectable role, where aria-current is not allowed", () => {
    render(
      <div role="listbox" aria-label="Choices">
        <ActionRow role="option" selected>
          Everyone
        </ActionRow>
        <ActionRow role="option">Friends</ActionRow>
      </div>
    )
    const [a, b] = screen.getAllByRole("option")
    expect(a).toHaveAttribute("aria-selected", "true")
    expect(a).not.toHaveAttribute("aria-current")
    expect(b).not.toHaveAttribute("aria-selected")
  })
})

describe("ActionRow open and disabled states", () => {
  it("exposes open through aria-expanded and data-state", () => {
    const { rerender } = render(<ActionRow open>Visibility</ActionRow>)
    const row = screen.getByRole("button")
    expect(row).toHaveAttribute("aria-expanded", "true")
    expect(row).toHaveAttribute("data-state", "open")
    rerender(<ActionRow open={false}>Visibility</ActionRow>)
    expect(row).toHaveAttribute("aria-expanded", "false")
    expect(row).toHaveAttribute("data-state", "closed")
  })

  it("leaves aria-expanded off when open is not given", () => {
    render(<ActionRow>Visibility</ActionRow>)
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-expanded")
  })

  it("disables the button and blocks activation", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ActionRow disabled onClick={onClick}>
        Row
      </ActionRow>
    )
    const row = screen.getByRole("button")
    expect(row).toBeDisabled()
    expect(row).toHaveAttribute("data-disabled")
    await user.click(row)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("disables an anchor with aria-disabled, out of the tab order, with its click blocked", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ActionRow asChild disabled onClick={onClick}>
        <a href="/billing">Payment</a>
      </ActionRow>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("aria-disabled", "true")
    expect(link).toHaveAttribute("tabindex", "-1")
    await user.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe("ActionRow trailing slot is non-interactive", () => {
  it("warns in development when a button is put in it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<ActionRow trailing={<button type="button">Edit</button>}>Row</ActionRow>)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain("[ActionRow]")
    expect(String(warn.mock.calls[0][0])).toContain("<button>")
  })

  it("warns for an input (a Switch's control) and a tabbable element", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { unmount } = render(<ActionRow trailing={<input type="checkbox" aria-label="On" />}>Row</ActionRow>)
    expect(warn).toHaveBeenCalledTimes(1)
    unmount()
    render(<ActionRow trailing={<span tabIndex={0}>x</span>}>Row</ActionRow>)
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it("warns once per mount, not on every render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { rerender } = render(<ActionRow trailing={<a href="/x">x</a>}>Row</ActionRow>)
    rerender(<ActionRow trailing={<a href="/x">y</a>}>Row</ActionRow>)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it("does not warn for a value, a badge or a caret", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <ActionRow
        trailing={
          <>
            <span>Review</span>
            <svg aria-hidden="true" />
          </>
        }
      >
        Row
      </ActionRow>
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it("is silent in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubEnv("NODE_ENV", "production")
    try {
      render(<ActionRow trailing={<button type="button">Edit</button>}>Row</ActionRow>)
      expect(warn).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe("ActionRowList", () => {
  it("is a list with each row in a list item", () => {
    render(
      <ActionRowList aria-label="Pass details">
        <ActionRow>Address</ActionRow>
        <ActionRow>Riders</ActionRow>
        <ActionRow>Payment</ActionRow>
      </ActionRowList>
    )
    const list = screen.getByRole("list", { name: "Pass details" })
    expect(list).toHaveAttribute("data-slot", "action-row-list")
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    expect(screen.getAllByRole("button")).toHaveLength(3)
  })

  it("forwards the ref and merges className", () => {
    const ref = React.createRef<HTMLUListElement>()
    render(
      <ActionRowList ref={ref} className="extra">
        <ActionRow>Row</ActionRow>
      </ActionRowList>
    )
    expect(ref.current?.tagName).toBe("UL")
    expect(ref.current?.className).toContain("extra")
  })
})

describe("ActionRow stylesheet contract", () => {
  const css = readFileSync(join(process.cwd(), "components/ui/action-row/action-row.module.css"), "utf-8")

  it("is at least 44px tall", () => {
    expect(css).toMatch(/min-height:\s*var\(--action-row-min-height,\s*2\.75rem\)/)
  })

  it("draws no visible border; the selected edge is a state edge on --control-state-edge-width", () => {
    expect(css).toMatch(/border:\s*0;/)
    expect(css).toMatch(/outline:\s*var\(--control-state-edge-width,\s*1px\)\s+solid\s+transparent/)
    expect(css).not.toContain("--control-edge-width")
    expect(css).not.toMatch(/border(-\w+)?:\s*[1-9]\d*px\s+solid\s+var\(--(border|hairline)/)
  })

  it("draws the list hairline on --hairline-width", () => {
    expect(css).toMatch(/\.item \+ \.item[^}]*--hairline-width/)
  })

  it("gives rest, hover, open, selected and disabled each a token", () => {
    for (const token of ["hover-bg", "open-bg", "selected-bg", "selected-edge-color", "disabled-opacity"]) {
      expect(css).toContain(`--action-row-${token}`)
    }
  })

  it("keeps the focus ring on the shared focus tokens", () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*--focus-ring-width[^}]*--border-focus[^}]*--focus-ring-offset/)
  })

  it("does not re-declare font or font-family (the reset owns them)", () => {
    expect(css).not.toMatch(/^\s*font(-family)?:\s*inherit/m)
  })
})

describe("ActionRow accessibility (WCAG 2.2 AA, axe)", () => {
  it("has no violations as a bare button", async () => {
    const { container } = render(<ActionRow>Address</ActionRow>)
    await checkA11y(container)
  })

  it("has no violations with every slot filled", async () => {
    const { container } = render(
      <ActionRow leading={<Icon />} line="Open in Maps" trailing={<span>Review</span>}>
        Address
      </ActionRow>
    )
    await checkA11y(container)
  })

  it("has no violations selected, open and disabled", async () => {
    const { container } = render(
      <ActionRowList aria-label="Visibility">
        <ActionRow selected trailing="Everyone">
          Selected
        </ActionRow>
        <ActionRow open trailing="Friends">
          Open
        </ActionRow>
        <ActionRow disabled trailing="Off">
          Disabled
        </ActionRow>
      </ActionRowList>
    )
    await checkA11y(container)
  })

  it("has no violations as a link, selected and disabled", async () => {
    const { container } = render(
      <ActionRowList aria-label="Pages">
        <ActionRow asChild selected aria-current="page">
          <a href="/here">Here</a>
        </ActionRow>
        <ActionRow asChild disabled>
          <a href="/there">There</a>
        </ActionRow>
      </ActionRowList>
    )
    await checkA11y(container)
  })

  it("has no violations as options in a listbox", async () => {
    const { container } = render(
      <div role="listbox" aria-label="Visibility">
        <ActionRow role="option" selected>
          Everyone
        </ActionRow>
        <ActionRow role="option">Friends</ActionRow>
      </div>
    )
    await checkA11y(container)
  })
})
