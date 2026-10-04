#!/usr/bin/env node
/**
 * Visor publish-gate smoke test.
 *
 * Compares this repo's locally-built `packages/cli/dist/registry.json`
 * against the `dist/registry.json` shipped in the latest published
 * `@loworbitstudio/visor` tarball, and every file shipped by the other
 * published packages (visor-core, visor-theme-engine, visor-tailwind-preset)
 * against their latest tarballs (VI-649). Reports per-item / per-file
 * content drift.
 *
 * Catches the failure mode where a VI- ticket is marked Done in Linear
 * but the registry artifact has not landed in the published CLI — the
 * BO-12 / BO-13 / BO-26 pattern. See: docs/wisdom/W020-publish-coordination-drift.md
 *
 * Usage:
 *   node scripts/visor-publish-smoke.mjs            run against the latest published @loworbitstudio/visor
 *   node scripts/visor-publish-smoke.mjs --json     emit JSON instead of a human report
 *   node scripts/visor-publish-smoke.mjs --version <semver>   pin a specific published @loworbitstudio/visor version
 *   node scripts/visor-publish-smoke.mjs --local <path>       use a pre-extracted CLI tarball (testing; registry only)
 *   node scripts/visor-publish-smoke.mjs --help
 *
 * Exit codes:
 *   0  no drift (warnings allowed)
 *   1  drift detected
 *   2  invocation / environment error
 */

import {
  readFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  statSync,
  readdirSync,
} from "node:fs"
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

// ─── package artifacts (VI-649) ──────────────────────────────────────────────
//
// The registry comparison above covers `@loworbitstudio/visor` only. The other
// published packages ship build output, not a registry, so their comparison
// artifact is **every file the tarball ships** — read from the package's own
// `files` field, so a newly listed file is covered without touching this
// script. Their builds are reproducible: tailwind-preset 0.2.0 rebuilds
// byte-for-byte identical to its tarball, chunks included. The one source of
// non-identity is bundler content hashes in file names (`chunk-C2DUPZVY.js`,
// `types-ZPTjTL_-.d.ts`), which change whenever any bundled byte changes —
// they are normalised to `[hash]` in both paths and contents before comparing.
//
// `sources` names what the artifact is generated *from*. dist/ is gitignored,
// so the audit walks these paths to find the PR that landed the drift.

export const PACKAGE_ARTIFACTS = [
  {
    name: "@loworbitstudio/visor-core",
    dir: "packages/tokens",
    // The theme CSS is generated by the engine from the stock theme files.
    sources: ["packages/tokens/src/", "themes/", "packages/theme-engine/src/"],
  },
  {
    name: "@loworbitstudio/visor-theme-engine",
    dir: "packages/theme-engine",
    sources: ["packages/theme-engine/src/"],
  },
  {
    name: "@loworbitstudio/visor-tailwind-preset",
    dir: "packages/tailwind-preset",
    sources: ["packages/tailwind-preset/src/", "packages/tailwind-preset/scripts/"],
  },
]

// npm always packs these; they are not build output (package.json carries the
// version, which differs by design until the release lands).
const ALWAYS_PACKED = new Set(["package.json", "README.md"])

const HASHED_NAME = /^(.+)-([A-Za-z0-9_-]{8})\.(js|cjs|mjs|d\.ts|d\.cts|d\.mts)$/

/**
 * The bundler-hash stem of a file name (`chunk-C2DUPZVY` from
 * `chunk-C2DUPZVY.js`) and its placeholder (`chunk-[hash]`), or null. A hash must contain an uppercase letter or a
 * digit, so an ordinary name like `defaults.js` is never mistaken for one.
 */
export function hashedStem(basename) {
  const m = HASHED_NAME.exec(basename)
  if (!m || !/[A-Z0-9]/.test(m[2])) return null
  return { stem: `${m[1]}-${m[2]}`, placeholder: `${m[1]}-[hash]` }
}

/**
 * Compare two packaged file trees, each a `Map<relativePath, content>`.
 * Hashed file names are normalised in both paths and contents; files that
 * normalise to the same path are compared as a set.
 *
 * @param {Map<string, string>} local
 * @param {Map<string, string>} published
 * @returns {{
 *   drifts: Array<{ path: string, kind: 'content' | 'missing-in-published' }>,
 *   warnings: Array<{ path: string, kind: 'removed-in-source' }>
 * }}
 */
export function computePackageDrift(local, published) {
  const stems = new Map()
  for (const tree of [local, published]) {
    for (const p of tree.keys()) {
      const hashed = hashedStem(path.posix.basename(p))
      if (hashed) stems.set(hashed.stem, hashed.placeholder)
    }
  }
  const normaliseText = (text) => {
    let out = text
    for (const [stem, placeholder] of stems) out = out.split(stem).join(placeholder)
    return out
  }
  const group = (tree) => {
    const byPath = new Map()
    for (const [p, content] of tree) {
      const key = normaliseText(p)
      if (!byPath.has(key)) byPath.set(key, [])
      byPath.get(key).push(normaliseText(content))
    }
    for (const list of byPath.values()) list.sort()
    return byPath
  }

  const localByPath = group(local)
  const pubByPath = group(published)
  const drifts = []
  const warnings = []

  for (const [p, contents] of localByPath) {
    const pub = pubByPath.get(p)
    if (!pub) drifts.push({ path: p, kind: "missing-in-published" })
    else if (
      pub.length !== contents.length ||
      pub.some((c, i) => c !== contents[i])
    ) {
      drifts.push({ path: p, kind: "content" })
    }
  }
  for (const p of pubByPath.keys()) {
    if (!localByPath.has(p)) warnings.push({ path: p, kind: "removed-in-source" })
  }

  drifts.sort((a, b) => a.path.localeCompare(b.path))
  warnings.sort((a, b) => a.path.localeCompare(b.path))
  return { drifts, warnings }
}

/**
 * Render the per-package section of the report.
 *
 * @param {Array<{ name: string, publishedVersion: string, fileCount: number,
 *   drifts: Array<{ path: string, kind: string }>,
 *   warnings: Array<{ path: string }> }>} packages
 */
export function formatPackageReport(packages) {
  const lines = []
  for (const pkg of packages) {
    if (lines.length > 0) lines.push("")
    const ref = `${pkg.name}@${pkg.publishedVersion}`
    if (pkg.drifts.length === 0) {
      lines.push(`✓ No publish drift. ${pkg.fileCount} files match ${ref}.`)
    } else {
      lines.push(`✗ Publish drift detected in ${ref} (${pkg.drifts.length} files):`)
      for (const d of pkg.drifts) {
        const label =
          d.kind === "missing-in-published" ? "missing from published tarball" : "content drift"
        lines.push(`  • ${d.path} — ${label}`)
      }
      lines.push(`Resolution: cut a new ${pkg.name} release.`)
    }
    if (pkg.warnings.length > 0) {
      lines.push(
        `⚠ ${pkg.warnings.length} file${pkg.warnings.length === 1 ? "" : "s"} in ${ref} but not in the local build (likely removed locally, not yet re-published):`,
      )
      for (const w of pkg.warnings) lines.push(`  • ${w.path}`)
    }
  }
  return lines.join("\n")
}

/**
 * Decide whether the local registry is stale relative to source files.
 *
 * Pure function — caller does the stat work and passes mtimes in. Returns
 * the newest source file (by mtime) if it's newer than the registry, else
 * null. Ties (== mtime) are treated as fresh: a build that completes in
 * the same millisecond as a source touch is indistinguishable from a
 * build that happened after.
 *
 * @param {number} registryMtimeMs
 * @param {Array<{ path: string, mtimeMs: number }>} sources
 * @returns {{ stale: boolean, newerFile: string | null, newerMtimeMs: number | null }}
 */
export function detectStaleRegistry(registryMtimeMs, sources) {
  let newerFile = null
  let newerMtimeMs = null
  for (const { path: p, mtimeMs } of sources) {
    if (mtimeMs > registryMtimeMs && (newerMtimeMs === null || mtimeMs > newerMtimeMs)) {
      newerFile = p
      newerMtimeMs = mtimeMs
    }
  }
  return { stale: newerFile !== null, newerFile, newerMtimeMs }
}

export function parseArgs(argv) {
  const out = {
    json: false,
    version: null,
    localTarballDir: null,
    help: false,
    skipStalenessCheck: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") out.json = true
    else if (a === "--help" || a === "-h") out.help = true
    else if (a === "--version") out.version = argv[++i]
    else if (a === "--local") out.localTarballDir = argv[++i]
    else if (a === "--skip-staleness-check") out.skipStalenessCheck = true
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

const HELP_TEXT = `visor-publish-smoke — compare local build output against the latest published packages

Checks @loworbitstudio/visor (registry.json, per primitive) and every file shipped by
${PACKAGE_ARTIFACTS.map((p) => p.name).join(", ")}.

Usage:
  node scripts/visor-publish-smoke.mjs [options]

Options:
  --json                     Emit a JSON report instead of human-readable text.
  --version <semver>         Compare the registry against a specific published
                             @loworbitstudio/visor version (default: latest). The other
                             packages always compare against their latest.
  --local <path>             Read published registry from <path>/dist/registry.json (no npm fetch).
                             Registry only — the other packages are skipped.
  --skip-staleness-check     Skip the local-registry staleness check. CI sets this after
                             running \`npm run build -w packages/cli\` in the prior step;
                             local invocations should not pass it.
  -h, --help                 Show this help.

Exit codes:
  0  No drift detected (warnings allowed).
  1  Drift detected.
  2  Invocation or environment error (includes stale local registry).
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

/**
 * Stat the source files that gate registry freshness:
 *   - every `files[].path` referenced inside the registry (the actual primitive
 *     source — if any of these change, registry content drifts)
 *   - every `.ts` file under `registry/` at repo root (the registry definitions
 *     — if any of these change, the set of items can drift)
 *   - the build-registry script itself
 *
 * @param {{ items: Array<{ files: Array<{ path: string }> }> }} registry
 * @returns {Array<{ path: string, mtimeMs: number }>}
 */
function collectRegistrySourceMtimes(registry) {
  const sources = []
  const seen = new Set()

  const pushPath = (relPath) => {
    if (seen.has(relPath)) return
    seen.add(relPath)
    const abs = path.join(REPO_ROOT, relPath)
    try {
      const s = statSync(abs)
      sources.push({ path: relPath, mtimeMs: s.mtimeMs })
    } catch {
      // Missing source files are reported by the build step, not here — staleness
      // check only cares about files that exist AND are newer than the registry.
    }
  }

  for (const item of registry.items ?? []) {
    for (const f of item.files ?? []) {
      if (f?.path) pushPath(f.path)
    }
  }

  const registryDefsDir = path.join(REPO_ROOT, "registry")
  try {
    for (const entry of readdirSync(registryDefsDir)) {
      if (entry.endsWith(".ts")) pushPath(path.join("registry", entry))
    }
  } catch {
    // No registry/ dir is itself an error, but it'll surface in the build step.
  }

  pushPath("packages/cli/src/generate/build-registry.ts")

  return sources
}

/**
 * Every file a package ships, as `Map<relativePath, content>`. `entries` is the
 * package's `files` field (local) or `["."]` (an extracted tarball). Dotfiles
 * are skipped — npm never packs `.DS_Store` and friends.
 */
function readPackedTree(root, entries) {
  const tree = new Map()
  const walk = (rel) => {
    const abs = path.join(root, rel)
    if (!existsSync(abs)) return
    if (statSync(abs).isDirectory()) {
      for (const entry of readdirSync(abs)) {
        if (!entry.startsWith(".")) walk(rel === "" ? entry : path.posix.join(rel, entry))
      }
    } else if (!ALWAYS_PACKED.has(rel)) {
      tree.set(rel, readFileSync(abs, "utf8"))
    }
  }
  for (const entry of entries) walk(entry.replace(/\/$/, "").replace(/^\.$/, ""))
  return tree
}

function resolveLatestPackageVersion(name) {
  const r = spawnSync("npm", ["view", name, "version"], { encoding: "utf8" })
  if (r.status !== 0) {
    throw new Error(`Failed to query npm for latest version of ${name}: ${r.stderr.trim()}`)
  }
  return r.stdout.trim()
}

function fetchPublishedTree(name, version) {
  const tmp = mkdtempSync(path.join(tmpdir(), "visor-publish-smoke-"))
  try {
    const pack = spawnSync("npm", ["pack", `${name}@${version}`, "--silent"], {
      encoding: "utf8",
      cwd: tmp,
    })
    if (pack.status !== 0) {
      throw new Error(`npm pack ${name}@${version} failed: ${pack.stderr.trim()}`)
    }
    const tarball = pack.stdout
      .trim()
      .split("\n")
      .find((line) => line.endsWith(".tgz"))
    if (!tarball) throw new Error(`npm pack produced no .tgz filename. stdout: ${pack.stdout}`)
    const tar = spawnSync("tar", ["-xzf", tarball], { cwd: tmp, encoding: "utf8" })
    if (tar.status !== 0) throw new Error(`tar extraction failed: ${tar.stderr.trim()}`)
    return readPackedTree(path.join(tmp, "package"), ["."])
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

/**
 * Compare each package in PACKAGE_ARTIFACTS against its latest published
 * tarball. Exported for the audit (VI-306), which maps each drifted package
 * back to the PR that landed it.
 *
 * @returns {Array<{ name: string, dir: string, sources: string[],
 *   publishedVersion: string, fileCount: number,
 *   drifts: Array<{ path: string, kind: string }>,
 *   warnings: Array<{ path: string, kind: string }> }>}
 */
export function checkPackages() {
  return PACKAGE_ARTIFACTS.map((pkg) => {
    const root = path.join(REPO_ROOT, pkg.dir)
    const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
    const local = readPackedTree(root, manifest.files ?? [])
    if (![...local.keys()].some((p) => p.startsWith("dist/"))) {
      throw new Error(
        `${pkg.name} is not built: ${pkg.dir}/dist is missing or empty. Run \`npm run build -w ${pkg.dir}\` first.`,
      )
    }
    const publishedVersion = resolveLatestPackageVersion(pkg.name)
    const published = fetchPublishedTree(pkg.name, publishedVersion)
    return {
      ...pkg,
      publishedVersion,
      fileCount: local.size,
      ...computePackageDrift(local, published),
    }
  })
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
  let packages
  try {
    local = loadLocalRegistry()

    if (!opts.skipStalenessCheck) {
      const registryMtimeMs = statSync(LOCAL_REGISTRY).mtimeMs
      const sources = collectRegistrySourceMtimes(local)
      const { stale, newerFile } = detectStaleRegistry(registryMtimeMs, sources)
      if (stale) {
        throw new Error(
          `Local registry is stale: ${path.relative(REPO_ROOT, LOCAL_REGISTRY)} is older than ${newerFile}.\n` +
            `Run \`npm run build -w packages/cli\` to refresh it, then re-run the smoke.\n` +
            `(Pass --skip-staleness-check only if you just built the registry in the prior CI step.)`,
        )
      }
    }

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
    // --local is the offline registry-only mode; it has no tarballs to read.
    packages = opts.localTarballDir ? [] : checkPackages()
  } catch (err) {
    process.stderr.write(`${err.message}\n`)
    process.exit(2)
  }

  const { drifts, warnings } = computeDrift(local, published)
  const driftDetected = drifts.length > 0 || packages.some((p) => p.drifts.length > 0)
  const exitCode = driftDetected ? 1 : 0

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          publishedPackage: PUBLISHED_PKG,
          publishedVersion,
          localItemCount: local.items.length,
          publishedItemCount: published.items.length,
          drifts,
          warnings,
          packages: packages.map((p) => ({
            name: p.name,
            publishedVersion: p.publishedVersion,
            fileCount: p.fileCount,
            drifts: p.drifts,
            warnings: p.warnings,
            status: p.drifts.length > 0 ? "drift" : "ok",
          })),
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
  if (packages.length > 0) process.stdout.write("\n" + formatPackageReport(packages) + "\n")
  process.exit(exitCode)
}

const isDirectInvocation =
  process.argv[1] && path.resolve(process.argv[1]) === __filename
if (isDirectInvocation) {
  main().catch((err) => {
    process.stderr.write(`${err.stack ?? err.message}\n`)
    process.exit(2)
  })
}
