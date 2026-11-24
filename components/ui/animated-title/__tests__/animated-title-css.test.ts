// @vitest-environment node
/** VI-815 — AnimatedTitle's CSS contract: the kit's keyframes and timings, reduced motion, and no motion library. */
import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const DIR = resolve(process.cwd(), "components/ui/animated-title")
const css = readFileSync(join(DIR, "animated-title.module.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")

/** The declarations of the first rule whose whole selector is `selector` (not one of a list). */
function rule(selector: string, source = css): string {
  let at = -1
  for (let i = source.indexOf(`${selector} {`); i >= 0; i = source.indexOf(`${selector} {`, i + 1)) {
    const before = source.slice(0, i).trimEnd()
    if (before === "" || /[}{]$/.test(before)) {
      at = i
      break
    }
  }
  expect(at, `rule ${selector}`).toBeGreaterThanOrEqual(0)
  return source.slice(at, source.indexOf("}", at))
}

/** A keyframes block, from its name to its closing brace. */
function keyframes(name: string): string {
  const at = css.indexOf(`@keyframes ${name} {`)
  expect(at, `@keyframes ${name}`).toBeGreaterThanOrEqual(0)
  return css.slice(at, css.indexOf("\n}", at))
}

describe("AnimatedTitle CSS", () => {
  it("draws the kit's three keyframes", () => {
    expect(keyframes("animatedTitleRise")).toMatch(/from \{\s*transform: translateY\(112%\);\s*\}\s*to \{\s*transform: none;/)
    expect(keyframes("animatedTitleBlur")).toMatch(
      /from \{\s*opacity: 0;\s*transform: translateY\(6px\);\s*filter: blur\(14px\);\s*\}\s*to \{\s*opacity: 1;\s*transform: none;\s*filter: none;/,
    )
    expect(keyframes("animatedTitleWeight")).toMatch(/from \{\s*opacity: 0;\s*font-weight: 300;\s*\}\s*to \{\s*opacity: 1;\s*font-weight: 520;/)
  })

  it("defaults each animation to the kit's duration and stagger", () => {
    const expected = { rise: ["1.05s", "55ms", "Rise"], blur: ["1.1s", "60ms", "Blur"], weight: ["1.3s", "50ms", "Weight"] }
    for (const [cls, [duration, stagger, name]] of Object.entries(expected)) {
      const r = rule(`.${cls} .wordInner`)
      expect(r).toContain(`animation-name: animatedTitle${name};`)
      expect(r).toContain(`animation-duration: var(--animated-title-duration, ${duration});`)
      expect(r).toContain(`--animated-title-default-stagger: ${stagger};`)
    }
    expect(rule(".weight .wordInner")).toContain("font-weight: 520;")
  })

  it("starts word i at delay + i × stagger, on the theme's enter curve, holding its first frame", () => {
    const r = rule(".wordInner")
    expect(r).toContain(
      "animation-delay: calc(var(--animated-title-delay, 0ms) + var(--i, 0) * var(--animated-title-stagger, var(--animated-title-default-stagger)));",
    )
    expect(r).toMatch(/animation-timing-function: var\(--motion-easing-enter\b/)
    expect(r).toContain("animation-fill-mode: backwards;")
    // The only cubic-bezier is the token's fallback.
    expect(css.match(/cubic-bezier/g)).toHaveLength(1)
  })

  it("pauses the words when held", () => {
    expect(rule('.root[data-play="false"] .wordInner')).toContain("animation-play-state: paused;")
  })

  it("turns every animation off under reduced motion, at the per-animation rules' specificity", () => {
    const at = css.indexOf("@media (prefers-reduced-motion: reduce)")
    expect(at).toBeGreaterThan(css.indexOf(".weight .wordInner {"))
    expect(rule(".root .wordInner", css.slice(at))).toContain("animation: none;")
  })

  it("gives each word 0.2em of ink room that layout cancels", () => {
    expect(rule(".root")).toContain("--animated-title-ink-room: 0.2em;")
    for (const sel of [".wordMask", ".wordInner"]) {
      const r = rule(sel)
      expect(r).toContain("padding-block: var(--animated-title-ink-room);")
      expect(r).toContain("margin-block: calc(-1 * var(--animated-title-ink-room));")
    }
    expect(rule(".wordMask")).toContain("overflow: hidden;")
  })
})

describe("AnimatedTitle has no motion dependency", () => {
  it("imports no animation library", () => {
    for (const file of readdirSync(DIR).filter((f) => /\.(tsx?|css)$/.test(f))) {
      const src = readFileSync(join(DIR, file), "utf8")
      expect(src, file).not.toMatch(/from ["'](motion|framer-motion)(\/|["'])/)
    }
  })

  it("no workspace package.json lists motion or framer-motion", () => {
    const root = process.cwd()
    const manifests = [join(root, "package.json")]
    for (const dir of readdirSync(join(root, "packages"))) manifests.push(join(root, "packages", dir, "package.json"))
    for (const file of manifests) {
      let pkg: Record<string, Record<string, string> | undefined>
      try {
        pkg = JSON.parse(readFileSync(file, "utf8"))
      } catch {
        continue
      }
      for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
        expect(Object.keys(pkg[field] ?? {}), `${file} ${field}`).not.toEqual(
          expect.arrayContaining([expect.stringMatching(/^(motion|framer-motion)$/)]),
        )
      }
    }
  })
})
