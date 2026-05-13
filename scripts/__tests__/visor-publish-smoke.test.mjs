import { describe, it, expect } from "vitest"
import {
  computeDrift,
  formatReport,
  parseArgs,
} from "../visor-publish-smoke.mjs"

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

  it("parses -h and --help", () => {
    expect(parseArgs(["--help"]).help).toBe(true)
    expect(parseArgs(["-h"]).help).toBe(true)
  })

  it("throws on unknown args", () => {
    expect(() => parseArgs(["--nope"])).toThrow(/Unknown argument: --nope/)
  })
})
