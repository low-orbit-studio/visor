import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import {
  mergePubspec,
  pubspecExists,
  isPubPackageInstalled,
  getUninstalledPubDeps,
  addPubDependencies,
} from "../utils/pubspec.js"

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-pubspec-${Date.now()}-${Math.random()}`)
  mkdirSync(testDir, { recursive: true })
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
})

const BASE_PUBSPEC = `name: example_app
description: Example Flutter app.
version: 0.1.0+1

environment:
  sdk: ^3.5.0
  flutter: ^3.24.0

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
`

describe("mergePubspec", () => {
  it("adds a missing dependency", () => {
    const result = mergePubspec(BASE_PUBSPEC, [
      { pub: "visor_core", version: "^0.1.0" },
    ])
    expect(result.added).toEqual(["visor_core"])
    expect(result.skipped).toEqual([])
    expect(result.text).toContain("visor_core:")
    expect(result.text).toContain("^0.1.0")
  })

  it("skips an already-present dependency", () => {
    const result = mergePubspec(BASE_PUBSPEC, [
      { pub: "cupertino_icons", version: "^1.0.9" },
    ])
    expect(result.added).toEqual([])
    expect(result.skipped).toEqual(["cupertino_icons"])
    // Original version should be preserved
    expect(result.text).toContain("^1.0.8")
    expect(result.text).not.toContain("^1.0.9")
  })

  it("handles a mix of new and existing dependencies", () => {
    const result = mergePubspec(BASE_PUBSPEC, [
      { pub: "cupertino_icons", version: "^1.0.9" },
      { pub: "visor_core", version: "^0.1.0" },
      { pub: "go_router", version: "^14.0.0" },
    ])
    expect(result.added.sort()).toEqual(["go_router", "visor_core"])
    expect(result.skipped).toEqual(["cupertino_icons"])
    expect(result.text).toContain("visor_core:")
    expect(result.text).toContain("go_router:")
  })

  it("creates a dependencies block when absent", () => {
    const bare = `name: bare_app
version: 0.1.0

environment:
  sdk: ^3.5.0
`
    const result = mergePubspec(bare, [
      { pub: "visor_core", version: "^0.1.0" },
    ])
    expect(result.added).toEqual(["visor_core"])
    expect(result.text).toContain("dependencies:")
    expect(result.text).toContain("visor_core:")
  })

  it("preserves comment lines in round-trip", () => {
    const withComments = `# Top-level comment
name: example_app
version: 0.1.0+1

environment:
  sdk: ^3.5.0

# Core deps
dependencies:
  flutter:
    sdk: flutter
`
    const result = mergePubspec(withComments, [
      { pub: "visor_core", version: "^0.1.0" },
    ])
    expect(result.text).toContain("# Top-level comment")
    expect(result.text).toContain("# Core deps")
    expect(result.text).toContain("visor_core:")
  })

  it("is idempotent on empty deps input", () => {
    const result = mergePubspec(BASE_PUBSPEC, [])
    expect(result.added).toEqual([])
    expect(result.skipped).toEqual([])
  })
})

describe("pubspecExists", () => {
  it("returns false when no pubspec", () => {
    expect(pubspecExists(testDir)).toBe(false)
  })

  it("returns true when pubspec exists", () => {
    writeFileSync(join(testDir, "pubspec.yaml"), BASE_PUBSPEC)
    expect(pubspecExists(testDir)).toBe(true)
  })
})

describe("isPubPackageInstalled", () => {
  beforeEach(() => {
    writeFileSync(join(testDir, "pubspec.yaml"), BASE_PUBSPEC)
  })

  it("returns true for installed package", () => {
    expect(isPubPackageInstalled("cupertino_icons", testDir)).toBe(true)
  })

  it("returns false for missing package", () => {
    expect(isPubPackageInstalled("visor_core", testDir)).toBe(false)
  })

  it("returns false when pubspec missing", () => {
    const emptyDir = join(tmpdir(), `visor-empty-${Date.now()}`)
    mkdirSync(emptyDir, { recursive: true })
    try {
      expect(isPubPackageInstalled("cupertino_icons", emptyDir)).toBe(false)
    } finally {
      rmSync(emptyDir, { recursive: true, force: true })
    }
  })
})

describe("getUninstalledPubDeps", () => {
  beforeEach(() => {
    writeFileSync(join(testDir, "pubspec.yaml"), BASE_PUBSPEC)
  })

  it("returns only missing deps", () => {
    const result = getUninstalledPubDeps(
      [
        { pub: "cupertino_icons", version: "^1.0.8" },
        { pub: "visor_core", version: "^0.1.0" },
      ],
      testDir
    )
    expect(result).toEqual([{ pub: "visor_core", version: "^0.1.0" }])
  })
})

describe("addPubDependencies", () => {
  it("writes pubspec.yaml when deps are added", () => {
    writeFileSync(join(testDir, "pubspec.yaml"), BASE_PUBSPEC)
    const result = addPubDependencies(
      [{ pub: "visor_core", version: "^0.1.0" }],
      testDir
    )
    expect(result.added).toEqual(["visor_core"])
    const updated = readFileSync(join(testDir, "pubspec.yaml"), "utf-8")
    expect(updated).toContain("visor_core:")
  })

  it("does not write when nothing changed", () => {
    writeFileSync(join(testDir, "pubspec.yaml"), BASE_PUBSPEC)
    const before = readFileSync(join(testDir, "pubspec.yaml"), "utf-8")
    addPubDependencies(
      [{ pub: "cupertino_icons", version: "^1.0.8" }],
      testDir
    )
    const after = readFileSync(join(testDir, "pubspec.yaml"), "utf-8")
    expect(after).toBe(before)
  })

  it("throws when pubspec.yaml missing", () => {
    expect(() =>
      addPubDependencies([{ pub: "visor_core", version: "^0.1.0" }], testDir)
    ).toThrow(/No pubspec\.yaml found/)
  })
})
