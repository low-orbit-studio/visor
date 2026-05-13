#!/usr/bin/env node
/**
 * Visor publish-gate smoke test.
 *
 * Compares this repo's locally-built `packages/cli/dist/registry.json`
 * against the `dist/registry.json` shipped in the latest published
 * `@loworbitstudio/visor` tarball. Reports per-item / per-file content
 * drift.
 *
 * Catches the failure mode where a VI- ticket is marked Done in Linear
 * but the registry artifact has not landed in the published CLI — the
 * BO-12 / BO-13 / BO-26 pattern. See: docs/wisdom/W020-publish-coordination-drift.md
 *
 * Usage:
 *   node scripts/visor-publish-smoke.mjs            run against the latest published @loworbitstudio/visor
 *   node scripts/visor-publish-smoke.mjs --json     emit JSON instead of a human report
 *   node scripts/visor-publish-smoke.mjs --version <semver>   pin a specific published version
 *   node scripts/visor-publish-smoke.mjs --local <path>       use a pre-extracted tarball (testing)
 *   node scripts/visor-publish-smoke.mjs --help
 *
 * Exit codes:
 *   0  no drift (warnings allowed)
 *   1  drift detected
 *   2  invocation / environment error
 */

import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import path from "node:path"

const PUBLISHED_PKG = "@loworbitstudio/visor"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, "..")
const LOCAL_REGISTRY = path.join(REPO_ROOT, "packages/cli/dist/registry.json")

// ─── pure helpers (unit-tested) ──────────────────────────────────────────────

/**
 * Compare two bundled registries (the JSON written by build-registry.ts).
 *
 * @param {{ items: Array<{ name: string, files: Array<{ path: string, content: string }> }> }} local
 * @param {{ items: Array<{ name: string, files: Array<{ path: string, content: string }> }> }} published
 * @returns {{
 *   drifts: Array<{ name: string, kind: 'content' | 'missing-in-published', files: string[] }>,
 *   warnings: Array<{ name: string, kind: 'removed-in-source', files: string[] }>
 * }}
 */
export function computeDrift(local, published) {
  const localByName = new Map(local.items.map((i) => [i.name, i]))
  const pubByName = new Map(published.items.map((i) => [i.name, i]))

  const drifts = []
  const warnings = []

  for (const [name, localItem] of localByName) {
    const pubItem = pubByName.get(name)
    if (!pubItem) {
      drifts.push({
        name,
        kind: "missing-in-published",
        files: localItem.files.map((f) => f.path),
      })
      continue
    }
    const pubFilesByPath = new Map(pubItem.files.map((f) => [f.path, f]))
    const driftedFiles = []
    for (const lf of localItem.files) {
      const pf = pubFilesByPath.get(lf.path)
      if (!pf || pf.content !== lf.content) {
        driftedFiles.push(lf.path)
      }
    }
    if (driftedFiles.length > 0) {
      drifts.push({ name, kind: "content", files: driftedFiles })
    }
  }

  for (const [name, pubItem] of pubByName) {
    if (!localByName.has(name)) {
      warnings.push({
        name,
        kind: "removed-in-source",
        files: pubItem.files.map((f) => f.path),
      })
    }
  }

  // Stable ordering — easier diffing across runs.
  drifts.sort((a, b) => a.name.localeCompare(b.name))
  warnings.sort((a, b) => a.name.localeCompare(b.name))
  return { drifts, warnings }
}

/**
 * Render a maintainer-facing report. Returned as a string so tests can
 * snapshot it without capturing stdout.
 */
export function formatReport({ drifts, warnings, publishedVersion, localItemCount }) {
  const lines = []
  if (drifts.length === 0) {
    lines.push(
      `✓ No publish drift. ${localItemCount} primitives match @loworbitstudio/visor@${publishedVersion}.`,
    )
  } else {
    const fileCount = drifts.reduce((sum, d) => sum + d.files.length, 0)
    lines.push(
      `✗ Publish drift detected (${drifts.length} primitives, ${fileCount} files):`,
    )
    for (const d of drifts) {
      const label =
        d.kind === "missing-in-published"
          ? "missing from published registry"
          : "content drift"
      lines.push(`  • ${d.name} — ${label}`)
      for (const f of d.files) {
        lines.push(`      - ${f}`)
      }
    }
    lines.push(`Latest published: @loworbitstudio/visor@${publishedVersion}`)
    lines.push(
      `Resolution: cut a new @loworbitstudio/visor release that includes the drifted primitives.`,
    )
  }
  if (warnings.length > 0) {
    lines.push("")
    lines.push(
      `⚠ ${warnings.length} primitive${warnings.length === 1 ? "" : "s"} present in published registry but not in source (likely removed locally, not yet re-published):`,
    )
    for (const w of warnings) {
      lines.push(`  • ${w.name}`)
    }
  }
  return lines.join("\n")
}

export function parseArgs(argv) {
  const out = { json: false, version: null, localTarballDir: null, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") out.json = true
    else if (a === "--help" || a === "-h") out.help = true
    else if (a === "--version") out.version = argv[++i]
    else if (a === "--local") out.localTarballDir = argv[++i]
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

const HELP_TEXT = `visor-publish-smoke — compare local registry against the latest published @loworbitstudio/visor

Usage:
  node scripts/visor-publish-smoke.mjs [options]

Options:
  --json                Emit a JSON report instead of human-readable text.
  --version <semver>    Compare against a specific published version (default: latest).
  --local <path>        Read published registry from <path>/dist/registry.json (no npm fetch).
  -h, --help            Show this help.

Exit codes:
  0  No drift detected (warnings allowed).
  1  Drift detected.
  2  Invocation or environment error.
`

// ─── I/O (not unit-tested; smoke-tested in CI) ────────────────────────────────

function resolveLatestVersion() {
  const r = spawnSync("npm", ["view", PUBLISHED_PKG, "version"], {
    encoding: "utf8",
  })
  if (r.status !== 0) {
    throw new Error(
      `Failed to query npm for latest version of ${PUBLISHED_PKG}: ${r.stderr.trim()}`,
    )
  }
  return r.stdout.trim()
}

function fetchPublishedRegistry(version) {
  const tmp = mkdtempSync(path.join(tmpdir(), "visor-publish-smoke-"))
  try {
    const pack = spawnSync(
      "npm",
      ["pack", `${PUBLISHED_PKG}@${version}`, "--silent"],
      { encoding: "utf8", cwd: tmp },
    )
    if (pack.status !== 0) {
      throw new Error(
        `npm pack ${PUBLISHED_PKG}@${version} failed: ${pack.stderr.trim()}`,
      )
    }
    const tarball = pack.stdout
      .trim()
      .split("\n")
      .find((line) => line.endsWith(".tgz"))
    if (!tarball) {
      throw new Error(
        `npm pack produced no .tgz filename. stdout: ${pack.stdout}`,
      )
    }
    const tar = spawnSync(
      "tar",
      ["-xzf", tarball, "package/dist/registry.json"],
      { cwd: tmp, encoding: "utf8" },
    )
    if (tar.status !== 0) {
      throw new Error(
        `tar extraction failed: ${tar.stderr.trim()}. The published package may no longer ship dist/registry.json.`,
      )
    }
    const registryPath = path.join(tmp, "package/dist/registry.json")
    if (!existsSync(registryPath)) {
      throw new Error(`Expected ${registryPath} after extracting ${tarball}.`)
    }
    return JSON.parse(readFileSync(registryPath, "utf8"))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

function loadLocalRegistry() {
  if (!existsSync(LOCAL_REGISTRY)) {
    throw new Error(
      `Local registry not built: ${path.relative(REPO_ROOT, LOCAL_REGISTRY)} is missing. Run \`npm run build -w packages/cli\` first.`,
    )
  }
  return JSON.parse(readFileSync(LOCAL_REGISTRY, "utf8"))
}

async function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${HELP_TEXT}`)
    process.exit(2)
  }

  if (opts.help) {
    process.stdout.write(HELP_TEXT)
    process.exit(0)
  }

  let local
  let published
  let publishedVersion
  try {
    local = loadLocalRegistry()
    if (opts.localTarballDir) {
      published = JSON.parse(
        readFileSync(
          path.join(opts.localTarballDir, "dist/registry.json"),
          "utf8",
        ),
      )
      publishedVersion = opts.version ?? "local"
    } else {
      publishedVersion = opts.version ?? resolveLatestVersion()
      published = fetchPublishedRegistry(publishedVersion)
    }
  } catch (err) {
    process.stderr.write(`${err.message}\n`)
    process.exit(2)
  }

  const { drifts, warnings } = computeDrift(local, published)

  if (opts.json) {
    const exitCode = drifts.length > 0 ? 1 : 0
    process.stdout.write(
      JSON.stringify(
        {
          publishedPackage: PUBLISHED_PKG,
          publishedVersion,
          localItemCount: local.items.length,
          publishedItemCount: published.items.length,
          drifts,
          warnings,
          status: exitCode === 0 ? "ok" : "drift",
        },
        null,
        2,
      ) + "\n",
    )
    process.exit(exitCode)
  }

  process.stdout.write(
    formatReport({
      drifts,
      warnings,
      publishedVersion,
      localItemCount: local.items.length,
    }) + "\n",
  )
  process.exit(drifts.length > 0 ? 1 : 0)
}

const isDirectInvocation =
  process.argv[1] && path.resolve(process.argv[1]) === __filename
if (isDirectInvocation) {
  main().catch((err) => {
    process.stderr.write(`${err.stack ?? err.message}\n`)
    process.exit(2)
  })
}
