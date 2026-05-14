#!/usr/bin/env node
/**
 * Visor publish-gate audit.
 *
 * When `visor-publish-smoke` detects drift between the locally-built registry
 * and the latest published `@loworbitstudio/visor` tarball, this script maps
 * each drifted file back to the most recent commit that touched it, extracts
 * the `VI-N` reference and PR number from that commit subject, and
 * (optionally) posts a GitHub comment on each affected PR.
 *
 * Closes the loop on the failure pattern documented in VI-306 — Linear "Done"
 * tickets whose code shipped to `main` but never made it into the published
 * registry. The PR is the durable, public artifact that connects a commit on
 * `main` to the reviewer who landed it; commenting there keeps the governance
 * signal on the same public surface as the change itself, with no extra
 * secrets in CI. See also: docs/wisdom/W020-publish-coordination-drift.md
 *
 * Usage:
 *   node scripts/visor-publish-audit.mjs                 human report against latest published
 *   node scripts/visor-publish-audit.mjs --json          machine-readable output
 *   node scripts/visor-publish-audit.mjs --post-comments post a GitHub comment on each affected PR
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
 * Extract the trailing GitHub PR number from a squash-merge commit subject.
 * Visor commits all land via squash merge, which appends ` (#N)` to the
 * subject — so the trailing form is the reliable indicator. Returns `null`
 * when the subject doesn't follow the convention (direct pushes, manual
 * commits, etc).
 */
export function extractPRNumber(message) {
  if (!message) return null
  const m = /\(#(\d+)\)\s*$/.exec(message)
  return m ? Number(m[1]) : null
}

/**
 * Map drifted primitives to the Linear tickets and GitHub PRs that
 * introduced them. Each primitive's "touching commit" is the most recent
 * commit that touched any of its drifted files.
 *
 * @param {Array<{ name: string, files: string[] }>} drifts
 * @param {Array<{ sha: string, subject: string, files: string[] }>} commits
 * @returns {{
 *   findings: Array<{
 *     ticketId: string,
 *     primitives: Array<{ name: string, sha: string, subject: string, prNumber: number | null }>
 *   }>,
 *   orphans: Array<{ name: string, reason: 'no-touching-commit' | 'no-vi-ref' }>
 * }}
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
    const prNumber = extractPRNumber(touchingCommit.subject)
    for (const ref of refs) {
      if (!findingsByTicket.has(ref)) {
        findingsByTicket.set(ref, { ticketId: ref, primitives: [] })
      }
      findingsByTicket.get(ref).primitives.push({
        name: drift.name,
        sha: touchingCommit.sha.slice(0, 7),
        subject: touchingCommit.subject,
        prNumber,
      })
    }
  }

  const findings = [...findingsByTicket.values()].sort((a, b) =>
    a.ticketId.localeCompare(b.ticketId, undefined, { numeric: true }),
  )
  return { findings, orphans }
}

/**
 * Re-group findings by PR number, dropping anything that lacks one. This is
 * the structure the GitHub comment poster iterates over — one comment per
 * affected PR, listing every primitive that drifted via that PR.
 */
export function groupByPR(findings) {
  const byPR = new Map()
  for (const f of findings) {
    for (const p of f.primitives) {
      if (p.prNumber == null) continue
      if (!byPR.has(p.prNumber)) {
        byPR.set(p.prNumber, {
          prNumber: p.prNumber,
          ticketIds: new Set(),
          primitives: [],
        })
      }
      const entry = byPR.get(p.prNumber)
      entry.ticketIds.add(f.ticketId)
      entry.primitives.push(p)
    }
  }
  return [...byPR.values()]
    .map((e) => ({
      prNumber: e.prNumber,
      ticketIds: [...e.ticketIds].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
      primitives: e.primitives,
    }))
    .sort((a, b) => a.prNumber - b.prNumber)
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
        const prSuffix = p.prNumber != null ? `  PR #${p.prNumber}` : ""
        lines.push(`    • ${p.name}  (${p.sha})${prSuffix}  ${p.subject}`)
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
 * Render the GitHub PR comment body for a single affected PR. Plain-text
 * traceability marker (`Publish-audit marker: <name>@<sha>`) included for
 * grep-ability — idempotency is not enforced.
 */
export function formatGitHubPRComment(prFinding, publishedVersion) {
  const lines = []
  const ticketList = prFinding.ticketIds.join(", ")
  lines.push(
    `**Publish-audit signal** — this PR landed (closing ${ticketList}), but its ${prFinding.primitives.length === 1 ? "primitive is" : "primitives are"} not present in the latest published \`@loworbitstudio/visor@${publishedVersion}\`.`,
  )
  lines.push("")
  lines.push("Drifted primitives:")
  for (const p of prFinding.primitives) {
    lines.push(`- \`${p.name}\` — \`${p.sha}\` (${p.subject})`)
  }
  lines.push("")
  lines.push(
    `Consumers of \`npx visor add <name>\` will still receive the older source until a new release ships. See [W020](https://github.com/low-orbit-studio/visor/blob/main/docs/wisdom/W020-publish-coordination-drift.md) for the resolution path.`,
  )
  lines.push("")
  for (const p of prFinding.primitives) {
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

/**
 * Parse owner/repo from `git remote get-url origin`. Supports both HTTPS and
 * SSH URLs. Returns `null` if the remote doesn't resolve to a GitHub repo.
 */
export function parseRepoFromRemoteUrl(remoteUrl) {
  if (!remoteUrl) return null
  const trimmed = remoteUrl.trim()
  // https://github.com/owner/repo(.git)?
  const https = /^https?:\/\/[^/]+\/([^/]+)\/([^/]+?)(?:\.git)?$/.exec(trimmed)
  if (https) return { owner: https[1], repo: https[2] }
  // git@github.com:owner/repo(.git)?
  const ssh = /^[^:]+:([^/]+)\/([^/]+?)(?:\.git)?$/.exec(trimmed)
  if (ssh) return { owner: ssh[1], repo: ssh[2] }
  return null
}

const HELP_TEXT = `visor-publish-audit — map drifted registry primitives back to the PRs that landed them

Usage:
  node scripts/visor-publish-audit.mjs [options]

Options:
  --json                Emit a JSON report instead of human-readable text.
  --post-comments       Post a GitHub comment on each affected PR (requires GITHUB_TOKEN
                        with pull-requests:write).
  --version <semver>    Audit against a specific published version (default: latest).
  --local <path>        Read published registry from <path>/dist/registry.json (no npm fetch).
  -h, --help            Show this help.

Exit codes:
  0  No drift detected — nothing to audit.
  1  Drift detected — audit findings emitted (and GitHub PR comments posted if --post-comments).
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

function resolveRepo() {
  // Prefer the GitHub Actions env vars when present (always set in CI), fall
  // back to `git remote get-url origin` for local invocations.
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/")
    if (owner && repo) return { owner, repo }
  }
  const r = spawnSync("git", ["remote", "get-url", "origin"], {
    encoding: "utf8",
    cwd: REPO_ROOT,
  })
  if (r.status !== 0) return null
  return parseRepoFromRemoteUrl(r.stdout)
}

async function postGitHubPRComment({ owner, repo, prNumber, body, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "visor-publish-audit",
    },
    body: JSON.stringify({ body }),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => "")
    return { ok: false, error: `HTTP ${r.status}: ${text}` }
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
  const prGroups = groupByPR(findings)

  if (opts.postComments) {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      process.stderr.write(
        `GITHUB_TOKEN not set — refusing to --post-comments.\n`,
      )
      process.exit(2)
    }
    const repo = resolveRepo()
    if (!repo) {
      process.stderr.write(
        `Could not resolve owner/repo from GITHUB_REPOSITORY or origin remote.\n`,
      )
      process.exit(2)
    }
    for (const group of prGroups) {
      const body = formatGitHubPRComment(group, publishedVersion)
      const r = await postGitHubPRComment({
        owner: repo.owner,
        repo: repo.repo,
        prNumber: group.prNumber,
        body,
        token,
      })
      if (r.ok) {
        process.stderr.write(`  posted comment on PR #${group.prNumber}\n`)
      } else {
        process.stderr.write(
          `  failed to post on PR #${group.prNumber}: ${r.error}\n`,
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
          prGroups,
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
