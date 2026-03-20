/**
 * Accessibility test helper for Visor components.
 *
 * Wraps axe-core to provide a simple `checkA11y` function that runs
 * WCAG 2.1 AA checks on a rendered container and throws if violations are found.
 *
 * Usage:
 *   import { checkA11y } from "../../../test-utils/a11y"
 *   const { container } = render(<MyComponent />)
 *   await checkA11y(container)
 */

import { run as axeRun, type RunOptions, type AxeResults } from "axe-core"

/** WCAG 2.1 AA ruleset tag set */
const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]

/**
 * Run axe-core WCAG 2.1 AA checks against the provided container element.
 * Throws a descriptive error if any violations are found.
 */
export async function checkA11y(
  container: Element | Document = document,
  options: RunOptions = {}
): Promise<AxeResults> {
  const results = await axeRun(container, {
    runOnly: { type: "tag", values: WCAG_AA_TAGS },
    ...options,
  })

  if (results.violations.length > 0) {
    const messages = results.violations
      .map((v) => {
        const nodes = v.nodes.map((n) => `  - ${n.html}`).join("\n")
        return `[${v.id}] ${v.description}\n  Impact: ${v.impact}\n  Nodes:\n${nodes}`
      })
      .join("\n\n")

    throw new Error(
      `${results.violations.length} accessibility violation(s) found:\n\n${messages}`
    )
  }

  return results
}
