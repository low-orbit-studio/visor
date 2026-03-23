import { describe, it, expect } from "vitest"
import {
  findItem,
  resolveTransitiveDeps,
  collectDependencies,
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
      dependencies: ["clsx", "tailwind-merge"],
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
})

describe("collectDependencies", () => {
  it("collects and deduplicates npm dependencies", () => {
    const items = resolveTransitiveDeps(testRegistry, ["button"])
    const { dependencies } = collectDependencies(items)
    expect(dependencies).toContain("class-variance-authority")
    expect(dependencies).toContain("@loworbitstudio/visor-core")
    expect(dependencies).toContain("clsx")
    expect(dependencies).toContain("tailwind-merge")
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
