import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  computeDrift,
  formatReport,
  parseArgs,
  detectStaleRegistry,
  hashedStem,
  computePackageDrift,
  formatPackageReport,
  PACKAGE_ARTIFACTS,
} from "../visor-publish-smoke.mjs"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

const item = (name, files) => ({
  name,
  type: "registry:ui",
  files: files.map(([path, content]) => ({
    path,
    type: "registry:ui",
    content,
  })),
})

describe("computeDrift", () => {
  it("returns no drift when local and published match exactly", () => {
    const local = {
      items: [item("heading", [["components/ui/heading/heading.tsx", "A"]])],
    }
    const published = JSON.parse(JSON.stringify(local))
    expect(computeDrift(local, published)).toEqual({
      drifts: [],
      warnings: [],
    })
  })

  it("flags content drift for a single file", () => {
    const local = {
      items: [item("heading", [["components/ui/heading/heading.tsx", "NEW"]])],
    }
    const published = {
      items: [item("heading", [["components/ui/heading/heading.tsx", "OLD"]])],
    }
    const result = computeDrift(local, published)
    expect(result.drifts).toEqual([
      {
        name: "heading",
        kind: "content",
        files: ["components/ui/heading/heading.tsx"],
      },
    ])
    expect(result.warnings).toEqual([])
  })

  it("flags items present in source but missing from published", () => {
    const local = {
      items: [
        item("heading", [["components/ui/heading/heading.tsx", "A"]]),
        item("brand-new", [["components/ui/brand-new/brand-new.tsx", "B"]]),
      ],
    }
    const published = {
      items: [item("heading", [["components/ui/heading/heading.tsx", "A"]])],
    }
    const result = computeDrift(local, published)
    expect(result.drifts).toEqual([
      {
        name: "brand-new",
        kind: "missing-in-published",
        files: ["components/ui/brand-new/brand-new.tsx"],
      },
    ])
    expect(result.warnings).toEqual([])
  })

  it("warns (does not fail) when published has items absent from source", () => {
    const local = {
      items: [item("heading", [["components/ui/heading/heading.tsx", "A"]])],
    }
    const published = {
      items: [
        item("heading", [["components/ui/heading/heading.tsx", "A"]]),
        item("removed", [["components/ui/removed/removed.tsx", "X"]]),
      ],
    }
    const result = computeDrift(local, published)
    expect(result.drifts).toEqual([])
    expect(result.warnings).toEqual([
      {
        name: "removed",
        kind: "removed-in-source",
        files: ["components/ui/removed/removed.tsx"],
      },
    ])
  })

  it("flags missing files within a matched item as content drift", () => {
    // Source added a new file to the item; published hasn't picked it up.
    const local = {
      items: [
        item("stat-card", [
          ["components/ui/stat-card/stat-card.tsx", "A"],
          ["components/ui/stat-card/stat-card.module.css", "B"],
        ]),
      ],
    }
    const published = {
      items: [
        item("stat-card", [["components/ui/stat-card/stat-card.tsx", "A"]]),
      ],
    }
    const result = computeDrift(local, published)
    expect(result.drifts).toEqual([
      {
        name: "stat-card",
        kind: "content",
        files: ["components/ui/stat-card/stat-card.module.css"],
      },
    ])
  })

  it("sorts drifts and warnings alphabetically for stable output", () => {
    const local = {
      items: [
        item("zebra", [["z.tsx", "NEW"]]),
        item("alpha", [["a.tsx", "NEW"]]),
      ],
    }
    const published = {
      items: [
        item("zebra", [["z.tsx", "OLD"]]),
        item("alpha", [["a.tsx", "OLD"]]),
      ],
    }
    const result = computeDrift(local, published)
    expect(result.drifts.map((d) => d.name)).toEqual(["alpha", "zebra"])
  })

  it("aggregates drift across multiple items", () => {
    const local = {
      items: [
        item("a", [["a.tsx", "NEW"]]),
        item("b", [["b.tsx", "NEW"]]),
        item("c", [["c.tsx", "SAME"]]),
      ],
    }
    const published = {
      items: [
        item("a", [["a.tsx", "OLD"]]),
        item("b", [["b.tsx", "OLD"]]),
        item("c", [["c.tsx", "SAME"]]),
      ],
    }
    const result = computeDrift(local, published)
    expect(result.drifts).toHaveLength(2)
    expect(result.drifts.map((d) => d.name)).toEqual(["a", "b"])
  })
})

describe("formatReport", () => {
  it("emits a success line when no drift", () => {
    const out = formatReport({
      drifts: [],
      warnings: [],
      publishedVersion: "0.10.0",
      localItemCount: 172,
    })
    expect(out).toContain("No publish drift")
    expect(out).toContain("172 primitives")
    expect(out).toContain("0.10.0")
  })

  it("lists drifted primitives and their files", () => {
    const out = formatReport({
      drifts: [
        {
          name: "stat-card",
          kind: "content",
          files: ["components/ui/stat-card/stat-card.tsx"],
        },
      ],
      warnings: [],
      publishedVersion: "0.10.0",
      localItemCount: 172,
    })
    expect(out).toContain("Publish drift detected")
    expect(out).toContain("stat-card — content drift")
    expect(out).toContain("components/ui/stat-card/stat-card.tsx")
    expect(out).toContain("cut a new @loworbitstudio/visor release")
  })

  it("differentiates missing-in-published from content drift", () => {
    const out = formatReport({
      drifts: [
        {
          name: "brand-new",
          kind: "missing-in-published",
          files: ["components/ui/brand-new/brand-new.tsx"],
        },
      ],
      warnings: [],
      publishedVersion: "0.10.0",
      localItemCount: 172,
    })
    expect(out).toContain("missing from published registry")
  })

  it("appends warnings section when items removed from source", () => {
    const out = formatReport({
      drifts: [],
      warnings: [
        {
          name: "old-thing",
          kind: "removed-in-source",
          files: ["components/ui/old-thing/old-thing.tsx"],
        },
      ],
      publishedVersion: "0.10.0",
      localItemCount: 172,
    })
    expect(out).toContain("No publish drift")
    expect(out).toContain("1 primitive present in published registry but not in source")
    expect(out).toContain("old-thing")
  })
})

describe("parseArgs", () => {
  it("returns defaults for empty argv", () => {
    expect(parseArgs([])).toEqual({
      json: false,
      version: null,
      localTarballDir: null,
      help: false,
      skipStalenessCheck: false,
    })
  })

  it("parses --json", () => {
    expect(parseArgs(["--json"]).json).toBe(true)
  })

  it("parses --version with a value", () => {
    expect(parseArgs(["--version", "0.9.0"]).version).toBe("0.9.0")
  })

  it("parses --local with a path", () => {
    expect(parseArgs(["--local", "/tmp/pkg"]).localTarballDir).toBe("/tmp/pkg")
  })

  it("parses --skip-staleness-check", () => {
    expect(parseArgs(["--skip-staleness-check"]).skipStalenessCheck).toBe(true)
  })

  it("parses -h and --help", () => {
    expect(parseArgs(["--help"]).help).toBe(true)
    expect(parseArgs(["-h"]).help).toBe(true)
  })

  it("throws on unknown args", () => {
    expect(() => parseArgs(["--nope"])).toThrow(/Unknown argument: --nope/)
  })
})

describe("detectStaleRegistry", () => {
  it("is fresh when no source files exist", () => {
    expect(detectStaleRegistry(1000, [])).toEqual({
      stale: false,
      newerFile: null,
      newerMtimeMs: null,
    })
  })

  it("is fresh when every source file is older than the registry", () => {
    const result = detectStaleRegistry(1000, [
      { path: "a.tsx", mtimeMs: 900 },
      { path: "b.tsx", mtimeMs: 999 },
    ])
    expect(result).toEqual({ stale: false, newerFile: null, newerMtimeMs: null })
  })

  it("is fresh when source files match the registry mtime exactly (tie favors fresh)", () => {
    // Build that completed in the same millisecond as a source touch is
    // indistinguishable from a build that happened after — don't false-flag.
    const result = detectStaleRegistry(1000, [
      { path: "a.tsx", mtimeMs: 1000 },
    ])
    expect(result.stale).toBe(false)
  })

  it("flags stale when any single source file is newer", () => {
    const result = detectStaleRegistry(1000, [
      { path: "a.tsx", mtimeMs: 900 },
      { path: "b.tsx", mtimeMs: 2000 },
      { path: "c.tsx", mtimeMs: 1500 },
    ])
    expect(result.stale).toBe(true)
    expect(result.newerFile).toBe("b.tsx")
    expect(result.newerMtimeMs).toBe(2000)
  })

  it("reports the newest source file (not the first newer one) when multiple are newer", () => {
    const result = detectStaleRegistry(1000, [
      { path: "older-but-newer.tsx", mtimeMs: 1100 },
      { path: "newest.tsx", mtimeMs: 5000 },
      { path: "middle.tsx", mtimeMs: 3000 },
    ])
    expect(result.newerFile).toBe("newest.tsx")
    expect(result.newerMtimeMs).toBe(5000)
  })
})

describe("PACKAGE_ARTIFACTS", () => {
  // A package added to the workspace and published without a smoke entry is
  // exactly the zero-coverage hole VI-646 fell through.
  it("covers every publishable workspace package", () => {
    const published = readdirSync(path.join(REPO_ROOT, "packages"))
      .map((dir) => path.join(REPO_ROOT, "packages", dir, "package.json"))
      .filter((p) => existsSync(p))
      .map((p) => JSON.parse(readFileSync(p, "utf8")))
      .filter((pkg) => !pkg.private)
      .map((pkg) => pkg.name)
      .sort()
    const covered = ["@loworbitstudio/visor", ...PACKAGE_ARTIFACTS.map((p) => p.name)].sort()
    expect(covered).toEqual(published)
  })

  it("points each entry at the workspace dir that publishes that name", () => {
    for (const pkg of PACKAGE_ARTIFACTS) {
      const manifest = JSON.parse(
        readFileSync(path.join(REPO_ROOT, pkg.dir, "package.json"), "utf8"),
      )
      expect(manifest.name).toBe(pkg.name)
      expect(manifest.files?.length).toBeGreaterThan(0)
    }
  })

  it("names source paths that exist, as directory prefixes", () => {
    for (const pkg of PACKAGE_ARTIFACTS) {
      for (const src of pkg.sources) {
        expect(src.endsWith("/")).toBe(true)
        expect(existsSync(path.join(REPO_ROOT, src))).toBe(true)
      }
    }
  })
})

describe("hashedStem", () => {
  it("recognises tsup chunk names", () => {
    expect(hashedStem("chunk-C2DUPZVY.js")).toEqual({
      stem: "chunk-C2DUPZVY",
      placeholder: "chunk-[hash]",
    })
  })

  it("recognises rollup-plugin-dts names, including a hash ending in a dash", () => {
    expect(hashedStem("types-ZPTjTL_-.d.ts")).toEqual({
      stem: "types-ZPTjTL_-",
      placeholder: "types-[hash]",
    })
  })

  it("ignores ordinary names, even with an eight-letter suffix", () => {
    expect(hashedStem("index.js")).toBeNull()
    expect(hashedStem("fowt-defaults.js")).toBeNull()
    expect(hashedStem("modern-minimal.css")).toBeNull()
  })
})

const tree = (entries) => new Map(entries)

describe("computePackageDrift", () => {
  it("returns no drift for identical trees", () => {
    const t = tree([
      ["dist/index.js", "A"],
      ["dist/themes/space.css", "B"],
    ])
    expect(computePackageDrift(t, new Map(t))).toEqual({ drifts: [], warnings: [] })
  })

  it("flags a file whose content changed", () => {
    const result = computePackageDrift(
      tree([["dist/themes/neutral.css", "--font-ascent: 0.967;"]]),
      tree([["dist/themes/neutral.css", ""]]),
    )
    expect(result.drifts).toEqual([{ path: "dist/themes/neutral.css", kind: "content" }])
  })

  it("flags a file the published tarball does not ship", () => {
    const result = computePackageDrift(
      tree([
        ["dist/index.js", "A"],
        ["dist/new.js", "N"],
      ]),
      tree([["dist/index.js", "A"]]),
    )
    expect(result.drifts).toEqual([{ path: "dist/new.js", kind: "missing-in-published" }])
  })

  it("warns, without failing, on a file only the published tarball ships", () => {
    const result = computePackageDrift(
      tree([["dist/index.js", "A"]]),
      tree([
        ["dist/index.js", "A"],
        ["dist/gone.js", "G"],
      ]),
    )
    expect(result.drifts).toEqual([])
    expect(result.warnings).toEqual([{ path: "dist/gone.js", kind: "removed-in-source" }])
  })

  it("treats a chunk renamed by an unchanged rebuild as no drift", () => {
    // Same bytes, different hash: only possible if the hash input differs
    // (e.g. a different bundler version), not the shipped code.
    const result = computePackageDrift(
      tree([
        ["dist/index.js", 'export * from "./chunk-AAAA1111.js"'],
        ["dist/chunk-AAAA1111.js", "code"],
      ]),
      tree([
        ["dist/index.js", 'export * from "./chunk-BBBB2222.js"'],
        ["dist/chunk-BBBB2222.js", "code"],
      ]),
    )
    expect(result).toEqual({ drifts: [], warnings: [] })
  })

  it("flags a chunk whose content changed, under its normalised name", () => {
    const result = computePackageDrift(
      tree([
        ["dist/index.js", 'export * from "./chunk-AAAA1111.js"'],
        ["dist/chunk-AAAA1111.js", "new code"],
      ]),
      tree([
        ["dist/index.js", 'export * from "./chunk-BBBB2222.js"'],
        ["dist/chunk-BBBB2222.js", "old code"],
      ]),
    )
    expect(result.drifts).toEqual([{ path: "dist/chunk-[hash].js", kind: "content" }])
  })

  it("compares several chunks as a set, independent of hash order", () => {
    const result = computePackageDrift(
      tree([
        ["dist/chunk-AAAA1111.js", "one"],
        ["dist/chunk-ZZZZ9999.js", "two"],
      ]),
      tree([
        ["dist/chunk-ZZZZ0000.js", "one"],
        ["dist/chunk-AAAA0000.js", "two"],
      ]),
    )
    expect(result.drifts).toEqual([])
  })

  it("flags a change in the number of chunks", () => {
    const result = computePackageDrift(
      tree([
        ["dist/chunk-AAAA1111.js", "one"],
        ["dist/chunk-BBBB1111.js", "two"],
      ]),
      tree([["dist/chunk-AAAA0000.js", "one"]]),
    )
    expect(result.drifts).toEqual([{ path: "dist/chunk-[hash].js", kind: "content" }])
  })
})

describe("formatPackageReport", () => {
  it("reports a clean package with its file count", () => {
    const out = formatPackageReport([
      {
        name: "@loworbitstudio/visor-tailwind-preset",
        publishedVersion: "0.2.0",
        fileCount: 20,
        drifts: [],
        warnings: [],
      },
    ])
    expect(out).toBe(
      "✓ No publish drift. 20 files match @loworbitstudio/visor-tailwind-preset@0.2.0.",
    )
  })

  it("names each drifted file and the release that resolves it", () => {
    const out = formatPackageReport([
      {
        name: "@loworbitstudio/visor-core",
        publishedVersion: "0.15.0",
        fileCount: 14,
        drifts: [
          { path: "dist/themes/neutral.css", kind: "content" },
          { path: "dist/new.css", kind: "missing-in-published" },
        ],
        warnings: [{ path: "dist/old.css", kind: "removed-in-source" }],
      },
    ])
    expect(out).toContain("✗ Publish drift detected in @loworbitstudio/visor-core@0.15.0 (2 files):")
    expect(out).toContain("dist/themes/neutral.css — content drift")
    expect(out).toContain("dist/new.css — missing from published tarball")
    expect(out).toContain("Resolution: cut a new @loworbitstudio/visor-core release.")
    expect(out).toContain("⚠ 1 file in @loworbitstudio/visor-core@0.15.0 but not in the local build")
    expect(out).toContain("dist/old.css")
  })
})
