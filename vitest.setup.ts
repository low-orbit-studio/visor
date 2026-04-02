import "@testing-library/jest-dom"
import { toHaveNoViolations } from "./test-utils/axe"
import { expect } from "vitest"

// Extend Vitest's expect with toHaveNoViolations from test-utils/axe.
// This makes the matcher globally available in all test files without
// requiring additional imports. Pattern for new component a11y tests:
//
//   import { axe } from "../../../test-utils/axe"
//   const results = await axe(container)
//   expect(results).toHaveNoViolations()
expect.extend({ toHaveNoViolations })

// Configure axe-core for the jsdom test environment.
// - allowedOrigins: required for axe to run against jsdom's document
// - color-contrast disabled: jsdom has no real CSS engine, so getComputedStyle
//   returns empty values and canvas is unimplemented. Color-contrast results are
//   always meaningless in jsdom and generate "Not implemented" noise in CI output.
import { configure } from "axe-core"
configure({
  allowedOrigins: ["<same_origin>"],
  rules: [{ id: "color-contrast", enabled: false }],
})

// Suppress jsdom "Not implemented" stderr noise from axe-core probing
// HTMLCanvasElement.getContext and window.getComputedStyle(elt, pseudoElt).
// These are expected in jsdom and don't affect test correctness.
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : ""
  if (msg.includes("Error: Not implemented:")) return
  originalConsoleError(...args)
}

// Mock ResizeObserver — not implemented in jsdom but required by some Radix UI
// primitives (e.g. Slider, ScrollArea). Provide a no-op implementation.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mock IntersectionObserver — not implemented in jsdom but required by Embla
// Carousel for slide visibility tracking.
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = "0px"
    readonly thresholds: ReadonlyArray<number> = [0]
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
    constructor(_cb: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  }
}

// Mock matchMedia — not implemented in jsdom but required by Embla Carousel
// for responsive breakpoint detection.
if (typeof globalThis.matchMedia === "undefined") {
  globalThis.matchMedia = function matchMedia(query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false
      },
    } as MediaQueryList
  }
}

// Mock scrollIntoView — not implemented in jsdom but required by cmdk
// (Command Palette) for keyboard navigation.
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = function () {}
}
