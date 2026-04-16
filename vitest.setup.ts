import "@testing-library/jest-dom"

// axe-core + toHaveNoViolations matcher now live in test-utils/axe.ts and are
// registered lazily on first import from an a11y test file. Removed from global
// setup to avoid paying axe-core's ~200ms import cost on ~200 non-a11y files.

// Suppress jsdom "Not implemented" stderr noise (axe-core probes
// HTMLCanvasElement.getContext and window.getComputedStyle(elt, pseudoElt)).
// Kept here because other libs can emit the same noise even without axe.
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
// (Command Palette) for keyboard navigation. Guard against node environment
// where Element is not defined (e.g. CLI tests with @vitest-environment node).
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = function () {}
}
