import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ThemeToggle } from "../theme-toggle"
import { checkA11y } from "../../../../test-utils/a11y"

const css = readFileSync(join(__dirname, "../theme-toggle.module.css"), "utf8")

describe("ThemeToggle", () => {
  it("is a button named Switch light or dark by default", () => {
    render(<ThemeToggle value="light" />)
    expect(screen.getByRole("button", { name: "Switch light or dark" })).toHaveAttribute("type", "button")
  })

  it("takes its own aria-label", () => {
    render(<ThemeToggle value="light" aria-label="Dark mode" />)
    expect(screen.getByRole("button", { name: "Dark mode" })).toBeInTheDocument()
  })

  it("keys its icons off its own data-tone", () => {
    const { rerender } = render(<ThemeToggle value="dark" />)
    expect(screen.getByRole("button")).toHaveAttribute("data-tone", "dark")
    rerender(<ThemeToggle value="light" />)
    expect(screen.getByRole("button")).toHaveAttribute("data-tone", "light")
  })

  it("asks for the other tone, and stays controlled", async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(<ThemeToggle value="light" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button"))
    expect(onValueChange).toHaveBeenLastCalledWith("dark")
    expect(screen.getByRole("button")).toHaveAttribute("data-tone", "light")
    rerender(<ThemeToggle value="dark" onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("button"))
    expect(onValueChange).toHaveBeenLastCalledWith("light")
  })

  it("runs onClick first and skips the change when it prevents default", async () => {
    const onValueChange = vi.fn()
    render(<ThemeToggle value="light" onValueChange={onValueChange} onClick={(e) => e.preventDefault()} />)
    await userEvent.click(screen.getByRole("button"))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("forwards className and ref", () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<ThemeToggle value="light" className="extra" ref={ref} />)
    expect(ref.current).toHaveClass("extra")
  })

  it("hides both icons from assistive tech", () => {
    const { container } = render(<ThemeToggle value="light" />)
    const icons = container.querySelectorAll("svg")
    expect(icons).toHaveLength(2)
    icons.forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"))
  })

  it("carries Backstage's motion and honours reduced motion", () => {
    expect(css).toContain("rotate: -100deg")
    expect(css).toContain("rotate: 100deg")
    expect(css).toContain("scale: 0.3")
    expect(css).toContain("scale: 0.94")
    expect(css).toContain("var(--motion-easing-spring")
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*rotate: none/)
  })

  it("has no axe violations in either tone", async () => {
    const { container, rerender } = render(<ThemeToggle value="light" />)
    await checkA11y(container)
    rerender(<ThemeToggle value="dark" />)
    await checkA11y(container)
  })
})
