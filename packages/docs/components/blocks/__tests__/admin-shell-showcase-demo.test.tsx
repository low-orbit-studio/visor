import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AdminShellShowcaseDemo } from "../admin-shell-showcase-demo"
import { checkA11y } from "../../../../../test-utils/a11y"

describe("AdminShellShowcaseDemo", () => {
  it("renders the AdminShell root", () => {
    const { container } = render(<AdminShellShowcaseDemo />)
    expect(
      container.querySelector("[data-slot='admin-shell']")
    ).toBeInTheDocument()
  })

  it("renders the WorkspaceSwitcher trigger in the logo slot", () => {
    render(<AdminShellShowcaseDemo />)
    expect(
      screen.getByRole("button", {
        name: /Switch workspace · current: Empire Room/,
      })
    ).toBeInTheDocument()
  })

  it("renders the ChromeButton cluster in topbarEnd", () => {
    render(<AdminShellShowcaseDemo />)
    expect(
      screen.getByRole("button", { name: /Search/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Density/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /New event/ })
    ).toBeInTheDocument()
  })

  it("renders the eyebrow group label inside sidebarNav", () => {
    render(<AdminShellShowcaseDemo />)
    expect(screen.getByText("Workspace")).toBeInTheDocument()
  })

  it("renders the sidebar footer cmd-K opener with Avatar + Kbd", () => {
    render(<AdminShellShowcaseDemo />)
    const opener = screen.getByRole("button", {
      name: "Open command palette",
    })
    expect(opener).toBeInTheDocument()
    // Kbd "⌘" + "K" rendered inside
    expect(opener.querySelectorAll("kbd")).toHaveLength(2)
  })

  it("passes accessibility checks", async () => {
    const { container } = render(<AdminShellShowcaseDemo />)
    await checkA11y(container)
  })
})
