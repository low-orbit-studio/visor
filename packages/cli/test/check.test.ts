import { describe, it, expect, vi, beforeAll } from "vitest"
import { getAllCatalogItems, findByName, fuzzyFind } from "../src/check/catalog.js"
import { scanJsx } from "../src/check/jsx-scan.js"
import type { VisorManifest } from "../src/generate/manifest-types.js"

// Minimal manifest fixture — enough to exercise all three commands.
const FIXTURE_MANIFEST: VisorManifest = {
  version: "0.3.0",
  generated_at: "2026-01-01T00:00:00Z",
  components: {
    button: {
      category: "form",
      description: "Accessible button with multiple variants",
      when_to_use: ["Triggering an action"],
      when_not_to_use: ["Navigation — use Link instead"],
      dependencies: [],
      tokens_used: [],
      example: "<Button>Click</Button>",
      sub_components: [
        { name: "ButtonIcon", description: "Icon slot inside Button" },
      ],
    },
    input: {
      category: "form",
      description: "Text input field",
      when_to_use: ["Collecting text input"],
      when_not_to_use: [],
      dependencies: [],
      tokens_used: [],
      example: "<Input />",
    },
  },
  blocks: {
    "login-form": {
      category: "authentication",
      description: "Full login form with email and password",
      components_used: ["button", "input"],
      when_to_use: ["Login screens"],
      when_not_to_use: [],
    },
  },
  hooks: {
    "use-toast": {
      description: "Hook for displaying toast notifications",
    },
  },
  patterns: {
    "form-with-validation": {
      description: "Form pattern with inline validation",
      components_used: ["input", "button"],
      when_to_use: ["Data entry forms"],
    },
  },
  categories: { form: ["button", "input"] },
}

vi.mock("../src/registry/resolve.js", () => ({
  loadManifest: () => FIXTURE_MANIFEST,
}))

describe("check list", () => {
  it("returns all catalog items across types", () => {
    const items = getAllCatalogItems(FIXTURE_MANIFEST)
    const types = new Set(items.map((i) => i.type))
    expect(types).toContain("component")
    expect(types).toContain("block")
    expect(types).toContain("hook")
    expect(types).toContain("pattern")
  })

  it("includes sub-components as individual items", () => {
    const items = getAllCatalogItems(FIXTURE_MANIFEST)
    expect(items.some((i) => i.name === "button-icon")).toBe(true)
  })
})

describe("check has", () => {
  it("finds an exact component by kebab name", () => {
    const result = findByName(FIXTURE_MANIFEST, "button")
    expect(result.found).toBe(true)
    if (result.found) {
      expect(result.type).toBe("component")
      expect(result.installCmd).toBe("npx visor add button")
    }
  })

  it("finds a component by PascalCase name via normalisation", () => {
    const result = findByName(FIXTURE_MANIFEST, "Button")
    expect(result.found).toBe(true)
  })

  it("finds a block", () => {
    const result = findByName(FIXTURE_MANIFEST, "login-form")
    expect(result.found).toBe(true)
    if (result.found) {
      expect(result.type).toBe("block")
      expect(result.installCmd).toContain("--block")
    }
  })

  it("returns found: false for a non-existent name", () => {
    const result = findByName(FIXTURE_MANIFEST, "nonexistent-zzz")
    expect(result.found).toBe(false)
  })

  it("fuzzy-finds components by partial description", () => {
    const results = fuzzyFind(FIXTURE_MANIFEST, "login form", 5)
    expect(results.length).toBeGreaterThan(0)
  })
})

describe("check diff", () => {
  it("returns empty findings for JSX with no native HTML primitives", async () => {
    // Write a temp fixture to a tmp path and scan it
    const { writeFileSync, unlinkSync } = await import("fs")
    const { tmpdir } = await import("os")
    const { join } = await import("path")

    const tmpFile = join(tmpdir(), "visor-check-test.tsx")
    writeFileSync(tmpFile, `
      import { Button } from "@/components/ui/button"
      export default function Page() {
        return <Button>Click me</Button>
      }
    `)

    const result = await scanJsx(tmpFile)
    unlinkSync(tmpFile)

    expect(result.findings).toHaveLength(0)
    expect(result.summary.scanned).toBe(1)
  })

  it("detects native <button> in a file and suggests Button", async () => {
    const { writeFileSync, unlinkSync } = await import("fs")
    const { tmpdir } = await import("os")
    const { join } = await import("path")

    const tmpFile = join(tmpdir(), "visor-check-native.tsx")
    writeFileSync(tmpFile, `
      export default function Page() {
        return <button onClick={() => {}}>Click</button>
      }
    `)

    const result = await scanJsx(tmpFile)
    unlinkSync(tmpFile)

    expect(result.summary.hits).toBeGreaterThan(0)
    expect(result.findings[0].nativeTag).toBe("button")
    expect(result.findings[0].suggestedPrimitive).toBe("Button")
  })
})
