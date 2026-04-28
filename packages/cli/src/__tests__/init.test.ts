import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import type { SpawnSyncReturns } from "child_process"

const { spawnSyncMock } = vi.hoisted(() => ({ spawnSyncMock: vi.fn() }))

vi.mock("child_process", async () => {
  const actual = await vi.importActual<typeof import("child_process")>("child_process")
  return { ...actual, spawnSync: spawnSyncMock }
})

import { initCommand } from "../commands/init.js"
import { loadConfig, configExists } from "../config/config.js"
import { DEFAULT_CONFIG } from "../config/defaults.js"
import {
  NEXTJS_PINNED_VERSION,
  CREATE_NEXT_APP_FLAGS,
} from "../commands/templates/nextjs.js"

function mockProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
}

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-init-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  mkdirSync(testDir, { recursive: true })
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
  spawnSyncMock.mockReset()
})

describe("init command", () => {
  it("creates visor.json with default config", () => {
    initCommand(testDir)
    expect(configExists(testDir)).toBe(true)

    const config = loadConfig(testDir)
    expect(config).toEqual(DEFAULT_CONFIG)
  })

  it("does not overwrite existing visor.json", () => {
    const customConfig = {
      paths: { components: "src/ui", hooks: "src/hooks", lib: "src/lib" },
    }
    writeFileSync(
      join(testDir, "visor.json"),
      JSON.stringify(customConfig),
      "utf-8"
    )

    initCommand(testDir)

    const config = loadConfig(testDir)
    expect(config.paths.components).toBe("src/ui")
  })

  it("warns about missing visor-tokens", () => {
    // No package.json → tokens not installed
    initCommand(testDir)
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("@loworbitstudio/visor-core")
    )
  })

  it("does not warn about tokens when they are installed", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: { "@loworbitstudio/visor-core": "^0.1.0" },
      }),
      "utf-8"
    )

    initCommand(testDir)

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const tokenWarnings = calls.filter((call: unknown[]) =>
      String(call[0]).includes("@loworbitstudio/visor-core is not installed")
    )
    expect(tokenWarnings).toHaveLength(0)
  })

  it("--template invalid exits with error", () => {
    mockProcessExit()
    expect(() => {
      initCommand(testDir, { template: "flutter" })
    }).toThrow("process.exit(1)")
  })

  describe("--json flag", () => {
    it("outputs valid JSON with success field", () => {
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonCall = calls.find((c: unknown[]) => {
        try {
          JSON.parse(String(c[0]))
          return true
        } catch {
          return false
        }
      })
      expect(jsonCall).toBeDefined()
      const result = JSON.parse(String(jsonCall![0]))
      expect(result.success).toBe(true)
    })

    it("outputs files.created containing visor.json", () => {
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.files.created).toContain("visor.json")
    })

    it("outputs files.skipped containing visor.json when it already exists", () => {
      writeFileSync(
        join(testDir, "visor.json"),
        JSON.stringify({ paths: { components: "src/ui", deckComponents: "components/deck", blocks: "blocks", hooks: "hooks", lib: "lib" } }),
        "utf-8"
      )

      mockProcessExit()
      expect(() => {
        initCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.files.skipped).toContain("visor.json")
    })

    it("outputs warnings when visor-core is not installed", () => {
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain("visor-core")
    })

    it("outputs success:false and exits 1 for invalid template", () => {
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { template: "flutter", json: true })
      }).toThrow("process.exit(1)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("outputs nextSteps array", () => {
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(Array.isArray(result.nextSteps)).toBe(true)
    })
  })

  describe("--template nextjs (mocked shell-out)", () => {
    /**
     * Configure spawnSyncMock to simulate create-next-app + npm install.
     * Pre-creates the files create-next-app would write so the rest of
     * scaffoldNextjs runs the same code path it would in production.
     */
    function mockShellOut(opts?: { failCommand?: "create-next-app" | "npm install" }) {
      const ok = (): SpawnSyncReturns<Buffer> => ({
        status: 0,
        signal: null,
        output: [],
        pid: 0,
        stdout: Buffer.from(""),
        stderr: Buffer.from(""),
      })
      const fail = (): SpawnSyncReturns<Buffer> => ({
        status: 1,
        signal: null,
        output: [],
        pid: 0,
        stdout: Buffer.from(""),
        stderr: Buffer.from(""),
      })

      spawnSyncMock.mockImplementation(((command: string, args: readonly string[]) => {
        const argv = Array.from(args ?? [])

        if (command === "npx" && argv[0]?.startsWith("create-next-app@")) {
          if (opts?.failCommand === "create-next-app") return fail()
          writeFileSync(
            join(testDir, "package.json"),
            JSON.stringify(
              {
                name: "my-app",
                version: "0.1.0",
                scripts: { dev: "next dev", build: "next build", start: "next start" },
                dependencies: { next: "^15.1.6", react: "^19.0.0", "react-dom": "^19.0.0" },
                devDependencies: { typescript: "^5", "@types/node": "^22", "@types/react": "^19", "@types/react-dom": "^19" },
              },
              null,
              2
            ),
            "utf-8"
          )
          mkdirSync(join(testDir, "app"), { recursive: true })
          writeFileSync(join(testDir, "app", "page.tsx"), "export default function Page() { return <h1>Hello</h1>; }\n", "utf-8")
          writeFileSync(join(testDir, "app", "layout.tsx"), "export default function RootLayout({ children }) { return <html><body>{children}</body></html>; }\n", "utf-8")
          writeFileSync(join(testDir, "app", "globals.css"), "/* default Tailwind, will be overwritten */\n", "utf-8")
          writeFileSync(join(testDir, "tsconfig.json"), "{}\n", "utf-8")
          writeFileSync(join(testDir, "next.config.ts"), "export default {};\n", "utf-8")
          writeFileSync(join(testDir, ".gitignore"), "node_modules\n", "utf-8")
          return ok()
        }

        if (command === "npm" && argv[0] === "install") {
          if (opts?.failCommand === "npm install") return fail()
          const pkgPath = join(testDir, "package.json")
          const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
          pkg.dependencies = {
            ...pkg.dependencies,
            "@loworbitstudio/visor-core": `^0.4.1`,
            "@loworbitstudio/visor-theme-engine": `^0.4.0`,
          }
          writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8")
          return ok()
        }

        throw new Error(`unexpected spawnSync call: ${command} ${argv.join(" ")}`)
      }) as never)

      return spawnSyncMock
    }

    it("scaffolds a runnable Borealis-native app", () => {
      mockShellOut()
      initCommand(testDir, { template: "nextjs" })

      // create-next-app artifacts.
      expect(existsSync(join(testDir, "package.json"))).toBe(true)
      expect(existsSync(join(testDir, "app/page.tsx"))).toBe(true)
      expect(existsSync(join(testDir, "tsconfig.json"))).toBe(true)
      expect(existsSync(join(testDir, "next.config.ts"))).toBe(true)
      expect(existsSync(join(testDir, ".gitignore"))).toBe(true)

      // Visor wiring.
      expect(existsSync(join(testDir, ".visor.yaml"))).toBe(true)
      expect(existsSync(join(testDir, "app/globals.css"))).toBe(true)
      expect(existsSync(join(testDir, "app/layout.tsx"))).toBe(true)
      expect(existsSync(join(testDir, ".lo/borealis.json"))).toBe(true)

      // package.json carries visor-core dep.
      const pkg = JSON.parse(readFileSync(join(testDir, "package.json"), "utf-8"))
      expect(pkg.dependencies["@loworbitstudio/visor-core"]).toBeDefined()
      expect(pkg.dependencies["@loworbitstudio/visor-theme-engine"]).toBeDefined()

      // layout.tsx wires FOWT_SCRIPT and globals.css.
      const layout = readFileSync(join(testDir, "app/layout.tsx"), "utf-8")
      expect(layout).toContain('import "./globals.css"')
      expect(layout).toContain("FOWT_SCRIPT")
      expect(layout).toContain("@loworbitstudio/visor-theme-engine/fowt")

      // globals.css is the Visor adapter output, not the Tailwind default.
      const css = readFileSync(join(testDir, "app/globals.css"), "utf-8")
      expect(css).toContain("@layer visor-primitives")
      expect(css).not.toContain("default Tailwind")

      // .visor.yaml has the starter template.
      const yaml = readFileSync(join(testDir, ".visor.yaml"), "utf-8")
      expect(yaml).toContain("name: my-app")
      expect(yaml).toContain("primary:")

      // borealis.json has version + ISO timestamp.
      const stamp = JSON.parse(readFileSync(join(testDir, ".lo/borealis.json"), "utf-8"))
      expect(typeof stamp.visorVersion).toBe("string")
      expect(stamp.visorVersion.length).toBeGreaterThan(0)
      expect(() => new Date(stamp.initializedAt).toISOString()).not.toThrow()
      expect(stamp.initializedAt).toBe(new Date(stamp.initializedAt).toISOString())
    })

    it("calls create-next-app with the pinned version and required flags", () => {
      const spy = mockShellOut()
      initCommand(testDir, { template: "nextjs" })

      const createCall = spy.mock.calls.find(
        (call) => call[0] === "npx" && String(call[1]?.[0]).startsWith("create-next-app@")
      )
      expect(createCall).toBeDefined()
      const args = createCall![1] as string[]
      expect(args[0]).toBe(`create-next-app@${NEXTJS_PINNED_VERSION}`)
      expect(args[1]).toBe(".")
      for (const flag of CREATE_NEXT_APP_FLAGS) {
        expect(args).toContain(flag)
      }
    })

    it("refuses when package.json already exists", () => {
      const exitSpy = mockProcessExit()
      const shellSpy = mockShellOut()
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "existing" }), "utf-8")

      expect(() => {
        initCommand(testDir, { template: "nextjs" })
      }).toThrow("process.exit(1)")

      // No filesystem mutations beyond what the user already had.
      expect(existsSync(join(testDir, ".visor.yaml"))).toBe(false)
      expect(existsSync(join(testDir, ".lo/borealis.json"))).toBe(false)
      expect(existsSync(join(testDir, "app/globals.css"))).toBe(false)
      // create-next-app should not have been invoked.
      const createCall = shellSpy.mock.calls.find(
        (call) => call[0] === "npx" && String(call[1]?.[0]).startsWith("create-next-app@")
      )
      expect(createCall).toBeUndefined()
      // visor.json should not have been created either — refusal is upstream of writeConfig.
      expect(configExists(testDir)).toBe(false)
      exitSpy.mockRestore()
    })

    it("re-running in an already-scaffolded directory hits the refusal path", () => {
      mockShellOut()
      initCommand(testDir, { template: "nextjs" })
      expect(existsSync(join(testDir, "package.json"))).toBe(true)

      // Second invocation: package.json now exists from the first run.
      const exitSpy = mockProcessExit()
      expect(() => {
        initCommand(testDir, { template: "nextjs" })
      }).toThrow("process.exit(1)")
      exitSpy.mockRestore()
    })

    it("--json files.created lists every Visor-wired artifact", () => {
      mockShellOut()
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { template: "nextjs", json: true })
      }).toThrow("process.exit(0)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls
        .map((c: unknown[]) => String(c[0]))
        .find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(true)
      expect(result.files.created).toContain("visor.json")
      expect(result.files.created).toContain(".visor.yaml")
      expect(result.files.created).toContain("app/globals.css")
      expect(result.files.created).toContain("app/layout.tsx")
      expect(result.files.created).toContain(".lo/borealis.json")
      // No spurious "visor-core not installed" warning after a full scaffold.
      const tokenWarning = (result.warnings as string[]).find((w) =>
        w.includes("visor-core is not installed")
      )
      expect(tokenWarning).toBeUndefined()
    })

    it("--json error path: refusal emits success:false with helpful error", () => {
      mockShellOut()
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "existing" }), "utf-8")
      mockProcessExit()
      expect(() => {
        initCommand(testDir, { template: "nextjs", json: true })
      }).toThrow("process.exit(1)")

      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      const jsonOutput = calls.map((c: unknown[]) => String(c[0])).find((s) => s.startsWith("{"))
      const result = JSON.parse(jsonOutput!)
      expect(result.success).toBe(false)
      expect(result.error).toContain("package.json already exists")
    })

    it("propagates create-next-app failures", () => {
      mockShellOut({ failCommand: "create-next-app" })
      expect(() => {
        initCommand(testDir, { template: "nextjs" })
      }).toThrow(/create-next-app exited with code/)
    })

    it("propagates npm install failures", () => {
      mockShellOut({ failCommand: "npm install" })
      expect(() => {
        initCommand(testDir, { template: "nextjs" })
      }).toThrow(/npm install exited with code/)
    })
  })

  describe.skipIf(!process.env.VISOR_E2E)("--template nextjs (real shell-out, VISOR_E2E=1)", () => {
    it("scaffolds, installs, and builds in a tmpdir", async () => {
      // Real shell-out: bypass the mock by routing through importActual.
      // Slow (~60s+) — gated behind VISOR_E2E to keep default test runs fast.
      const real = await vi.importActual<typeof import("child_process")>("child_process")
      spawnSyncMock.mockImplementation(real.spawnSync as never)

      initCommand(testDir, { template: "nextjs" })

      expect(existsSync(join(testDir, "package.json"))).toBe(true)
      expect(existsSync(join(testDir, "app/layout.tsx"))).toBe(true)
      expect(existsSync(join(testDir, ".lo/borealis.json"))).toBe(true)

      const buildResult = real.spawnSync("npm", ["run", "build"], {
        cwd: testDir,
        stdio: "ignore",
      })
      expect(buildResult.status).toBe(0)
    }, 300_000)
  })
})
