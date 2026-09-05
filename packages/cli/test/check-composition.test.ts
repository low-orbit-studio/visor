/**
 * VI-631 — the composition lint.
 *
 * Covers the three assertions `visor check design` / `visor check diff` were
 * missing: AST-based inline `style={{}}` detection, the camelCase blind spot in
 * `hardcoded-px`, and a local re-declaration of a kit element — plus the D2
 * scope statement and the D7 fail-closed kit-membership resolution.
 */
import { describe, it, expect } from "vitest"
import { join } from "path"
import { mkdirSync, writeFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import {
  scanDesign,
  compositionScopeNotice,
  COMPOSITION_SCOPE,
  RULES,
} from "../src/check/design.js"
import { resolveTaxonomy, parseTaxonomy, slugToIdentifier } from "../src/check/taxonomy.js"

const FIXTURES = join(import.meta.dirname, "fixtures/design")
const TAXONOMY = join(import.meta.dirname, "fixtures/taxonomy/taxonomy.json")

function scan(fixture: string, options?: Parameters<typeof scanDesign>[1]) {
  return scanDesign(join(FIXTURES, fixture), options)
}

function rule(result: ReturnType<typeof scanDesign>, name: string) {
  return [...result.errors, ...result.warnings].filter(f => f.rule === name)
}

function tmp(prefix: string): string {
  const dir = join(tmpdir(), `visor-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

// ─── Rule registry ────────────────────────────────────────────────────────────

describe("composition rules are registered warning-only (D3)", () => {
  for (const name of ["inline-style-object", "kit-element-redeclared"]) {
    it(`${name} is registered at warn severity`, () => {
      expect(RULES.find(r => r.name === name)?.severity).toBe("warn")
    })
  }
})

// ─── inline-style-object (D4) ─────────────────────────────────────────────────

describe("rule: inline-style-object", () => {
  it("flags every inline style object literal in the fixture", () => {
    const findings = rule(scan("inline-style-bad"), "inline-style-object")
    expect(findings).toHaveLength(3)
  })

  it("reports at warn severity so first adoption is not a wall of red", () => {
    const findings = rule(scan("inline-style-bad"), "inline-style-object")
    expect(findings.every(f => f.severity === "warn")).toBe(true)
  })

  it("names the offending declarations in the message", () => {
    const findings = rule(scan("inline-style-bad"), "inline-style-object")
    expect(findings.some(f => f.message.includes('"padding"'))).toBe(true)
    expect(findings.some(f => f.message.includes('"color"'))).toBe(true)
    expect(findings.some(f => f.message.includes('"width"'))).toBe(true)
  })

  it("does NOT flag style={styles.foo} (no false positive)", () => {
    expect(rule(scan("inline-style-ok"), "inline-style-object")).toHaveLength(0)
  })

  it("does NOT flag a CSS-variable bridge, a spread, or a computed key", () => {
    // All three live in inline-style-ok alongside style={styles.section}.
    const result = scan("inline-style-ok")
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it("is AST-based: a `style={{...}}` inside a string or comment is not flagged", () => {
    const dir = tmp("inline-str")
    writeFileSync(
      join(dir, "c.tsx"),
      [
        "// example: style={{ padding: 8 }}",
        'const doc = "style={{ padding: 8 }}"',
        "export function Ok() { return <div data-doc={doc} /> }",
      ].join("\n")
    )
    try {
      expect(rule(scanDesign(dir), "inline-style-object")).toHaveLength(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("flags an inline style on a Visor component, not just a native tag", () => {
    const dir = tmp("inline-visor")
    writeFileSync(
      join(dir, "c.tsx"),
      'export function P() { return <Card style={{ marginBlock: 4 }} /> }\n'
    )
    try {
      expect(rule(scanDesign(dir), "inline-style-object")).toHaveLength(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

// ─── hardcoded-px camelCase blind spot (D5) ───────────────────────────────────

describe("rule: hardcoded-px — camelCase coverage", () => {
  const CAMEL_PROPS = ["fontSize", "lineHeight", "borderRadius", "minWidth", "maxHeight"]
  const VALUES: Record<string, string> = {
    fontSize: "13px",
    lineHeight: "20px",
    borderRadius: "6px",
    minWidth: "120px",
    maxHeight: "480px",
  }

  for (const prop of CAMEL_PROPS) {
    it(`catches ${prop} with a px value (was silently skipped)`, () => {
      const dir = tmp(`px-${prop}`)
      writeFileSync(join(dir, "c.tsx"), `const s = { ${prop}: "${VALUES[prop]}" }\n`)
      try {
        const findings = rule(scanDesign(dir), "hardcoded-px")
        expect(findings).toHaveLength(1)
        expect(findings[0].message).toContain(VALUES[prop])
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })
  }

  it("reports newly-covered spellings at warn severity (D3 adoption ramp)", () => {
    const findings = rule(scan("camelcase-px-bad"), "hardcoded-px")
    const camel = findings.filter(f => f.line <= 8)
    expect(camel).toHaveLength(5)
    expect(camel.every(f => f.severity === "warn")).toBe(true)
    expect(camel[0].message).toContain("previously skipped")
  })

  it("marginTop / paddingLeft still flag — the fix does not regress accidental coverage", () => {
    const findings = rule(scan("camelcase-px-bad"), "hardcoded-px")
    const legacy = findings.filter(f => f.line === 10)
    expect(legacy).toHaveLength(2)
    expect(legacy.every(f => f.severity === "error")).toBe(true)
  })

  it("matches on a normalized name, so kebab-case keeps firing as an error", () => {
    const dir = tmp("px-kebab")
    writeFileSync(join(dir, "s.css"), ".a { font-size: 13px; }\n")
    try {
      const findings = rule(scanDesign(dir), "hardcoded-px")
      expect(findings).toHaveLength(1)
      expect(findings[0].severity).toBe("error")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("covers border-radius in CSS, which the legacy filter never matched", () => {
    const dir = tmp("px-radius")
    writeFileSync(join(dir, "s.css"), ".a { border-radius: 6px; }\n")
    try {
      const findings = rule(scanDesign(dir), "hardcoded-px")
      expect(findings).toHaveLength(1)
      expect(findings[0].severity).toBe("warn")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("--errors-only drops the newly-covered warnings", () => {
    const result = scan("camelcase-px-bad", { errorsOnly: true })
    const findings = rule(result, "hardcoded-px")
    expect(findings).toHaveLength(2)
    expect(findings.every(f => f.severity === "error")).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })
})

// ─── kit-element-redeclared (D7) ──────────────────────────────────────────────

describe("rule: kit-element-redeclared", () => {
  it("flags a local function and a local arrow that shadow kit elements", () => {
    const findings = rule(scan("kit-redeclared-bad", { taxonomyPath: TAXONOMY }), "kit-element-redeclared")
    expect(findings.map(f => f.line)).toEqual([5, 9])
    expect(findings.every(f => f.severity === "warn")).toBe(true)
    expect(findings[0].message).toContain("StatCard")
    expect(findings[0].fix).toContain("npx visor add stat-card")
  })

  it("does NOT flag a component that is not a kit element", () => {
    const findings = rule(scan("kit-redeclared-bad", { taxonomyPath: TAXONOMY }), "kit-element-redeclared")
    expect(findings.some(f => f.message.includes("DashboardGrid"))).toBe(false)
  })

  it("does NOT flag a PascalCase const that is not component-shaped", () => {
    const findings = rule(scan("kit-redeclared-bad", { taxonomyPath: TAXONOMY }), "kit-element-redeclared")
    expect(findings.some(f => f.message.includes('"Button"'))).toBe(false)
  })

  it("does NOT flag the project's own copy-and-own kit source file", () => {
    const dir = tmp("kit-owned")
    mkdirSync(join(dir, "components", "ui", "card"), { recursive: true })
    writeFileSync(
      join(dir, "components", "ui", "card", "card.tsx"),
      "export function Card({ children }) { return <div>{children}</div> }\n"
    )
    try {
      expect(rule(scanDesign(dir, { taxonomyPath: TAXONOMY }), "kit-element-redeclared")).toHaveLength(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("does not run when no taxonomy resolves — membership is asserted, never guessed", () => {
    const result = scan("kit-redeclared-bad")
    expect(rule(result, "kit-element-redeclared")).toHaveLength(0)
    expect(result.composition.kitMembership.asserted).toBe(false)
  })
})

// ─── Taxonomy resolution + fail-closed (D7) ───────────────────────────────────

describe("kit taxonomy resolution", () => {
  it("parses component and block refs, skipping token and unbound rows", () => {
    const res = resolveTaxonomy({ explicitPath: TAXONOMY, scanPath: FIXTURES, env: {} })
    expect(res.taxonomy).not.toBeNull()
    expect([...res.taxonomy!.slugs].sort()).toEqual([
      "admin-shell",
      "button",
      "card",
      "page-header",
      "stat-card",
    ])
    expect(res.taxonomy!.slugs.has("divider")).toBe(false)
    expect(res.taxonomy!.slugs.has("sparkline")).toBe(false)
  })

  it("derives PascalCase identifiers from element slugs", () => {
    expect(slugToIdentifier("stat-card")).toBe("StatCard")
    expect(slugToIdentifier("blocks/admin-shell")).toBe("AdminShell")
    expect(slugToIdentifier("button")).toBe("Button")
  })

  it("resolves from the VISOR_TAXONOMY environment variable", () => {
    const res = resolveTaxonomy({
      scanPath: FIXTURES,
      env: { VISOR_TAXONOMY: TAXONOMY },
    })
    expect(res.source).toBe("env")
    expect(res.taxonomy?.slugs.size).toBe(5)
  })

  it("resolves a .visorrc.json taxonomy path relative to the scanned directory", () => {
    const result = scan("kit-redeclared-bad", {
      visorrcTaxonomyPath: "../../taxonomy/taxonomy.json",
      env: {},
    })
    expect(result.composition.kitMembership.asserted).toBe(true)
    expect(result.composition.kitMembership.source).toBe("visorrc")
  })

  it("discovers a taxonomy.json alongside the scanned surface", () => {
    const dir = tmp("kit-discover")
    writeFileSync(join(dir, "taxonomy.json"), JSON.stringify({
      tiers: [{ families: [{ rows: [{ visor: { entries: [{ ref: "card", kind: "component" }] } }] }] }],
    }))
    writeFileSync(join(dir, "c.tsx"), "export function Card() { return null }\n")
    try {
      const result = scanDesign(dir, { env: {} })
      expect(result.composition.kitMembership.source).toBe("discovered")
      expect(rule(result, "kit-element-redeclared")).toHaveLength(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("fails closed when an explicitly requested taxonomy.json is absent", () => {
    const result = scan("clean", { taxonomyPath: "/nonexistent/taxonomy.json", env: {} })
    const findings = result.errors.filter(f => f.rule === "kit-taxonomy-missing")
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe("error")
    expect(findings[0].message).toContain("/nonexistent/taxonomy.json")
    expect(result.composition.kitMembership.asserted).toBe(false)
  })

  it("fails closed when --composition is requested and nothing resolves", () => {
    const result = scan("clean", { composition: true, env: {} })
    const findings = result.errors.filter(f => f.rule === "kit-taxonomy-missing")
    expect(findings).toHaveLength(1)
    expect(findings[0].message).toContain("fails closed")
  })

  it("fails closed on a malformed taxonomy.json", () => {
    const dir = tmp("kit-malformed")
    writeFileSync(join(dir, "taxonomy.json"), "{ not json")
    writeFileSync(join(dir, "c.tsx"), "export function P() { return null }\n")
    try {
      const result = scanDesign(dir, { env: {} })
      expect(result.errors.filter(f => f.rule === "kit-taxonomy-missing")).toHaveLength(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects a JSON file that is not a kit taxonomy", () => {
    expect(() => parseTaxonomy({ hello: "world" }, "/x.json")).toThrow(/no "tiers" array/)
  })

  it("does NOT fail closed when nothing was configured or discovered", () => {
    // Reporting "not asserted" out loud is the honest signal; a finding here
    // would fire on every legacy `check design` invocation.
    const result = scan("clean", { env: {} })
    expect(result.errors).toHaveLength(0)
    expect(result.composition.kitMembership.asserted).toBe(false)
    expect(result.composition.kitMembership.reason).toContain("--taxonomy")
  })

  it("honours .visorrc.json disabledRules for kit-taxonomy-missing", () => {
    const result = scan("clean", {
      composition: true,
      env: {},
      disabledRules: ["kit-taxonomy-missing"],
    })
    expect(result.errors).toHaveLength(0)
  })
})

// ─── The composition-only limit, stated in the tool's own output (D2) ─────────

describe("composition scope statement (D2)", () => {
  it("every scan result carries the composition-only scope", () => {
    const result = scan("clean", { env: {} })
    expect(result.composition.scope).toBe("composition-only")
  })

  it("states what a green does assert", () => {
    const result = scan("clean", { env: {} })
    expect(result.composition.asserts).toBe("this surface introduced no styling outside the kit")
  })

  it("states, in its own words, that green is NOT a claim about arrangement", () => {
    const result = scan("clean", { env: {} })
    expect(result.composition.limit).toContain("does NOT mean the surface is on-design")
    expect(result.composition.limit).toContain("Arrangement")
  })

  it("names arrangement, content and data as the uncovered residue", () => {
    const result = scan("clean", { env: {} })
    const residue = result.composition.doesNotAssert.join(" ")
    expect(residue).toContain("arrangement")
    expect(residue).toContain("content")
    expect(residue).toContain("data")
  })

  it("renders the same limit as human output lines for both checkers", () => {
    const notice = compositionScopeNotice().join("\n")
    expect(notice).toContain(COMPOSITION_SCOPE.asserts)
    expect(notice).toContain("It does NOT assert the surface is on-design")
    for (const residue of COMPOSITION_SCOPE.doesNotAssert) {
      expect(notice).toContain(residue)
    }
  })

  it("reports how kit membership was resolved, so a green is traceable", () => {
    const result = scan("composition-blessed", { taxonomyPath: TAXONOMY, env: {} })
    expect(result.composition.kitMembership).toMatchObject({
      asserted: true,
      source: "flag",
      elementCount: 5,
    })
    expect(result.composition.kitMembership.taxonomyPath).toContain("taxonomy.json")
  })
})

// ─── Blessed build + seeded violations (D6) ───────────────────────────────────

describe("blessed pattern build", () => {
  it("exits clean — a checker that fails its own reference is wrong", () => {
    const result = scan("composition-blessed", { taxonomyPath: TAXONOMY, composition: true, env: {} })
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })
})

describe("seeded violations", () => {
  const result = () => scan("composition-seeded", { taxonomyPath: TAXONOMY, env: {} })

  it("catches the inline style object", () => {
    expect(rule(result(), "inline-style-object")).toHaveLength(1)
  })

  it("catches the raw hex", () => {
    expect(rule(result(), "hardcoded-hex")).toHaveLength(1)
  })

  it("catches the local re-declaration of a kit element", () => {
    const findings = rule(result(), "kit-element-redeclared")
    expect(findings).toHaveLength(1)
    expect(findings[0].message).toContain("StatCard")
  })
})

// ─── No behaviour drift on the pre-existing fixtures ──────────────────────────

describe("existing fixtures produce unchanged output", () => {
  // Error counts captured from the pre-VI-631 checker. The camelCase fix is a
  // strict superset gated on the legacy filter for severity, so no pre-existing
  // finding may change rule, line or severity.
  const BASELINE_ERRORS: Record<string, number> = {
    "banned-fonts-bad": 0,
    "base-layer-missing": 1,
    "base-layer-preflight": 1,
    "base-layer-reset": 1,
    "bounce-easing-bad": 0,
    clean: 0,
    "div-as-input-bad": 1,
    "excessive-card-nesting-bad": 0,
    "gradient-text-bad": 0,
    "hardcoded-hex-bad": 2,
    "hardcoded-px-bad": 2,
    "line-length-over-75ch-bad": 0,
    "missing-aria-pressed-bad": 1,
    "missing-dark-mode-block-bad": 1,
    "missing-hover-transition-bad": 1,
    "pure-black-untinted-bad": 2,
    "purple-gradient-on-white-bad": 0,
    "setstate-hover-bad": 3,
    "sub-44px-touch-target-bad": 2,
    "tier-1-token-direct-usage-bad": 1,
  }

  for (const [fixture, expected] of Object.entries(BASELINE_ERRORS)) {
    it(`${fixture} reports ${expected} error(s), unchanged`, () => {
      expect(scan(fixture, { env: {} }).errors).toHaveLength(expected)
    })
  }

  it("no pre-existing fixture engages the kit-membership assertion", () => {
    for (const fixture of Object.keys(BASELINE_ERRORS)) {
      expect(scan(fixture, { env: {} }).composition.kitMembership.asserted).toBe(false)
    }
  })
})
