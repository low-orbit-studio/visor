/**
 * Lightweight axe-core wrapper for Visor component a11y tests.
 *
 * Replaces vitest-axe to eliminate the lodash-es transitive dependency
 * (which has unpatched vulnerabilities). Provides the same `axe()` +
 * `toHaveNoViolations` API surface.
 *
 * Usage:
 *   import { axe } from "../../../test-utils/axe"
 *   const results = await axe(container)
 *   expect(results).toHaveNoViolations()
 */

import { run as axeRun, configure, type RunOptions, type AxeResults } from "axe-core"
import { expect } from "vitest"
import type { ExpectationResult } from "@vitest/expect"

// Self-contained a11y setup — configures axe + registers matcher on first import.
// Moved from vitest.setup.ts so only the ~11 *.a11y.test.tsx files pay the
// axe-core import cost (previously loaded globally for all 222 test files).
let axeSetupDone = false
function ensureAxeSetup() {
  if (axeSetupDone) return
  axeSetupDone = true
  configure({
    allowedOrigins: ["<same_origin>"],
    rules: [{ id: "color-contrast", enabled: false }],
  })
  expect.extend({ toHaveNoViolations })
}
ensureAxeSetup()

/**
 * Run axe-core against an HTML element and return the results.
 */
export async function axe(
  html: Element | string,
  options: RunOptions = {}
): Promise<AxeResults> {
  let element: Element

  if (typeof html === "string") {
    const wrapper = document.createElement("div")
    // Safe: only used in test environment with developer-controlled strings
    wrapper.innerHTML = html
    document.body.appendChild(wrapper)
    element = wrapper
  } else {
    element = html
  }

  return axeRun(element, options)
}

/**
 * Custom Vitest matcher: `expect(results).toHaveNoViolations()`
 */
export function toHaveNoViolations(results: AxeResults): ExpectationResult {
  const violations = results.violations

  if (violations.length === 0) {
    return {
      pass: true,
      message: () => "Expected accessibility violations but found none",
    }
  }

  const messages = violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.html}`).join("\n")
      return `[${v.id}] ${v.description}\n  Impact: ${v.impact}\n  Nodes:\n${nodes}`
    })
    .join("\n\n")

  return {
    pass: false,
    message: () =>
      `${violations.length} accessibility violation(s) found:\n\n${messages}`,
  }
}
