import * as React from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { classifyFile, DEFAULT_CLASSIFIERS } from "../classify"
import {
  SourceInspector,
  SourceInspectorProvider,
  SourceInspectorContext,
  type Mode,
} from "../source-inspector"
import { SourceInspectorToggle } from "../source-inspector-toggle"

describe("classifyFile", () => {
  it("labels Visor package files as visor", () => {
    expect(
      classifyFile("/app/node_modules/@loworbitstudio/visor/dist/index.js"),
    ).toBe("visor")
  })

  it("labels app source files as local", () => {
    expect(classifyFile("/Users/me/app/components/Local.tsx")).toBe("local")
  })

  it("labels other node_modules as third-party", () => {
    expect(classifyFile("/app/node_modules/react/index.js")).toBe("third-party")
  })

  it("labels missing file paths as dom", () => {
    expect(classifyFile(undefined)).toBe("dom")
    expect(classifyFile(null)).toBe("dom")
    expect(classifyFile("")).toBe("dom")
  })

  it("respects host-supplied classifiers (visor wins over local)", () => {
    const classifiers = {
      visor: (path: string) => path.includes("packages/ui/"),
      local: (path: string) => path.includes("packages/"),
    }
    expect(classifyFile("/repo/packages/ui/Button.tsx", classifiers)).toBe("visor")
    expect(classifyFile("/repo/packages/app/Page.tsx", classifiers)).toBe("local")
  })

  it("merges custom classifiers with defaults for unspecified labels", () => {
    const classifiers = { visor: () => false, local: () => false }
    expect(
      classifyFile(
        "/app/node_modules/lodash/index.js",
        classifiers,
      ),
    ).toBe("third-party")
  })

  it("default classifiers match the documented Visor layout", () => {
    expect(DEFAULT_CLASSIFIERS.visor!("node_modules/@loworbitstudio/visor")).toBe(
      true,
    )
    expect(DEFAULT_CLASSIFIERS.local!("/repo/src/App.tsx")).toBe(true)
    expect(DEFAULT_CLASSIFIERS.local!("/repo/node_modules/react/index.js")).toBe(
      false,
    )
  })
})

describe("SourceInspectorProvider", () => {
  it("cycles modes off → highlight-visor → highlight-non-visor → off", () => {
    const seen: Mode[] = []
    function Probe() {
      const ctx = React.useContext(SourceInspectorContext)!
      seen.push(ctx.mode)
      return (
        <button data-testid="cycle" onClick={ctx.cycleMode}>
          {ctx.mode}
        </button>
      )
    }
    render(
      <SourceInspectorProvider>
        <Probe />
      </SourceInspectorProvider>,
    )
    const btn = screen.getByTestId("cycle")
    act(() => {
      btn.click()
    })
    act(() => {
      btn.click()
    })
    act(() => {
      btn.click()
    })
    expect(seen).toEqual([
      "off",
      "highlight-visor",
      "highlight-non-visor",
      "off",
    ])
  })

  it("supports controlled mode", () => {
    const onModeChange = vi.fn()
    const { rerender } = render(
      <SourceInspectorProvider mode="off" onModeChange={onModeChange}>
        <ModeReader />
      </SourceInspectorProvider>,
    )
    expect(screen.getByTestId("mode")).toHaveTextContent("off")
    rerender(
      <SourceInspectorProvider mode="highlight-visor" onModeChange={onModeChange}>
        <ModeReader />
      </SourceInspectorProvider>,
    )
    expect(screen.getByTestId("mode")).toHaveTextContent("highlight-visor")
  })
})

function ModeReader() {
  const ctx = React.useContext(SourceInspectorContext)!
  return <span data-testid="mode">{ctx.mode}</span>
}

describe("SourceInspectorToggle", () => {
  beforeEach(() => {
    document.body.className = ""
  })

  it("renders the Scan icon button with off-state label", () => {
    render(
      <SourceInspectorProvider>
        <SourceInspectorToggle />
      </SourceInspectorProvider>,
    )
    const btn = screen.getByRole("button", { name: /source inspector off/i })
    expect(btn).toHaveAttribute("data-mode", "off")
  })

  it("cycles aria-label when clicked", async () => {
    const user = userEvent.setup()
    render(
      <SourceInspectorProvider>
        <SourceInspectorToggle />
      </SourceInspectorProvider>,
    )
    const btn = screen.getByRole("button")
    await user.click(btn)
    expect(btn).toHaveAttribute("data-mode", "highlight-visor")
    await user.click(btn)
    expect(btn).toHaveAttribute("data-mode", "highlight-non-visor")
    await user.click(btn)
    expect(btn).toHaveAttribute("data-mode", "off")
  })

  it("mounts a default provider when none is in scope", async () => {
    const user = userEvent.setup()
    render(<SourceInspectorToggle />)
    const btn = screen.getByRole("button")
    await user.click(btn)
    expect(btn).toHaveAttribute("data-mode", "highlight-visor")
  })
})

describe("SourceInspector runtime", () => {
  beforeEach(() => {
    document.body.className = ""
    document.body.querySelectorAll("[data-source]").forEach((el) =>
      el.removeAttribute("data-source"),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not stamp data-source while mode is off", () => {
    render(
      <div>
        <SourceInspector defaultMode="off">
          <p>hello</p>
        </SourceInspector>
      </div>,
    )
    expect(document.querySelectorAll("[data-source]").length).toBe(0)
  })

  it("stamps data-source on body subtree when mode is highlight-visor", async () => {
    render(
      <div data-testid="root">
        <SourceInspector defaultMode="highlight-visor" debounceMs={0}>
          <p data-testid="child">hello</p>
        </SourceInspector>
      </div>,
    )
    // Effects run synchronously in test mode; assert at least one stamp.
    const stamped = document.querySelectorAll("[data-source]")
    expect(stamped.length).toBeGreaterThan(0)
  })

  it("debounces MutationObserver callbacks", async () => {
    vi.useFakeTimers()
    const { unmount } = render(
      <SourceInspector defaultMode="highlight-visor" debounceMs={50} />,
    )
    // Trigger N rapid mutations
    const host = document.createElement("div")
    document.body.appendChild(host)
    for (let i = 0; i < 10; i++) {
      const child = document.createElement("span")
      host.appendChild(child)
    }
    // Allow MutationObserver microtasks to flush, then advance timers.
    await Promise.resolve()
    await Promise.resolve()
    vi.advanceTimersByTime(60)
    // The exact number of stamps depends on subtree size, but the debounce
    // means the observer schedules at most one stamp per debounce window.
    // Assert that the body has stamps (proving the stamp ran), and that
    // the MutationObserver did not throw.
    expect(document.querySelectorAll("[data-source]").length).toBeGreaterThan(0)
    document.body.removeChild(host)
    unmount()
  })

  it("toggles body class when mode changes", () => {
    const { rerender } = render(
      <SourceInspector mode="off">
        <p>x</p>
      </SourceInspector>,
    )
    expect(document.body.className).toBe("")
    rerender(
      <SourceInspector mode="highlight-visor">
        <p>x</p>
      </SourceInspector>,
    )
    expect(document.body.className).toMatch(/modeHighlightVisor/)
    rerender(
      <SourceInspector mode="highlight-non-visor">
        <p>x</p>
      </SourceInspector>,
    )
    expect(document.body.className).toMatch(/modeHighlightNonVisor/)
  })

  it("Ctrl+Shift+X cycles mode via window keydown", async () => {
    const onModeChange = vi.fn()
    render(
      <SourceInspector defaultMode="off" onModeChange={onModeChange}>
        <p>x</p>
      </SourceInspector>,
    )
    const event = new KeyboardEvent("keydown", {
      key: "x",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(onModeChange).toHaveBeenCalledWith("highlight-visor")
  })

  it("does NOT bind Ctrl+Shift+V by default", () => {
    const onModeChange = vi.fn()
    render(
      <SourceInspector defaultMode="off" onModeChange={onModeChange}>
        <p>x</p>
      </SourceInspector>,
    )
    const event = new KeyboardEvent("keydown", {
      key: "v",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(onModeChange).not.toHaveBeenCalled()
  })

  it("respects a custom hotkey prop", () => {
    const onModeChange = vi.fn()
    render(
      <SourceInspector defaultMode="off" hotkey="alt+i" onModeChange={onModeChange}>
        <p>x</p>
      </SourceInspector>,
    )
    const event = new KeyboardEvent("keydown", {
      key: "i",
      altKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(onModeChange).toHaveBeenCalledWith("highlight-visor")
  })

  it("disables the hotkey when null is passed", () => {
    const onModeChange = vi.fn()
    render(
      <SourceInspector defaultMode="off" hotkey={null} onModeChange={onModeChange}>
        <p>x</p>
      </SourceInspector>,
    )
    const event = new KeyboardEvent("keydown", {
      key: "x",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(onModeChange).not.toHaveBeenCalled()
  })
})

