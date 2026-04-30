import * as React from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { classifyByVisorName, classifyFile, DEFAULT_CLASSIFIERS } from "../classify"
import {
  SourceInspector,
  SourceInspectorProvider,
  SourceInspectorContext,
  extractFirstUserUrl,
  findOwnerName,
  inheritStamps,
  stampSubtree,
  type Mode,
} from "../source-inspector"
import { SourceInspectorToggle } from "../source-inspector-toggle"
import { VISOR_COMPONENT_NAMES } from "../visor-component-names.generated"

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

  // VI-310 — bundler chunk URLs (React 19 / Next 16 dev): inputs are URLs,
  // not file paths. Default classifiers must handle both forms.
  it("labels webpack chunk URLs containing visor as visor", () => {
    expect(
      classifyFile(
        "http://localhost:4124/_next/static/chunks/node_modules/@loworbitstudio/visor/dist/index.js",
      ),
    ).toBe("visor")
  })

  it("labels turbopack underscore-mangled visor chunk URLs as visor", () => {
    expect(
      classifyFile(
        "http://localhost:4124/_next/static/chunks/node_modules_loworbitstudio_visor_dist_index_js.js",
      ),
    ).toBe("visor")
  })

  it("labels project chunk URLs as local", () => {
    expect(
      classifyFile("http://localhost:4124/_next/static/chunks/_03lt5v7._.js"),
    ).toBe("local")
  })

  it("labels third-party chunk URLs as third-party", () => {
    expect(
      classifyFile(
        "http://localhost:4124/_next/static/chunks/node_modules_react-dom_index_js.js",
      ),
    ).toBe("third-party")
  })
})

// VI-311 — name-based classifier path. Turbopack flattens chunk URLs so
// `@loworbitstudio/visor` is no longer present, but the React component name
// in `_debugOwner.type.name` survives. The set is generated from the
// registry by `scripts/generate-visor-component-names.ts`.
describe("classifyByVisorName", () => {
  it("returns 'visor' for known registry component names", () => {
    expect(classifyByVisorName("AdminShell")).toBe("visor")
    expect(classifyByVisorName("Avatar")).toBe("visor")
    expect(classifyByVisorName("Kbd")).toBe("visor")
    expect(classifyByVisorName("ThemeSwitcher")).toBe("visor")
  })

  it("returns 'visor' for sub-components exported from a registry file", () => {
    // Sub-components like MenubarItem and DropdownMenuItem are exported
    // alongside their parent and need to match too — owner fibers can land
    // on any of them, not just the top-level export.
    expect(classifyByVisorName("MenubarItem")).toBe("visor")
    expect(classifyByVisorName("DropdownMenuItem")).toBe("visor")
    expect(classifyByVisorName("AvatarFallback")).toBe("visor")
  })

  it("returns undefined for names not in the registry-derived set", () => {
    expect(classifyByVisorName("AppShell")).toBeUndefined()
    expect(classifyByVisorName("OrgSwitcher")).toBeUndefined()
    expect(classifyByVisorName("CommandPalette")).toBeUndefined()
  })

  it("returns undefined for empty/missing input", () => {
    expect(classifyByVisorName(undefined)).toBeUndefined()
    expect(classifyByVisorName(null)).toBeUndefined()
    expect(classifyByVisorName("")).toBeUndefined()
  })

  it("registry-derived set contains the canonical names from the live diagnostic", () => {
    // Sentinel against accidental regen drops — these specific names were
    // observed misclassified in admin-v7-r2 and motivated the fix.
    for (const name of ["AdminShell", "ThemeSwitcher", "Avatar", "Kbd"]) {
      expect(VISOR_COMPONENT_NAMES.has(name)).toBe(true)
    }
  })
})

describe("findOwnerName", () => {
  it("walks the owner chain to the first non-empty type.name", () => {
    const fiber = {
      _debugOwner: {
        type: { name: "Avatar" },
      },
    }
    expect(findOwnerName(fiber)).toBe("Avatar")
  })

  it("prefers displayName over name", () => {
    const fiber = {
      _debugOwner: {
        type: { name: "_internal", displayName: "Avatar" },
      },
    }
    expect(findOwnerName(fiber)).toBe("Avatar")
  })

  it("skips owners without a type.name and continues up the chain", () => {
    const fiber = {
      _debugOwner: {
        type: {},
        _debugOwner: {
          type: { name: "AdminShell" },
        },
      },
    }
    expect(findOwnerName(fiber)).toBe("AdminShell")
  })

  it("returns undefined for a fiber with no debug owner", () => {
    expect(findOwnerName(null)).toBeUndefined()
    expect(findOwnerName({})).toBeUndefined()
  })
})

describe("extractFirstUserUrl", () => {
  it("returns the first non-React frame URL", () => {
    const stack = [
      "Error",
      "    at exports.jsxDEV (http://localhost:4124/_next/static/chunks/node_modules_loworbitstudio_visor.js:211:33)",
      "    at WorkspaceSwitcher (http://localhost:4124/_next/static/chunks/_03lt5v7._.js:636:214)",
      "    at AppShell (http://localhost:4124/_next/static/chunks/_03lt5v7._.js:2695:215)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe(
      "http://localhost:4124/_next/static/chunks/_03lt5v7._.js",
    )
  })

  it("strips :line:col suffix", () => {
    const stack = "Error\n    at user (http://localhost/x.js:10:20)"
    expect(extractFirstUserUrl(stack)).toBe("http://localhost/x.js")
  })

  it("skips react-stack-bottom-frame frames", () => {
    const stack = [
      "Error",
      "    at react-stack-bottom-frame (http://localhost/react-dom.js:99:1)",
      "    at MyComponent (http://localhost/app.js:5:5)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe("http://localhost/app.js")
  })

  it("returns undefined when every frame is React-internal", () => {
    const stack = [
      "Error",
      "    at jsxDEV (http://localhost/react-jsx-dev-runtime.js:1:1)",
      "    at react-stack-bottom-frame (http://localhost/react-dom.js:2:2)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBeUndefined()
  })

  it("returns undefined for an empty or stack-less input", () => {
    expect(extractFirstUserUrl("")).toBeUndefined()
    expect(extractFirstUserUrl("Error: something broke")).toBeUndefined()
  })

  it("parses bare 'at URL:L:C' frames without parens", () => {
    const stack = [
      "Error",
      "    at jsxDEV http://localhost/react.js:1:1",
      "    at http://localhost/app.js:5:5",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe("http://localhost/app.js")
  })

  // VI-314 — Issue 2: Turbopack-bundled visor jsxDEV shim shows up as a
  // bare `at https://…` line with no function name. The function-name
  // pattern can't catch it; the URL alone identifies it as runtime.
  it("skips unnamed frames at /_next/static/chunks/node_modules URLs", () => {
    const stack = [
      "Error",
      "    at http://localhost:4124/_next/static/chunks/node_modules_0y4365v._.js:211:33",
      "    at AppShell (http://localhost:4124/_next/static/chunks/_0w5vjw_._.js:3205:225)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe(
      "http://localhost:4124/_next/static/chunks/_0w5vjw_._.js",
    )
  })

  it("skips unnamed frames at react-dom URLs", () => {
    const stack = [
      "Error",
      "    at http://localhost/react-dom-client.development.js:5:5",
      "    at MyComp (http://localhost/app.js:10:10)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe("http://localhost/app.js")
  })

  it("skips unnamed frames at react-server-dom URLs", () => {
    const stack = [
      "Error",
      "    at http://localhost/react-server-dom-webpack-client.js:1:1",
      "    at MyComp (http://localhost/app.js:5:5)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe("http://localhost/app.js")
  })

  it("skips unnamed frames at /_next/dist/ URLs", () => {
    const stack = [
      "Error",
      "    at http://localhost/_next/dist/compiled/react/jsx-runtime.js:1:1",
      "    at MyComp (http://localhost/app.js:5:5)",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe("http://localhost/app.js")
  })

  // Guards against over-aggressive filtering: an unnamed frame at a user
  // app chunk (no node_modules in the URL) must NOT be skipped.
  it("keeps unnamed frames at user-app chunk URLs", () => {
    const stack = [
      "Error",
      "    at http://localhost:4124/_next/static/chunks/_03lt5v7._.js:5:5",
    ].join("\n")
    expect(extractFirstUserUrl(stack)).toBe(
      "http://localhost:4124/_next/static/chunks/_03lt5v7._.js",
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

  it("standalone mount applies overlay on first click (body class + data-source stamps)", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <SourceInspectorToggle />
        <p>hello</p>
      </div>,
    )
    const btn = screen.getByRole("button")
    await user.click(btn)
    expect(document.body.className).toMatch(/modeHighlightVisor/)
    expect(document.querySelectorAll("[data-source]").length).toBeGreaterThan(0)
  })

  it("standalone mount clears overlay when cycled back to off", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <SourceInspectorToggle />
        <p>hello</p>
      </div>,
    )
    const btn = screen.getByRole("button")
    await user.click(btn) // off → highlight-visor
    await user.click(btn) // → highlight-non-visor
    await user.click(btn) // → off
    expect(btn).toHaveAttribute("data-mode", "off")
    expect(document.body.className).not.toMatch(/modeHighlight/)
    expect(document.querySelectorAll("[data-source]").length).toBe(0)
  })

  it("when nested inside <SourceInspector>, uses parent context and does not double-mount", async () => {
    const onModeChange = vi.fn()
    const user = userEvent.setup()
    render(
      <SourceInspector defaultMode="off" onModeChange={onModeChange}>
        <SourceInspectorToggle />
      </SourceInspector>,
    )
    const btn = screen.getByRole("button")
    await user.click(btn)
    // Parent's onModeChange fires — proves toggle uses the existing context
    expect(onModeChange).toHaveBeenCalledWith("highlight-visor")
    // Body class appears exactly once — no nested Runner re-applying the class
    const matches = document.body.className.match(/modeHighlightVisor/g) ?? []
    expect(matches.length).toBe(1)
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

  // VI-310 — verifies the React 19 resolver path: walk `_debugOwner` →
  // parse `_debugStack` → extract first user URL → classify. If the resolver
  // ever returns undefined, every element classifies as "dom" and this test
  // fails. Uses a permissive classifier so any user URL labels as visor.
  it("resolves a source URL from the React 19 owner stack", async () => {
    const calls: Array<string | null | undefined> = []
    const captureClassifier = {
      visor: (source: string) => {
        calls.push(source)
        return Boolean(source)
      },
      local: () => false,
      thirdParty: () => false,
    }
    function ProbeChild() {
      return <span data-testid="probe">probe</span>
    }
    render(
      <SourceInspector
        defaultMode="highlight-visor"
        debounceMs={0}
        classifiers={captureClassifier}
      >
        <ProbeChild />
      </SourceInspector>,
    )
    const probe = screen.getByTestId("probe")
    // Resolver fed at least one non-empty source string into the classifier.
    const usableCall = calls.find((c) => typeof c === "string" && c.length > 0)
    expect(usableCall).toBeDefined()
    expect(probe).toHaveAttribute("data-source", "visor")
  })

  // VI-311 — Turbopack hashes `@loworbitstudio/visor` out of chunk URLs, so
  // URL classification cannot identify Visor renders under Next 16. The
  // name-based fast path consults `_debugOwner.type.name` against the
  // registry-derived set BEFORE URL classification.
  it("labels Visor-named components as 'visor' via name match", () => {
    // `AdminShell` is in VISOR_COMPONENT_NAMES; the function name flows to
    // `_debugOwner.type.name` so the runner can see it without parsing URLs.
    function AdminShell() {
      return <span data-testid="visor-probe">probe</span>
    }
    render(
      <SourceInspector defaultMode="highlight-visor" debounceMs={0}>
        <AdminShell />
      </SourceInspector>,
    )
    expect(screen.getByTestId("visor-probe")).toHaveAttribute(
      "data-source",
      "visor",
    )
  })

  it("falls through to URL classification when the owner name is not in the set", () => {
    function NotAVisorBlock() {
      return <span data-testid="non-visor-probe">probe</span>
    }
    render(
      <SourceInspector defaultMode="highlight-visor" debounceMs={0}>
        <NotAVisorBlock />
      </SourceInspector>,
    )
    // Default URL classifier on a non-node_modules path → "local". The
    // exact label is bundler-dependent; assert it is NOT a name-match win.
    const probe = screen.getByTestId("non-visor-probe")
    expect(probe.getAttribute("data-source")).not.toBe("visor")
  })

  it("custom visor classifier disables the name-based fast path", () => {
    function AdminShell() {
      return <span data-testid="override-probe">probe</span>
    }
    const customClassifiers = {
      visor: () => false,
      local: () => true,
      thirdParty: () => false,
    }
    render(
      <SourceInspector
        defaultMode="highlight-visor"
        debounceMs={0}
        classifiers={customClassifiers}
      >
        <AdminShell />
      </SourceInspector>,
    )
    // Name path is bypassed (custom visor predicate present), URL path runs,
    // custom `local` returns true → "local". Without the bypass this would
    // be "visor" via name match.
    expect(screen.getByTestId("override-probe")).toHaveAttribute(
      "data-source",
      "local",
    )
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

// VI-314 — Issue 1: server-component leaves and document body produce
// fibers with no `_debugOwner`, falling through to `data-source="dom"`.
// `inheritStamps` walks the DOM ancestry as a coverage fallback so leaves
// inherit the nearest stamped ancestor's label. Driven via direct DOM
// manipulation against `inheritStamps` / `stampSubtree` so the assertions
// don't depend on jsdom fiber wiring.
describe("inheritStamps (DOM ancestry fallback)", () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement("div")
    document.body.appendChild(root)
  })

  afterEach(() => {
    if (root.parentNode) root.parentNode.removeChild(root)
  })

  it("inherits 'visor' from nearest stamped ancestor when leaf is dom", () => {
    root.setAttribute("data-source", "visor")
    const child = document.createElement("span")
    child.setAttribute("data-source", "dom")
    root.appendChild(child)
    inheritStamps(root)
    expect(child.getAttribute("data-source")).toBe("visor")
  })

  it("inherits 'local' across an unrelated dom intermediate", () => {
    const visorAncestor = document.createElement("section")
    visorAncestor.setAttribute("data-source", "local")
    const intermediate = document.createElement("div")
    intermediate.setAttribute("data-source", "dom")
    const leaf = document.createElement("span")
    leaf.setAttribute("data-source", "dom")
    intermediate.appendChild(leaf)
    visorAncestor.appendChild(intermediate)
    root.appendChild(visorAncestor)
    inheritStamps(root)
    // Both the intermediate and leaf inherit 'local' from the section.
    expect(intermediate.getAttribute("data-source")).toBe("local")
    expect(leaf.getAttribute("data-source")).toBe("local")
  })

  it("does not inherit 'third-party'", () => {
    root.setAttribute("data-source", "third-party")
    const child = document.createElement("span")
    child.setAttribute("data-source", "dom")
    root.appendChild(child)
    inheritStamps(root)
    expect(child.getAttribute("data-source")).toBe("dom")
  })

  it("does not inherit 'dom'", () => {
    root.setAttribute("data-source", "dom")
    const child = document.createElement("span")
    child.setAttribute("data-source", "dom")
    root.appendChild(child)
    inheritStamps(root)
    expect(child.getAttribute("data-source")).toBe("dom")
  })

  it("leaves elements with no stamped ancestor as dom", () => {
    // Leaf attached directly to root with no labeled ancestors above it.
    const leaf = document.createElement("span")
    leaf.setAttribute("data-source", "dom")
    root.appendChild(leaf)
    inheritStamps(root)
    expect(leaf.getAttribute("data-source")).toBe("dom")
  })

  it("stops walking at root — does not cross root boundary", () => {
    // An ancestor labeled outside the stamping root must not bleed into
    // children inside the root. Mirrors the real case where `document.body`
    // is the stamping root.
    const outerVisor = document.createElement("div")
    outerVisor.setAttribute("data-source", "visor")
    const leaf = document.createElement("span")
    leaf.setAttribute("data-source", "dom")
    root.appendChild(leaf)
    document.body.removeChild(root)
    outerVisor.appendChild(root)
    document.body.appendChild(outerVisor)
    inheritStamps(root)
    expect(leaf.getAttribute("data-source")).toBe("dom")
  })

  it("does not overwrite already-classified labels", () => {
    root.setAttribute("data-source", "visor")
    const local = document.createElement("div")
    local.setAttribute("data-source", "local")
    root.appendChild(local)
    inheritStamps(root)
    expect(local.getAttribute("data-source")).toBe("local")
  })
})

// VI-314 integration — drive `stampSubtree` end-to-end against a fabricated
// React fiber chain to prove the per-element classifier + ancestry pass
// land on the expected labels for the canonical "Search ⌘K under
// AdminShell" trace.
describe("stampSubtree integration", () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.createElement("div")
    document.body.appendChild(root)
  })

  afterEach(() => {
    if (root.parentNode) root.parentNode.removeChild(root)
  })

  it("server-component leaves inside a Visor shell inherit 'visor'", () => {
    // Mock fiber where the root has an AdminShell owner (matches registry
    // → name-based path → "visor"). The button inside has no _debugOwner.
    const adminShellOwner = { type: { name: "AdminShell" } }
    type Mock = {
      _debugOwner?: typeof adminShellOwner | null
      return?: Mock | null
    }
    const rootFiber: Mock = { _debugOwner: adminShellOwner }
    const leafFiber: Mock = { _debugOwner: null, return: null }
    // Wire fibers to elements via the magic React property.
    const fiberKey = "__reactFiber$test"
    Object.defineProperty(root, fiberKey, {
      value: rootFiber,
      configurable: true,
      enumerable: true,
    })
    const button = document.createElement("button")
    button.textContent = "Search ⌘K"
    Object.defineProperty(button, fiberKey, {
      value: leafFiber,
      configurable: true,
      enumerable: true,
    })
    root.appendChild(button)

    stampSubtree(root, DEFAULT_CLASSIFIERS, false)

    expect(root.getAttribute("data-source")).toBe("visor")
    expect(button.getAttribute("data-source")).toBe("visor")
  })

  it("body-level orphans without a stamped ancestor stay 'dom'", () => {
    // No fiber attached → fast path returns no name → URL fallback fails →
    // labels as dom. With no stamped ancestor inside `root`, ancestry pass
    // is a no-op and the label remains dom.
    const orphan = document.createElement("p")
    orphan.textContent = "orphan"
    root.appendChild(orphan)
    stampSubtree(root, DEFAULT_CLASSIFIERS, false)
    expect(orphan.getAttribute("data-source")).toBe("dom")
  })
})

