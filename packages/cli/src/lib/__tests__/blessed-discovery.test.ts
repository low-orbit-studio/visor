import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  discoverBlessedBuilds,
  resolveBlessedBuild,
  MISSING_MANIFEST_REASON,
} from "../blessed-discovery.js"

let baseDir: string
let blessedRoot: string

function manifestJson(shape: string, pattern: string): string {
  return JSON.stringify({
    shape,
    pattern,
    base_theme: "reference-app",
    requires_visor: ">=1.14.0",
    captures_baseline: "captures/approved/",
    three_gates_status: "passing",
  })
}

/**
 * Build a pattern directory in the real Playbook layout:
 * `<root>/<shape>/pattern-builds/<pattern>/{reference-build,captures/approved}`.
 * `blessed` writes the manifest into `reference-build/`; without it the pattern
 * dir is a near-miss.
 */
function makePatternDir(
  shape: string,
  pattern: string,
  opts: { blessed?: boolean; captures?: boolean; referenceBuild?: boolean } = {}
): string {
  const { blessed = true, captures = true, referenceBuild = true } = opts
  const patternDir = join(blessedRoot, shape, "pattern-builds", pattern)
  mkdirSync(patternDir, { recursive: true })
  if (referenceBuild) {
    const buildDir = join(patternDir, "reference-build", "app")
    mkdirSync(buildDir, { recursive: true })
    writeFileSync(join(buildDir, "page.tsx"), "export default function Page() { return null }\n")
    if (blessed) {
      writeFileSync(
        join(patternDir, "reference-build", "blessed-manifest.json"),
        manifestJson(shape, pattern)
      )
    }
  }
  if (captures) {
    mkdirSync(join(patternDir, "captures", "approved"), { recursive: true })
    writeFileSync(join(patternDir, "captures", "approved", "shell.png"), "")
  }
  return patternDir
}

beforeEach(() => {
  baseDir = join(
    tmpdir(),
    `visor-blessed-discovery-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  blessedRoot = join(baseDir, "design-prototypes")
  mkdirSync(blessedRoot, { recursive: true })
})

afterEach(() => {
  rmSync(baseDir, { recursive: true, force: true })
})

describe("discoverBlessedBuilds near-miss reporting (VI-626)", () => {
  it("classifies the three discovery states: blessed, near-miss, unrelated", () => {
    makePatternDir("admin-ui", "organization-management", { blessed: true })
    const nearMiss = makePatternDir("admin-ui", "user-management", { blessed: false })
    // Unrelated: neither a manifest nor the reference-build + approved-captures pair.
    const unrelated = join(blessedRoot, "admin-ui", "audits", "R3")
    mkdirSync(unrelated, { recursive: true })
    writeFileSync(join(unrelated, "notes.md"), "# notes\n")

    const { builds, incomplete, errors } = discoverBlessedBuilds(blessedRoot)

    expect(errors).toEqual([])
    expect(builds.map((b) => b.manifest.pattern)).toEqual(["organization-management"])
    expect(incomplete).toEqual([{ dir: nearMiss, reason: MISSING_MANIFEST_REASON }])
    expect(incomplete.map((i) => i.dir)).not.toContain(unrelated)
  })

  it("reports the reason as `missing blessed-manifest.json`", () => {
    makePatternDir("admin-ui", "events-management", { blessed: false })
    const { incomplete } = discoverBlessedBuilds(blessedRoot)
    expect(incomplete).toHaveLength(1)
    expect(incomplete[0].reason).toBe("missing blessed-manifest.json")
  })

  it("does not treat a near-miss as a build (D2 — no synthesized blessing)", () => {
    makePatternDir("admin-ui", "user-management", { blessed: false })
    const { builds, incomplete } = discoverBlessedBuilds(blessedRoot)
    expect(builds).toHaveLength(0)
    expect(incomplete).toHaveLength(1)
  })

  it("keeps a near-miss out of resolveBlessedBuild's available list, so --from still fails", () => {
    makePatternDir("admin-ui", "organization-management", { blessed: true })
    makePatternDir("admin-ui", "user-management", { blessed: false })

    const { build, available } = resolveBlessedBuild(
      blessedRoot,
      "admin-ui",
      "user-management"
    )

    expect(build).toBeUndefined()
    expect(available.map((b) => b.manifest.pattern)).toEqual(["organization-management"])
  })

  it("requires BOTH reference-build/ and captures/approved/ to call a dir a near-miss", () => {
    makePatternDir("admin-ui", "no-captures", { blessed: false, captures: false })
    makePatternDir("admin-ui", "no-build", { blessed: false, referenceBuild: false })

    const { builds, incomplete, errors } = discoverBlessedBuilds(blessedRoot)

    expect(builds).toHaveLength(0)
    expect(incomplete).toEqual([])
    expect(errors).toEqual([])
  })

  it("does not flag a blessed pattern dir as a near-miss", () => {
    makePatternDir("admin-ui", "dashboard", { blessed: true })
    makePatternDir("admin-ui", "settings", { blessed: true })

    const { builds, incomplete } = discoverBlessedBuilds(blessedRoot)

    expect(builds.map((b) => b.manifest.pattern).sort()).toEqual(["dashboard", "settings"])
    expect(incomplete).toEqual([])
  })

  it("reports near-misses sorted by directory alongside blessed builds", () => {
    makePatternDir("admin-ui", "user-management", { blessed: false })
    makePatternDir("admin-ui", "events-management", { blessed: false })
    makePatternDir("admin-ui", "monetization", { blessed: true })

    const { builds, incomplete } = discoverBlessedBuilds(blessedRoot)

    expect(builds).toHaveLength(1)
    expect(incomplete.map((i) => i.dir)).toEqual([...incomplete.map((i) => i.dir)].sort())
    expect(incomplete).toHaveLength(2)
  })

  it("returns an empty incomplete list for a missing blessed dir", () => {
    const { builds, incomplete, errors } = discoverBlessedBuilds(join(baseDir, "nope"))
    expect(builds).toEqual([])
    expect(incomplete).toEqual([])
    expect(errors).toEqual([])
  })

  it("a malformed manifest still lands in errors[], not incomplete[]", () => {
    const patternDir = makePatternDir("admin-ui", "broken", { blessed: false })
    writeFileSync(join(patternDir, "reference-build", "blessed-manifest.json"), "{ not json")

    const { builds, incomplete, errors } = discoverBlessedBuilds(blessedRoot)

    expect(builds).toHaveLength(0)
    expect(incomplete).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].error).toMatch(/invalid JSON/)
  })
})
