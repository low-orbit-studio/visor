import "@testing-library/jest-dom"
import "vitest-axe/extend-expect"
import * as matchers from "vitest-axe/matchers"
import { expect } from "vitest"

// Extend Vitest's expect with toHaveNoViolations from vitest-axe.
// This makes the matcher globally available in all test files without
// requiring additional imports. Pattern for new component a11y tests:
//
//   import { axe } from "vitest-axe"
//   const results = await axe(container)
//   expect(results).toHaveNoViolations()
expect.extend(matchers)

// Configure axe-core to use jsdom's document implementation
// This ensures axe runs correctly in the test environment
import { configure } from "axe-core"
configure({ allowedOrigins: ["<same_origin>"] })

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
