#!/usr/bin/env node
/**
 * Visor publish-gate audit.
 *
 * When `visor-publish-smoke` detects drift between the locally-built registry
 * and the latest published `@loworbitstudio/visor` tarball, this script maps
 * each drifted file back to the most recent commit that touched it, extracts
 * the `VI-N` references from those commits, and (optionally) posts a Linear
 * comment on each affected ticket.
 *
 * Closes the loop on the failure pattern documented in VI-306 — Linear "Done"
 * tickets whose code shipped to `main` but never made it into the published
 * registry. See also: docs/wisdom/W020-publish-coordination-drift.md
 *
 * Usage:
 *   node scripts/visor-publish-audit.mjs                 human report against latest published
 *   node scripts/visor-publish-audit.mjs --json          machine-readable output
 *   node scripts/visor-publish-audit.mjs --post-comments post a Linear comment per VI-N
 *   node scripts/visor-publish-audit.mjs --version <semver>
 *   node scripts/visor-publish-audit.mjs --local <path>
 *
 * Exit codes:
 *   0  no drift
 *   1  drift detected (audit findings emitted)
 *   2  invocation / environment error
 *
 * Process invocation is via spawnSync with an args array — no shell expansion,
 * no command-injection surface.
 */

import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { computeDrift } from "./visor-publish-smoke.mjs"

const PUBLISHED_PKG = "@loworbitstudio/visor"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, "..")
const LOCAL_REGISTRY = path.join(REPO_ROOT, "packages/cli/dist/registry.json")
const REGISTRY_SOURCE_PREFIX = "packages/cli/src/registry/"

// pure helpers (unit-tested)

/**
 * Extract VI-N references from a commit subject line. Case-insensitive,
 * dedup-preserving order.
 */
export function extractVIRefs(message) {
  if (!message) return []
  const seen = new Set()
  const out = []
  const re = /\bVI-(\d+)\b/gi
  let m
  while ((m = re.exec(message)) !== null) {
    const ref = `VI-${m[1]}`
    if (!seen.has(ref)) {
      seen.add(ref)
      out.push(ref)
    }
  }
  return out
}

/**
 * Map drifted primitives to the Linear tickets that introduced them.
 *
 * @param {Array<{ name: string, files: string[] }>} drifts
 * @param {Array<{ sha: string, subject: string, files: string[] }>} commits
 */
export function mapDriftToTickets(drifts, commits) {
  const findingsByTicket = new Map()
  const orphans = []

  for (const drift of drifts) {
    const driftFiles = new Set(drift.files)
    const touchingCommit = commits.find((c) =>
      c.files.some(
        (f) =>
          driftFiles.has(f) ||
          [...driftFiles].some((df) => f.endsWith(path.basename(df))),
      ),
    )
    if (!touchingCommit) {
      orphans.push({ name: drift.name, reason: "no-touching-commit" })
      continue
    }
    const refs = extractVIRefs(touchingCommit.subject)
    if (refs.length === 0) {
      orphans.push({ name: drift.name, reason: "no-vi-ref" })
      continue
    }
    for (const ref of refs) {
      if (!findingsByTicket.has(ref)) {
        findingsByTicket.set(ref, { ticketId: ref, primitives: [] })
      }
      findingsByTicket.get(ref).primitives.push({
        name: drift.name,
        sha: touchingCommit.sha.slice(0, 7),
        subject: touchingCommit.subject,
      })
    }
  }

  const findings = [...findingsByTicket.values()].sort((a, b) =>
    a.ticketId.localeCompare(b.ticketId, undefined, { numeric: true }),
  )
  return { findings, orphans }
}

export function formatAuditReport({ findings, orphans, publishedVersion }) {
  const lines = []
  if (findings.length === 0 && orphans.length === 0) {
    lines.push(
      `✓ No publish-audit findings. (Drift, if any, did not map to any VI- tickets.)`,
    )
    return lines.join("\n")
  }
  if (findings.length > 0) {
    lines.push(
      `Publish audit — ${findings.length} VI- ticket${findings.length === 1 ? "" : "s"} caught between Linear "Done" and the published @loworbitstudio/visor@${publishedVersion}:`,
    )
    for (const f of findings) {
      lines.push("")
      lines.push(`  ${f.ticketId}`)
      for (const p of f.primitives) {
        lines.push(`    • ${p.name}  (${p.sha})  ${p.subject}`)
      }
    }
  }
  if (orphans.length > 0) {
    lines.push("")
    lines.push(
      `⚠ ${orphans.length} drifted primitive${orphans.length === 1 ? "" : "s"} could not be mapped to a VI- ticket:`,
    )
    for (const o of orphans) {
      const reasonLabel =
        o.reason === "no-touching-commit"
          ? "no recent commit touched its source files"
          : "the touching commit had no VI-N reference"
      lines.push(`  • ${o.name} — ${reasonLabel}`)
    }
  }
  if (findings.length > 0) {
    lines.push("")
    lines.push(
      `Resolution: cut a new @loworbitstudio/visor release that includes the drifted primitives (see W020), then the next smoke run will clear the audit.`,
    )
  }
  return lines.join("\n")
}

/**
 * Render the Linear comment body for a single VI- ticket finding.
 * Plain-text traceability marker (`Publish-audit marker: <name>@<sha>`) for
 * grep-ability — idempotency is not enforced.
 */
export function formatLinearComment(finding, publishedVersion) {
  const lines = []
  lines.push(
    `**Publish-audit signal** — this ticket is marked Done in Linear, but ${finding.primitives.length === 1 ? "its primitive is" : "its primitives are"} not present in the latest published \`@loworbitstudio/visor@${publishedVersion}\`.`,
  )
  lines.push("")
  lines.push("Drifted primitives:")
  for (const p of finding.primitives) {
    lines.push(`- \`${p.name}\` — ${p.subject} (\`${p.sha}\`)`)
  }
  lines.push("")
  lines.push(
    `Consumers of \`npx visor add <name>\` will still receive the older source until a new release ships. See [W020](https://github.com/low-orbit-studio/visor/blob/main/docs/wisdom/W020-publish-coordination-drift.md) for the resolution path.`,
  )
  lines.push("")
  for (const p of finding.primitives) {
    lines.push(`Publish-audit marker: ${p.name}@${p.sha}`)
  }
  return lines.join("\n")
}

export function parseArgs(argv) {
  const out = {
    json: false,
    postComments: false,
    version: null,
    localTarballDir: null,
    help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") out.json = true
    else if (a === "--post-comments") out.postComments = true
    else if (a === "--help" || a === "-h") out.help = true
    else if (a === "--version") out.version = argv[++i]
    else if (a === "--local") out.localTarballDir = argv[++i]
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

const HELP_TEXT = `visor-publish-audit — map drifted registry primitives back to VI- Linear tickets

Usage:
  node scripts/visor-publish-audit.mjs [options]

Options:
  --json                Emit a JSON report instead of human-readable text.
  --post-comments       Post a Linear comment per affected VI- ticket (requires LINEAR_API_KEY).
  --version <semver>    Audit against a specific published version (default: latest).
  --local <path>        Read published registry from <path>/dist/registry.json (no npm fetch).
  -h, --help            Show this help.

Exit codes:
  0  No drift detected — nothing to audit.
  1  Drift detected — audit findings emitted (and Linear comments posted if --post-comments).
  2  Invocation or environment error.
`

// I/O (smoke-tested in CI, not unit-tested)

function loadLocalRegistry() {
  if (!existsSync(LOCAL_REGISTRY)) {
    throw new Error(
      `Local registry not built: ${path.relative(REPO_ROOT, LOCAL_REGISTRY)} is missing. Run \`npm run build -w packages/cli\` first.`,
    )
  }
  return JSON.parse(readFileSync(LOCAL_REGISTRY, "utf8"))
}

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
  const tmp = mkdtempSync(path.join(tmpdir(), "visor-publish-audit-"))
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
      throw new Error(`npm pack produced no .tgz filename. stdout: ${pack.stdout}`)
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

/**
 * For each drifted file, find the most recent commit that touched it and
 * return its SHA + subject + the list of files it touched.
 */
function loadTouchingCommits(drifts) {
  const driftFiles = new Set()
  for (const d of drifts) {
    for (const f of d.files) driftFiles.add(f)
  }

  const commits = new Map()

  for (const driftedFile of driftFiles) {
    const candidates = [driftedFile, `${REGISTRY_SOURCE_PREFIX}${driftedFile}`]
    let sha = null
    let subject = null
    for (const candidate of candidates) {
      const r = spawnSync(
        "git",
        ["log", "-1", "--format=%H%n%s", "--", candidate],
        { encoding: "utf8", cwd: REPO_ROOT },
      )
      if (r.status === 0 && r.stdout.trim().length > 0) {
        const [shaLine, ...subjectLines] = r.stdout.trim().split("\n")
        sha = shaLine
        subject = subjectLines.join("\n")
        break
      }
    }
    if (!sha) continue

    if (!commits.has(sha)) {
      const filesR = spawnSync(
        "git",
        ["show", "--name-only", "--format=", sha],
        { encoding: "utf8", cwd: REPO_ROOT },
      )
      const files =
        filesR.status === 0
          ? filesR.stdout
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
          : []
      commits.set(sha, { sha, subject, files })
    }
  }

  return [...commits.values()]
}

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql"

async function linearGraphQL(query, variables) {
  const r = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.LINEAR_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => "")
    return { ok: false, error: `HTTP ${r.status}: ${text}` }
  }
  const json = await r.json()
  if (json.errors) {
    return { ok: false, error: JSON.stringify(json.errors) }
  }
  return { ok: true, data: json.data }
}

async function postLinearComment(ticketIdentifier, body) {
  // Linear's commentCreate requires the issue's UUID, not the human
  // identifier. The `issue(id:)` query accepts either, so we resolve first.
  const lookup = await linearGraphQL(
    `query($id: String!) { issue(id: $id) { id } }`,
    { id: ticketIdentifier },
  )
  if (!lookup.ok) return lookup
  const uuid = lookup.data?.issue?.id
  if (!uuid) {
    return {
      ok: false,
      error: `Issue ${ticketIdentifier} not found in Linear.`,
    }
  }
  const create = await linearGraphQL(
    `mutation($input: CommentCreateInput!) {
       commentCreate(input: $input) { success }
     }`,
    { input: { issueId: uuid, body } },
  )
  if (!create.ok) return create
  if (!create.data?.commentCreate?.success) {
    return {
      ok: false,
      error: `commentCreate returned success=false for ${ticketIdentifier}`,
    }
  }
  return { ok: true }
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

  const { drifts } = computeDrift(local, published)

  if (drifts.length === 0) {
    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          {
            publishedPackage: PUBLISHED_PKG,
            publishedVersion,
            findings: [],
            orphans: [],
            status: "ok",
          },
          null,
          2,
        ) + "\n",
      )
    } else {
      process.stdout.write(
        `✓ No publish drift against @loworbitstudio/visor@${publishedVersion} — nothing to audit.\n`,
      )
    }
    process.exit(0)
  }

  const commits = loadTouchingCommits(drifts)
  const { findings, orphans } = mapDriftToTickets(drifts, commits)

  if (opts.postComments) {
    if (!process.env.LINEAR_API_KEY) {
      process.stderr.write(
        `LINEAR_API_KEY not set — refusing to --post-comments.\n`,
      )
      process.exit(2)
    }
    for (const finding of findings) {
      const body = formatLinearComment(finding, publishedVersion)
      const r = await postLinearComment(finding.ticketId, body)
      if (r.ok) {
        process.stderr.write(`  posted comment on ${finding.ticketId}\n`)
      } else {
        process.stderr.write(
          `  failed to post on ${finding.ticketId}: ${r.error}\n`,
        )
      }
    }
  }

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          publishedPackage: PUBLISHED_PKG,
          publishedVersion,
          findings,
          orphans,
          status: "drift",
        },
        null,
        2,
      ) + "\n",
    )
  } else {
    process.stdout.write(
      formatAuditReport({ findings, orphans, publishedVersion }) + "\n",
    )
  }
  process.exit(1)
}

const isDirectInvocation =
  process.argv[1] && path.resolve(process.argv[1]) === __filename
if (isDirectInvocation) {
  main().catch((err) => {
    process.stderr.write(`${err.stack ?? err.message}\n`)
    process.exit(2)
  })
}
