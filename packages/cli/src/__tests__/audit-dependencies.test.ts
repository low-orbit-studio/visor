import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import {
  auditRegistryDependencies,
  collectTransitiveDeclaredDeps,
  extractImports,
} from "../registry/audit-dependencies.js"
import type {
  BundledRegistry,
  BundledRegistryItem,
} from "../registry/types.js"

function makeItem(
  overrides: Partial<BundledRegistryItem> & { name: string }
): BundledRegistryItem {
  return {
    type: "registry:ui",
    files: [],
    ...overrides,
  }
}

describe("extractImports", () => {
  it("captures default, named, namespace, and side-effect imports", () => {
    const content = `
      import React from "react"
      import { Slot } from "@radix-ui/react-slot"
      import * as Sentry from "@sentry/nextjs"
      import "./styles.css"
      import "tailwindcss/utilities.css"
    `
    const imports = extractImports(content)
    // react is filtered as an assumed peer dep
    expect(imports.has("@radix-ui/react-slot")).toBe(true)
    expect(imports.has("@sentry/nextjs")).toBe(true)
    expect(imports.has("tailwindcss")).toBe(true)
    expect(imports.has("react")).toBe(false)
  })

  it("captures type-only imports", () => {
    const imports = extractImports(
      `import type { VariantProps } from "class-variance-authority"`
    )
    expect(imports.has("class-variance-authority")).toBe(true)
  })

  it("captures re-exports", () => {
    const imports = extractImports(
      `export { foo } from "some-package"\nexport * from "@scoped/pkg"`
    )
    expect(imports.has("some-package")).toBe(true)
    expect(imports.has("@scoped/pkg")).toBe(true)
  })

  it("ignores relative and @/ alias imports", () => {
    const imports = extractImports(`
      import { cn } from "../../../lib/utils"
      import { Thing } from "@/lib/thing"
      import styles from "./button.module.css"
    `)
    expect(imports.size).toBe(0)
  })

  it("ignores commented-out imports", () => {
    const imports = extractImports(`
      // import { Bad } from "should-be-skipped"
      /* import { Also } from "also-skipped" */
      import { Real } from "real-package"
    `)
    expect(imports.has("should-be-skipped")).toBe(false)
    expect(imports.has("also-skipped")).toBe(false)
    expect(imports.has("real-package")).toBe(true)
  })

  it("ignores node: prefix and bare Node built-ins", () => {
    const imports = extractImports(`
      import fs from "node:fs"
      import path from "path"
      import { execFile } from "child_process"
    `)
    expect(imports.size).toBe(0)
  })

  it("extracts scoped and unscoped package names from subpaths", () => {
    const imports = extractImports(`
      import x from "@radix-ui/react-dropdown-menu/some/sub"
      import y from "lodash/fp"
    `)
    expect(imports.has("@radix-ui/react-dropdown-menu")).toBe(true)
    expect(imports.has("lodash")).toBe(true)
  })
})

describe("collectTransitiveDeclaredDeps", () => {
  const registry: BundledRegistry = {
    items: [
      makeItem({
        name: "utils",
        type: "registry:lib",
        dependencies: ["clsx"],
      }),
      makeItem({
        name: "button",
        dependencies: ["@radix-ui/react-slot", "class-variance-authority"],
        registryDependencies: ["utils"],
      }),
      makeItem({
        name: "complex",
        dependencies: ["a"],
        registryDependencies: ["button"],
      }),
    ],
  }

  it("includes direct deps", () => {
    const deps = collectTransitiveDeclaredDeps(registry, "button")
    expect(deps.has("@radix-ui/react-slot")).toBe(true)
    expect(deps.has("class-variance-authority")).toBe(true)
  })

  it("walks transitive registryDependencies", () => {
    const deps = collectTransitiveDeclaredDeps(registry, "button")
    expect(deps.has("clsx")).toBe(true)
  })

  it("walks multi-level chains", () => {
    const deps = collectTransitiveDeclaredDeps(registry, "complex")
    expect(deps.has("a")).toBe(true)
    expect(deps.has("@radix-ui/react-slot")).toBe(true)
    expect(deps.has("clsx")).toBe(true)
  })

  it("prefers React-target items when a name collides with a Flutter item", () => {
    const collidingRegistry: BundledRegistry = {
      items: [
        makeItem({
          name: "button",
          target: "flutter",
        }),
        makeItem({
          name: "button",
          dependencies: ["@radix-ui/react-slot"],
        }),
      ],
    }
    const deps = collectTransitiveDeclaredDeps(collidingRegistry, "button")
    expect(deps.has("@radix-ui/react-slot")).toBe(true)
  })
})

describe("auditRegistryDependencies", () => {
  it("returns an empty array when every import is declared", () => {
    const registry: BundledRegistry = {
      items: [
        makeItem({
          name: "utils",
          type: "registry:lib",
          dependencies: ["clsx"],
          files: [
            {
              path: "lib/utils.ts",
              type: "registry:lib",
              content: `import { clsx } from "clsx"`,
            },
          ],
        }),
        makeItem({
          name: "button",
          dependencies: ["@radix-ui/react-slot", "class-variance-authority"],
          registryDependencies: ["utils"],
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: `
                import { Slot } from "@radix-ui/react-slot"
                import { cva } from "class-variance-authority"
                import { cn } from "../../../lib/utils"
              `,
            },
          ],
        }),
      ],
    }
    expect(auditRegistryDependencies(registry)).toEqual([])
  })

  it("flags an undeclared import", () => {
    const registry: BundledRegistry = {
      items: [
        makeItem({
          name: "button",
          dependencies: ["class-variance-authority"],
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: `import { Slot } from "@radix-ui/react-slot"`,
            },
          ],
        }),
      ],
    }
    const issues = auditRegistryDependencies(registry)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      item: "button",
      missing: "@radix-ui/react-slot",
    })
  })

  it("accepts deps declared on a transitive registry dependency", () => {
    const registry: BundledRegistry = {
      items: [
        makeItem({
          name: "utils",
          type: "registry:lib",
          dependencies: ["clsx"],
        }),
        makeItem({
          name: "button",
          // 'clsx' is not declared here, but it's transitively declared via utils
          registryDependencies: ["utils"],
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: `import { clsx } from "clsx"`,
            },
          ],
        }),
      ],
    }
    expect(auditRegistryDependencies(registry)).toEqual([])
  })

  it("skips Flutter-target items entirely", () => {
    const registry: BundledRegistry = {
      items: [
        makeItem({
          name: "flutter-button",
          target: "flutter",
          // No `dependencies`, but Dart files aren't scanned.
          files: [
            {
              path: "components/flutter/visor_button.dart",
              type: "registry:ui",
              content: `import 'package:flutter/material.dart';`,
            },
          ],
        }),
      ],
    }
    expect(auditRegistryDependencies(registry)).toEqual([])
  })

  it("does not require react or react-dom in dependencies (peer-dep convention)", () => {
    const registry: BundledRegistry = {
      items: [
        makeItem({
          name: "button",
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: `
                import * as React from "react"
                import { createPortal } from "react-dom"
              `,
            },
          ],
        }),
      ],
    }
    expect(auditRegistryDependencies(registry)).toEqual([])
  })
})

/**
 * VI-431 regression gate.
 *
 * The whole point of this test is to catch any future drift where a
 * registry item's source file imports a package that isn't installed by
 * `npx visor add`. The build target is the bundled registry.json that
 * actually ships in the published `@loworbitstudio/visor` tarball — the
 * same artifact the CLI reads at runtime.
 *
 * If this fails locally, run `npm run build -w packages/cli` first; the
 * audit runs against the freshly-built dist artifact.
 */
describe("audit against the built registry.json", () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  // packages/cli/src/__tests__ -> packages/cli/dist
  const distRegistryPath = join(__dirname, "../../dist/registry.json")
  const builtExists = existsSync(distRegistryPath)

  ;(builtExists ? it : it.skip)(
    "has no missing dependency declarations in any React-target item",
    () => {
      const registry = JSON.parse(
        readFileSync(distRegistryPath, "utf-8")
      ) as BundledRegistry
      const issues = auditRegistryDependencies(registry)
      if (issues.length > 0) {
        // Aggregate by item for a readable failure message.
        const byItem = new Map<string, Set<string>>()
        for (const issue of issues) {
          if (!byItem.has(issue.item)) byItem.set(issue.item, new Set())
          byItem.get(issue.item)!.add(issue.missing)
        }
        const lines = Array.from(byItem.entries()).map(
          ([item, pkgs]) => `  ${item}: ${Array.from(pkgs).join(", ")}`
        )
        throw new Error(
          [
            `Registry dependency drift detected (${issues.length} issue(s)).`,
            `Add the missing packages to each item's \`dependencies\` array:`,
            ...lines,
          ].join("\n")
        )
      }
      expect(issues).toEqual([])
    }
  )
})
