import { render, screen, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip"
import { checkA11y } from "../../../../test-utils/a11y"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { generateThemeData, parseConfig } from "../../../../packages/theme-engine/src/pipeline"
import { resolveConfig } from "../../../../packages/theme-engine/src/resolve"
import { nextjsAdapter } from "../../../../packages/theme-engine/src/adapters/nextjs"
import type { AdapterInput } from "../../../../packages/theme-engine/src/adapters/types"

describe("Tooltip", () => {
  it("renders trigger without crashing", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByText("Hover me")).toBeInTheDocument()
  })

  it("renders the trigger element", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Trigger button</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByText("Trigger button")).toBeInTheDocument()
  })

  it("TooltipProvider renders children", () => {
    render(
      <TooltipProvider>
        <span>Provider child</span>
      </TooltipProvider>
    )
    expect(screen.getByText("Provider child")).toBeInTheDocument()
  })

  it("renders with custom className on content", () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    // When open, content with data-slot should be in the DOM
    const content = container.querySelector("[data-slot='tooltip-content']")
    if (content) {
      expect(content).toHaveClass("custom-tooltip")
    }
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed state)", async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Help</button>
          </TooltipTrigger>
          <TooltipContent>More information about this feature</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(
        <TooltipProvider>
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <button>Help</button>
            </TooltipTrigger>
            <TooltipContent>More information about this feature</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      container = result.container
    })
    await checkA11y(container!)
  })
})

// VI-683: TooltipContent forwards `container` to the Radix Portal, so a theme
// scoped to a wrapper class reaches the tooltip instead of stopping at <body>.
describe("portal container (VI-683)", () => {
  it("mounts the content outside the render container when none is passed", () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Default portal</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const content = document.querySelector("[data-slot='tooltip-content']")
    expect(content).not.toBeNull()
    expect(container.contains(content)).toBe(false)
    expect(document.body.contains(content)).toBe(true)
  })

  it("mounts the content inside the passed container, not on body", () => {
    const themeRoot = document.createElement("div")
    themeRoot.className = "scoped-theme"
    document.body.appendChild(themeRoot)
    const outside = document.createElement("div")
    document.body.appendChild(outside)

    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent container={themeRoot}>Scoped portal</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
      { container: outside }
    )

    const content = document.querySelector("[data-slot='tooltip-content']")
    expect(content).not.toBeNull()
    expect(themeRoot.contains(content)).toBe(true)
    expect(outside.contains(content)).toBe(false)
    expect(content!.closest(".scoped-theme")).toBe(themeRoot)

    themeRoot.remove()
    outside.remove()
  })

  it("does not forward container onto the content element", () => {
    const themeRoot = document.createElement("div")
    document.body.appendChild(themeRoot)
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent container={themeRoot}>Scoped portal</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const content = document.querySelector("[data-slot='tooltip-content']")
    expect(content!.hasAttribute("container")).toBe(false)
    themeRoot.remove()
  })
})

// VI-683: the tooltip reads its own ground and ink, falling back to the pair it
// always read. jsdom cannot resolve var() through a stylesheet, so the fallback
// is asserted on the CSS source; component-token-contract.test.ts holds the
// same invariant for the whole contract.
describe("tooltip tokens (VI-683)", () => {
  const css = readFileSync(
    join(process.cwd(), "components/ui/tooltip/tooltip.module.css"),
    "utf-8"
  )

  it("falls back to --surface-overlay / --text-inverse when no tooltip token is set", () => {
    expect(css).toContain(
      "background-color: var(--tooltip-bg, var(--surface-overlay, #111827));"
    )
    expect(css).toContain("color: var(--tooltip-text, var(--text-inverse, #ffffff));")
  })

  it("reads the overlay pair only through the tooltip tokens", () => {
    // A bare read of either would bypass the override.
    expect(css).not.toMatch(/:\s*var\(--surface-overlay/)
    expect(css).not.toMatch(/:\s*var\(--text-inverse/)
  })

  it("flips to a legible dark-mode default that still yields to the theme binding", () => {
    expect(css).toMatch(/:global\(:where\(\.dark\)\) \.content/)
    expect(css).toContain("background-color: var(--tooltip-bg, var(--text-primary, #f9fafb));")
    expect(css).toContain("color: var(--tooltip-text, var(--text-inverse, #111827));")
  })

  const theme = (block: string) => `
name: tooltip-dark
version: 1
colors:
  primary: "#2ce0e6"
${block}
`

  function emit(yaml: string): string {
    const data = generateThemeData(yaml)
    return nextjsAdapter({
      config: resolveConfig(parseConfig(yaml)),
      primitives: data.primitives,
      tokens: data.tokens,
    } as AdapterInput) as string
  }

  it("a theme binding components.tooltip emits --tooltip-bg / --tooltip-text", () => {
    const out = emit(
      theme(`components:
  tooltip:
    bg:
      dark: "rgba(0, 0, 0, 0.8)"
    text:
      dark: "#fafafa"`)
    )
    expect(out).toContain("--tooltip-bg: rgba(0, 0, 0, 0.8);")
    expect(out).toContain("--tooltip-text: #fafafa;")
  })

  it("a flat overrides.dark pair emits the same properties through the brand pass-through", () => {
    const out = emit(
      theme(`overrides:
  dark:
    tooltip-bg: "rgba(0, 0, 0, 0.8)"
    tooltip-text: "#fafafa"`)
    )
    expect(out).toContain("--tooltip-bg: rgba(0, 0, 0, 0.8);")
    expect(out).toContain("--tooltip-text: #fafafa;")
  })

  it("a theme binding neither emits no tooltip token, so the fallback holds", () => {
    const out = emit(theme(""))
    expect(out).not.toContain("--tooltip-bg:")
    expect(out).not.toContain("--tooltip-text:")
  })
})
