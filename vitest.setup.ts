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

// Mock scrollIntoView — not implemented in jsdom but required by cmdk
// (Command Palette) for keyboard navigation.
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = function () {}
}
