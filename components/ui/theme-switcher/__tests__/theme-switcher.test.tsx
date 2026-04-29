import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeSwitcher, type ThemeOption } from "../theme-switcher"

const SAMPLE_THEMES: ThemeOption[] = [
  { id: "alpha", label: "Alpha", bodyClass: "alpha-theme" },
  { id: "beta", label: "Beta", bodyClass: "beta-theme" },
]

beforeEach(() => {
  localStorage.clear()
  document.body.className = ""
  document.documentElement.className = ""
  document.documentElement.style.colorScheme = ""
})

afterEach(() => {
  document.body.className = ""
  document.documentElement.className = ""
})

describe("ThemeSwitcher", () => {
  it("renders only the Mode segment when no themes are provided", async () => {
    render(<ThemeSwitcher />)
    // Wait for mount effect
    await screen.findByRole("group", { name: /theme and mode switcher/i })
    expect(screen.getByRole("radiogroup", { name: /mode/i })).toBeInTheDocument()
    expect(screen.queryByRole("radiogroup", { name: /^theme$/i })).toBeNull()
  })

  it("renders the Theme segment when themes are provided", async () => {
    render(<ThemeSwitcher themes={SAMPLE_THEMES} />)
    await screen.findByRole("radiogroup", { name: /^theme$/i })
    expect(screen.getByRole("radio", { name: "Alpha" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Beta" })).toBeInTheDocument()
  })

  it("applies a theme bodyClass and persists it on click", async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher themes={SAMPLE_THEMES} />)
    const beta = await screen.findByRole("radio", { name: "Beta" })
    await user.click(beta)
    expect(document.body.classList.contains("beta-theme")).toBe(true)
    expect(document.body.classList.contains("alpha-theme")).toBe(false)
    expect(localStorage.getItem("visor-theme")).toBe("beta")
  })

  it("applies a mode html class and persists it on click", async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher />)
    const light = await screen.findByRole("radio", { name: "Light" })
    await user.click(light)
    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe("light")
    expect(localStorage.getItem("visor-color-mode")).toBe("light")
  })

  it("restores theme from localStorage on mount", async () => {
    localStorage.setItem("visor-theme", "beta")
    render(<ThemeSwitcher themes={SAMPLE_THEMES} />)
    const beta = await screen.findByRole("radio", { name: "Beta" })
    expect(beta).toHaveAttribute("aria-checked", "true")
  })

  it("renders extras slot inside the wrapper", async () => {
    render(<ThemeSwitcher extras={<button data-testid="extras-button">x</button>} />)
    const wrapper = await screen.findByRole("group", { name: /theme and mode switcher/i })
    const extras = screen.getByTestId("extras-button")
    expect(wrapper).toContainElement(extras)
  })

  it("respects custom storage keys", async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher modeStorageKey="custom-mode" />)
    await user.click(await screen.findByRole("radio", { name: "Light" }))
    expect(localStorage.getItem("custom-mode")).toBe("light")
    expect(localStorage.getItem("visor-color-mode")).toBeNull()
  })

  it("ignores invalid stored theme ids", async () => {
    localStorage.setItem("visor-theme", "does-not-exist")
    render(<ThemeSwitcher themes={SAMPLE_THEMES} />)
    const alpha = await screen.findByRole("radio", { name: "Alpha" })
    expect(alpha).toHaveAttribute("aria-checked", "true")
  })
})
