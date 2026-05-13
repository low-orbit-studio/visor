// @vitest-environment node
import { describe, it, expect } from "vitest"
import { execFileSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, "..", "..")
const distEntry = join(packageRoot, "dist", "index.js")
const pkgPath = join(packageRoot, "package.json")

describe("visor --version", () => {
  it("stays in sync with package.json version", () => {
    // Snapshot regression for VI-369: the CLI must report its real installed
    // version, not a hardcoded string that drifts from package.json.
    if (!existsSync(distEntry)) {
      throw new Error(
        `dist/index.js not found at ${distEntry}. Run \`npm run build\` in packages/cli before running this test.`
      )
    }

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      version: string
    }

    const output = execFileSync("node", [distEntry, "--version"], {
      encoding: "utf-8",
    }).trim()

    expect(output).toBe(pkg.version)
  })
})
