// @vitest-environment node
/**
 * VI-661 — Badge ground and ink tokens, proven in a real browser.
 *
 * Every variant reads `var(--badge-bg, <its shipped ground>)` and
 * `var(--badge-ink, <its shipped ink>)`. jsdom cannot resolve a stylesheet
 * cascade, so this bundles each variant the way `visor render` does, loads it
 * in Chromium, and reads computed styles:
 *
 *  - unset, every variant computes exactly what the shipped CSS computes (the
 *    same CSS with the two wrappers unwrapped back to their fallbacks);
 *  - set on an ancestor or on the badge itself, the tokens win in every
 *    variant, under both the standard and editorial densities;
 *  - the border never moves — no visible edge is added.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep),
 * mirroring control-edge-switch.test.ts. The CI-portable half — every variant
 * reads both tokens with its exact shipped fallback — is held by
 * component-token-contract.test.ts.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { FIXTURES } from "../../../packages/cli/src/commands/render"
import { bundle, close, launch, open, ready, type PageLike } from "./render-page"

const VARIANTS = Object.keys(FIXTURES.badge)
const DENSITIES = ["standard", "editorial"] as const
const TOKENS = ["--badge-bg", "--badge-ink"]

/** Distinct from every value any variant ships, in any theme. */
const BG = "rgb(1, 2, 3)"
const INK = "rgb(4, 5, 6)"

const READ = `(function () {
  var cs = getComputedStyle(document.querySelector('#root [data-slot="badge"]'));
  return JSON.stringify({
    bg: cs.backgroundColor,
    ink: cs.color,
    border: [cs.borderTopStyle, cs.borderTopWidth, cs.borderTopColor].join(" "),
  });
})()`

interface Look { bg: string; ink: string; border: string }

/**
 * Rewrite every `var(<token>, X)` for the two tokens, bracket-aware (X nests
 * its own var() and color-mix() calls).
 */
function rewrite(css: string, to: (token: string, fallback: string) => string): string {
  let out = css
  for (const token of TOKENS) {
    const head = `var(${token}, `
    let from = 0
    let i: number
    while ((i = out.indexOf(head, from)) !== -1) {
      let depth = 1
      let j = i + head.length
      for (; depth > 0; j++) {
        if (out[j] === "(") depth++
        else if (out[j] === ")") depth--
      }
      const replacement = to(token, out.slice(i + head.length, j - 1))
      out = out.slice(0, i) + replacement + out.slice(j)
      from = i + replacement.length
    }
  }
  return out
}

/** The CSS as it shipped before VI-661: each wrapper unwrapped to its fallback. */
const unwrap = (css: string) => rewrite(css, (_, fallback) => fallback)

/** The mutation: each wrapper read bare, with no fallback. */
const stripFallbacks = (css: string) => rewrite(css, (token) => `var(${token})`)

async function look(
  variant: string,
  density: (typeof DENSITIES)[number],
  opts: { componentCss?: string; set?: "ancestor" | "self" } = {},
): Promise<Look> {
  // A distinct inherited colour, so an ink that silently fell through to
  // inheritance (outline's --text-primary matches the page's) cannot pass.
  const page: PageLike = await open("badge", variant, { componentCss: opts.componentCss, extraCss: "#root { color: rgb(7, 8, 9); }" })
  if (density === "editorial") {
    await page.evaluate(`document.getElementById("theme-scope").setAttribute("data-density", "editorial")`)
  }
  if (opts.set) {
    const target = opts.set === "ancestor" ? `document.getElementById("theme-scope")` : `document.querySelector('#root [data-slot="badge"]')`
    await page.evaluate(`(function () { var el = ${target}; el.style.setProperty("--badge-bg", "${BG}"); el.style.setProperty("--badge-ink", "${INK}"); })()`)
  }
  const result = JSON.parse((await page.evaluate(READ)) as string) as Look
  await page.close()
  return result
}

beforeAll(async () => {
  await launch() // chromium or esbuild not installed — tests self-skip below
}, 60_000)

afterAll(close)

describe("VI-661 — Badge ground and ink tokens (real browser)", () => {
  it("covers all 13 variants", () => {
    expect(VARIANTS).toHaveLength(13)
  })

  for (const density of DENSITIES) {
    describe(`${density} density`, () => {
      for (const variant of VARIANTS) {
        it(`${variant}: unset renders as shipped; set on an ancestor or the badge, the tokens win`, async (ctx) => {
          if (!ready()) return ctx.skip()
          const live = (await bundle("badge", variant)).css
          const shipped = await look(variant, density, { componentCss: unwrap(live) })

          expect(await look(variant, density), "unset must equal the shipped render").toEqual(shipped)
          for (const set of ["ancestor", "self"] as const) {
            expect(await look(variant, density, { set }), `set on ${set}`).toEqual({ bg: BG, ink: INK, border: shipped.border })
          }
        }, 30_000)
      }
    })
  }

  // Mutation control: without its fallbacks, every variant's unset render
  // moves off the shipped one — so the unset assertion above can fail.
  for (const variant of VARIANTS) {
    it(`${variant}: mutation control — dropping the fallbacks breaks the unset render`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const live = (await bundle("badge", variant)).css
      const mutated = stripFallbacks(live)
      expect(mutated).not.toBe(live)
      const shipped = await look(variant, "standard", { componentCss: unwrap(live) })
      expect(await look(variant, "standard", { componentCss: mutated })).not.toEqual(shipped)
    }, 30_000)
  }
})
