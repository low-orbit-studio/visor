import { describe, it, expect, vi } from "vitest"
import {
  findItem,
  resolveTransitiveDeps,
  collectDependencies,
  collectSuggestedDeps,
} from "../registry/resolve.js"
import type { BundledRegistry, BundledRegistryItem } from "../registry/types.js"

function makeItem(
  overrides: Partial<BundledRegistryItem> & { name: string }
): BundledRegistryItem {
  return {
    type: "registry:ui",
    files: [],
    ...overrides,
  }
}

const testRegistry: BundledRegistry = {
  items: [
    makeItem({
      name: "utils",
      type: "registry:lib",
      dependencies: ["clsx"],
      files: [{ path: "lib/utils.ts", type: "registry:lib", content: "export {}" }],
    }),
    makeItem({
      name: "button",
      dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
      registryDependencies: ["utils"],
      files: [
        { path: "components/ui/button/button.tsx", type: "registry:ui", content: "<Button />" },
        { path: "components/ui/button/button.module.css", type: "registry:ui", content: ".base {}" },
      ],
    }),
    makeItem({
      name: "field",
      dependencies: ["class-variance-authority", "@loworbitstudio/visor-core"],
      registryDependencies: ["utils", "label"],
      files: [
        { path: "components/ui/field/field.tsx", type: "registry:ui", content: "<Field />" },
      ],
    }),
    makeItem({
      name: "label",
      dependencies: ["@radix-ui/react-label", "@loworbitstudio/visor-core"],
      registryDependencies: ["utils"],
      files: [
        { path: "components/ui/label/label.tsx", type: "registry:ui", content: "<Label />" },
      ],
    }),
    makeItem({
      name: "shell",
      type: "registry:block",
      dependencies: ["@loworbitstudio/visor-core"],
      // Hard dep = utils only; label is a slot-fill suggestion (pulls Radix).
      registryDependencies: ["utils"],
      suggestedDependencies: ["label"],
      files: [
        { path: "blocks/shell/shell.tsx", type: "registry:block", content: "<Shell />" },
      ],
    }),
  ],
}

describe("findItem", () => {
  it("finds an item by name", () => {
    const item = findItem(testRegistry, "button")
    expect(item).toBeDefined()
    expect(item!.name).toBe("button")
  })

  it("returns undefined for unknown items", () => {
    expect(findItem(testRegistry, "nonexistent")).toBeUndefined()
  })
})

describe("resolveTransitiveDeps", () => {
  it("resolves a single item with no deps", () => {
    const items = resolveTransitiveDeps(testRegistry, ["utils"])
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe("utils")
  })

  it("resolves an item with direct registry dependencies", () => {
    const items = resolveTransitiveDeps(testRegistry, ["button"])
    const names = items.map((i) => i.name)
    expect(names).toContain("button")
    expect(names).toContain("utils")
    expect(items).toHaveLength(2)
  })

  it("resolves transitive dependencies", () => {
    const items = resolveTransitiveDeps(testRegistry, ["field"])
    const names = items.map((i) => i.name)
    expect(names).toContain("field")
    expect(names).toContain("label")
    expect(names).toContain("utils")
    expect(items).toHaveLength(3)
  })

  it("deduplicates shared dependencies", () => {
    const items = resolveTransitiveDeps(testRegistry, ["button", "field"])
    const names = items.map((i) => i.name)
    // utils should appear only once even though both button and field depend on it
    expect(names.filter((n) => n === "utils")).toHaveLength(1)
  })

  it("throws for unknown items", () => {
    expect(() =>
      resolveTransitiveDeps(testRegistry, ["nonexistent"])
    ).toThrow('Registry item "nonexistent" not found.')
  })

  it("excludes suggested slot-fill deps by default", () => {
    const items = resolveTransitiveDeps(testRegistry, ["shell"])
    const names = items.map((i) => i.name)
    expect(names).toContain("shell")
    expect(names).toContain("utils")
    // label is a suggested dep — not pulled by default
    expect(names).not.toContain("label")
    expect(items).toHaveLength(2)
  })

  it("includes suggested slot-fill deps when includeSuggested is true", () => {
    const items = resolveTransitiveDeps(testRegistry, ["shell"], undefined, true)
    const names = items.map((i) => i.name)
    expect(names).toContain("shell")
    expect(names).toContain("utils")
    expect(names).toContain("label")
  })

  it("resolves transitive registry deps of a suggested dep when opted in", () => {
    // label depends on utils (already resolved) — no dupes, and label's Radix
    // npm dep should now be collectable.
    const items = resolveTransitiveDeps(testRegistry, ["shell"], undefined, true)
    const { dependencies } = collectDependencies(items)
    expect(dependencies).toContain("@radix-ui/react-label")
  })
})

describe("collectSuggestedDeps", () => {
  it("returns suggested deps not already in the resolved graph", () => {
    const items = resolveTransitiveDeps(testRegistry, ["shell"])
    const resolvedNames = new Set(items.map((i) => i.name))
    const suggested = collectSuggestedDeps(testRegistry, ["shell"], resolvedNames)
    expect(suggested).toEqual(["label"])
  })

  it("returns empty when a suggested dep is already resolved", () => {
    // Pretend label was resolved (e.g. requested alongside shell)
    const resolvedNames = new Set(["shell", "utils", "label"])
    const suggested = collectSuggestedDeps(testRegistry, ["shell"], resolvedNames)
    expect(suggested).toEqual([])
  })

  it("returns empty for items with no suggested deps", () => {
    const items = resolveTransitiveDeps(testRegistry, ["button"])
    const resolvedNames = new Set(items.map((i) => i.name))
    const suggested = collectSuggestedDeps(testRegistry, ["button"], resolvedNames)
    expect(suggested).toEqual([])
  })
})

describe("resolveTransitiveDeps circular detection", () => {
  it("emits circular dependency warnings via onWarning callback", () => {
    const circularRegistry: BundledRegistry = {
      items: [
        makeItem({
          name: "alpha",
          registryDependencies: ["beta"],
          files: [{ path: "lib/alpha.ts", type: "registry:lib", content: "" }],
        }),
        makeItem({
          name: "beta",
          registryDependencies: ["alpha"],
          files: [{ path: "lib/beta.ts", type: "registry:lib", content: "" }],
        }),
      ],
    }

    const warnings: string[] = []
    const items = resolveTransitiveDeps(circularRegistry, ["alpha"], (msg) => {
      warnings.push(msg)
    })

    expect(items).toHaveLength(2)
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings[0]).toContain("Circular registry dependency")
    expect(warnings[0]).toContain("alpha")
  })

  it("does not emit warnings when no callback is provided", () => {
    const circularRegistry: BundledRegistry = {
      items: [
        makeItem({
          name: "alpha",
          registryDependencies: ["beta"],
          files: [{ path: "lib/alpha.ts", type: "registry:lib", content: "" }],
        }),
        makeItem({
          name: "beta",
          registryDependencies: ["alpha"],
          files: [{ path: "lib/beta.ts", type: "registry:lib", content: "" }],
        }),
      ],
    }

    // Should not throw
    const items = resolveTransitiveDeps(circularRegistry, ["alpha"])
    expect(items).toHaveLength(2)
  })

  it("does not warn on shared (non-circular) dependencies", () => {
    // Both button and field depend on utils — this is shared, not circular
    const warnings: string[] = []
    const items = resolveTransitiveDeps(testRegistry, ["button", "field"], (msg) => {
      warnings.push(msg)
    })

    const names = items.map((i) => i.name)
    expect(names).toContain("button")
    expect(names).toContain("field")
    expect(names).toContain("utils")
    // No warnings — shared deps are not circular
    expect(warnings).toHaveLength(0)
  })
})

describe("collectDependencies", () => {
  it("collects and deduplicates npm dependencies", () => {
    const items = resolveTransitiveDeps(testRegistry, ["button"])
    const { dependencies } = collectDependencies(items)
    expect(dependencies).toContain("class-variance-authority")
    expect(dependencies).toContain("@loworbitstudio/visor-core")
    expect(dependencies).toContain("clsx")
    // Should be sorted
    expect(dependencies).toEqual([...dependencies].sort())
  })

  it("returns empty arrays for items with no deps", () => {
    const { dependencies, devDependencies } = collectDependencies([
      makeItem({ name: "empty" }),
    ])
    expect(dependencies).toEqual([])
    expect(devDependencies).toEqual([])
  })
})
