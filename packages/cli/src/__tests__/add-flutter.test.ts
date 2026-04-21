import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  cpSync,
  mkdirSync,
  rmSync,
  readFileSync,
  existsSync,
} from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { tmpdir } from "os"

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = join(__dirname, "fixtures", "empty-flutter-app")

// Mock the Flutter CLI so tests don't spawn real flutter subprocesses.
// findFlutterBin returns null → add.ts falls into the "warn, skip pub get"
// branch, which still writes files + updates pubspec.yaml. That's the
// behavior we want to assert here anyway.
vi.mock("../utils/flutter.js", () => ({
  findFlutterBin: vi.fn(() => null),
  runFlutterPubGet: vi.fn(() => true),
}))

// Mock the registry loader with a Flutter Button item mirroring what
// registry-flutter.ts emits from the real components/flutter/ manifest.
vi.mock("../registry/resolve.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../registry/resolve.js")>()
  return {
    ...actual,
    loadRegistry: vi.fn(() => ({
      items: [
        {
          name: "Button",
          type: "registry:ui",
          target: "flutter",
          description: "Primary interactive element for triggering actions.",
          category: "form",
          pubDependencies: [{ pub: "visor_core", version: "^0.1.0" }],
          files: [
            {
              path: "components/flutter/visor_button/visor_button.dart",
              type: "registry:ui",
              target: "flutter",
              content:
                "import 'package:visor_core/visor_core.dart';\nclass VisorButton {}",
            },
            {
              path: "components/flutter/visor_button/visor_button_test.dart",
              type: "registry:ui",
              target: "flutter",
              content: "void main() {}",
            },
          ],
        },
        {
          name: "StatCard",
          type: "registry:ui",
          target: "flutter",
          category: "admin",
          pubDependencies: [{ pub: "visor_core", version: "^0.1.0" }],
          files: [
            {
              path: "components/flutter/visor_stat_card/visor_stat_card.dart",
              type: "registry:ui",
              target: "flutter",
              content: "class VisorStatCard {}",
            },
          ],
        },
        // React button to verify target filtering keeps paths separate.
        {
          name: "button",
          type: "registry:ui",
          target: "react",
          dependencies: ["class-variance-authority"],
          files: [
            {
              path: "components/ui/button/button.tsx",
              type: "registry:ui",
              content: "export function Button() {}",
            },
          ],
        },
      ],
    })),
  }
})

import { addCommand } from "../commands/add.js"

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

let testDir: string

beforeEach(() => {
  testDir = join(
    tmpdir(),
    `visor-test-add-flutter-${Date.now()}-${Math.random()}`
  )
  mkdirSync(testDir, { recursive: true })
  cpSync(FIXTURE_DIR, testDir, { recursive: true })
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
})

describe("add --target flutter", () => {
  it("writes widget files to config.paths.flutterComponents", () => {
    addCommand(["button"], testDir, { target: "flutter" })

    const widget = join(
      testDir,
      "lib/visor/components/visor_button/visor_button.dart"
    )
    const widgetTest = join(
      testDir,
      "lib/visor/components/visor_button/visor_button_test.dart"
    )
    expect(existsSync(widget)).toBe(true)
    expect(existsSync(widgetTest)).toBe(true)
    expect(readFileSync(widget, "utf-8")).toContain("VisorButton")
  })

  it("merges pubDependencies into pubspec.yaml", () => {
    addCommand(["button"], testDir, { target: "flutter" })

    const updated = readFileSync(join(testDir, "pubspec.yaml"), "utf-8")
    expect(updated).toContain("visor_core:")
    expect(updated).toContain("^0.1.0")
    // Pre-existing deps are preserved.
    expect(updated).toContain("cupertino_icons")
    expect(updated).toContain("^1.0.8")
  })

  it("resolves PascalCase item names from lowercase user input", () => {
    // User types "button", registry stores "Button". Case-insensitive.
    addCommand(["button"], testDir, { target: "flutter" })
    expect(
      existsSync(
        join(testDir, "lib/visor/components/visor_button/visor_button.dart")
      )
    ).toBe(true)
  })

  it("does not write React files into a Flutter install", () => {
    addCommand(["button"], testDir, { target: "flutter" })

    const reactFile = join(testDir, "components/ui/button/button.tsx")
    expect(existsSync(reactFile)).toBe(false)
  })

  it("accepts multiple widgets in one call", () => {
    addCommand(["button", "statcard"], testDir, {
      target: "flutter",
    })

    expect(
      existsSync(
        join(testDir, "lib/visor/components/visor_button/visor_button.dart")
      )
    ).toBe(true)
    expect(
      existsSync(
        join(
          testDir,
          "lib/visor/components/visor_stat_card/visor_stat_card.dart"
        )
      )
    ).toBe(true)
  })

  it("errors out on an unknown component name for the target", () => {
    const exitSpy = mockProcessExit()
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() =>
      addCommand(["nonexistent"], testDir, { target: "flutter", json: true })
    ).toThrow("process.exit(1)")

    expect(exitSpy).toHaveBeenCalledWith(1)

    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it("warns but does not crash when pubspec.yaml is missing", () => {
    const missingPubspecDir = join(
      tmpdir(),
      `visor-test-no-pubspec-${Date.now()}`
    )
    mkdirSync(missingPubspecDir, { recursive: true })
    try {
      // Should not throw. Flutter target is OK without a pubspec — files
      // still get written; pub deps get surfaced as a warning.
      expect(() =>
        addCommand(["button"], missingPubspecDir, {
          target: "flutter",
        })
      ).not.toThrow()

      expect(
        existsSync(
          join(
            missingPubspecDir,
            "lib/visor/components/visor_button/visor_button.dart"
          )
        )
      ).toBe(true)
    } finally {
      rmSync(missingPubspecDir, { recursive: true, force: true })
    }
  })
})

describe("add without --target (default: react)", () => {
  it("routes to the React registry item when both exist", () => {
    const reactDir = join(tmpdir(), `visor-test-react-${Date.now()}`)
    mkdirSync(reactDir, { recursive: true })
    try {
      addCommand(["button"], reactDir, {})
      // React target has no flutterComponents path rewrite.
      expect(
        existsSync(join(reactDir, "components/ui/button/button.tsx"))
      ).toBe(true)
      expect(
        existsSync(
          join(reactDir, "lib/visor/components/visor_button/visor_button.dart")
        )
      ).toBe(false)
    } finally {
      rmSync(reactDir, { recursive: true, force: true })
    }
  })
})
