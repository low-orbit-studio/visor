import { render, screen } from "@testing-library/react"
import { afterEach, describe, it, expect, vi } from "vitest"
import { Button } from "../button"
import styles from "../button.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

const Glyph = () => (
  <svg viewBox="0 0 256 256" width="1em" height="1em" aria-hidden="true">
    <path d="M0 0h256v256H0z" />
  </svg>
)

describe('Button size="icon" (VI-659)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it("applies the icon size class and keeps the accessible name", () => {
    render(
      <Button size="icon" variant="ghost" aria-label="Remove tag">
        <Glyph />
      </Button>
    )
    const button = screen.getByRole("button", { name: "Remove tag" })
    expect(button).toHaveClass(styles.sizeIcon)
    expect(button).toHaveClass(styles.variantGhost)
  })

  it("passes axe with an aria-label", async () => {
    const { container } = render(
      <Button size="icon" variant="ghost" aria-label="Edit">
        <Glyph />
      </Button>
    )
    await checkA11y(container)
  })

  it("warns in development when there is no aria-label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <Button size="icon">
        <Glyph />
      </Button>
    )
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('size="icon"')
  })

  it("does not warn with an aria-label or aria-labelledby", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <>
        <Button size="icon" aria-label="Delete">
          <Glyph />
        </Button>
        <span id="lbl">Close</span>
        <Button size="icon" aria-labelledby="lbl">
          <Glyph />
        </Button>
      </>
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it("does not warn when the name comes from a title, a text child or an asChild child", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <>
        <Button size="icon" title="Delete">
          <Glyph />
        </Button>
        <Button size="icon">
          <Glyph />
          Delete
        </Button>
        <Button size="icon" asChild>
          <a href="#x" aria-label="Open">
            <Glyph />
          </a>
        </Button>
      </>
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it("does not warn for a labelled text button", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Button>Save</Button>)
    expect(warn).not.toHaveBeenCalled()
  })

  it("stays silent in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <Button size="icon">
        <Glyph />
      </Button>
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it("warns once per mount, not on every render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { rerender } = render(
      <Button size="icon" className="a">
        <Glyph />
      </Button>
    )
    rerender(
      <Button size="icon" className="b">
        <Glyph />
      </Button>
    )
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
