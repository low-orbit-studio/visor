#!/usr/bin/env node
/**
 * Daily release train (VI-852).
 *
 * Kit PRs merge to `main` as fast as ever; each one refreshes the changesets
 * "Version Packages" PR (release.yml). Once a day, at 5PM New York time, this
 * script merges that PR when it is a genuine release and its CI is green. The
 * merge lands on `main`, release.yml runs again on the push, and publishes.
 * Nothing open means nothing pending: the train exits 0 and does nothing.
 *
 * The acceptance rules port the playbook's `visor_release.py` (the path
 * `/lo-visor-release` uses): head `changeset-release/main`, base `main`, title
 * "Version Packages", an in-repo author, only changeset bookkeeping in the diff,
 * and every check completed and green. No checks at all is not green. A PR that
 * fails any rule, or CI still running at 5PM, exits 1 so the run turns red and
 * stale-version-packages-pr.yml opens the train-failure issue.
 *
 * Usage:
 *   node scripts/release-train.mjs --gate      # prints go=true|false (schedule hour gate)
 *   node scripts/release-train.mjs --dry-run   # verify and print the plan, never merge
 *   node scripts/release-train.mjs             # verify and merge
 *
 * Environment:
 *   GITHUB_REPOSITORY  owner/repo
 *   GITHUB_TOKEN       a PAT in CI (secrets.CHANGESETS_PAT): a merge made with the
 *                      built-in token would not trigger release.yml, so nothing would publish
 *   GITHUB_EVENT_NAME  only `schedule` and `workflow_dispatch` may merge; anything
 *                      else, including a local run, is a dry run
 *   SCHEDULE           the cron string that fired (github.event.schedule)
 */

import { fileURLToPath } from "node:url"
import path from "node:path"

export const RELEASE_BRANCH = "changeset-release/main"
export const BASE_BRANCH = "main"
export const TITLE_PREFIX = "Version Packages"
export const TRAIN_HOUR = 17
export const MERGE_EVENTS = new Set(["schedule", "workflow_dispatch"])

const OK_CONCLUSIONS = new Set(["success", "skipped", "neutral"])
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"])
const BLOCKING_MERGE_STATES = new Set(["dirty", "blocked", "behind", "draft"])
const CONSUMED_CHANGESET_RE = /^\.changeset\/[^/]+\.md$/
const MANIFEST_RE = /^packages\/[^/]+\/package\.json$/
const CHANGELOG_RE = /^packages\/[^/]+\/CHANGELOG\.md$/

// ---------------------------------------------------------------------------
// pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/** The hour in New York (0-23) at a given instant. */
export function nyHour(date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  )
}

/**
 * Is this run the 5PM one? Two crons fire (21:00 and 22:00 UTC) because GitHub
 * cron is UTC and New York shifts an hour with daylight saving. The gate reads
 * the cron that fired, not the clock, so a run GitHub queued late still counts.
 */
export function isTrainRun({ event, schedule, now = new Date() }) {
  if (event !== "schedule") return true
  const [minute, hour] = String(schedule ?? "").trim().split(/\s+/).map(Number)
  if (!Number.isInteger(minute) || !Number.isInteger(hour)) return false
  const firedAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute),
  )
  return nyHour(firedAt) === TRAIN_HOUR
}

/** Anything wearing either half of the release PR's costume; verifyPr is strict. */
export function selectCandidates(pulls = []) {
  return pulls.filter(
    (pr) => pr?.head?.ref === RELEASE_BRANCH || String(pr?.title ?? "").startsWith(TITLE_PREFIX),
  )
}

export function verifyPr(pr) {
  const out = []
  if (pr?.head?.ref !== RELEASE_BRANCH) out.push(`head branch is "${pr?.head?.ref}", not "${RELEASE_BRANCH}"`)
  if (pr?.base?.ref !== BASE_BRANCH) out.push(`base branch is "${pr?.base?.ref}", not "${BASE_BRANCH}"`)
  if (!String(pr?.title ?? "").startsWith(TITLE_PREFIX)) out.push(`title "${pr?.title}" does not start with "${TITLE_PREFIX}"`)
  if (pr?.draft) out.push("PR is a draft")
  if (pr?.state && pr.state !== "open") out.push(`PR state is "${pr.state}"`)
  if (!TRUSTED_ASSOCIATIONS.has(pr?.author_association)) {
    out.push(`author association "${pr?.author_association}" is not OWNER, MEMBER or COLLABORATOR`)
  }
  if (pr?.mergeable === false) out.push("GitHub reports the PR is not mergeable (conflicts)")
  if (BLOCKING_MERGE_STATES.has(pr?.mergeable_state)) out.push(`mergeable_state is "${pr.mergeable_state}"`)
  return out
}

/** A release PR only consumes changesets, bumps manifests and writes changelogs. */
export function verifyFiles(files = []) {
  if (files.length === 0) return ["PR changes no files, so there is nothing to release"]
  const out = []
  const names = files.map((f) => String(f?.filename ?? ""))
  const changesets = files.filter((f) => CONSUMED_CHANGESET_RE.test(f?.filename ?? ""))
  if (changesets.length === 0) out.push("PR consumes no .changeset/*.md, so no changes are pending")
  if (!names.some((n) => MANIFEST_RE.test(n))) out.push("PR bumps no packages/*/package.json, so nothing would publish")
  const foreign = names.filter(
    (n) => !CONSUMED_CHANGESET_RE.test(n) && !MANIFEST_RE.test(n) && !CHANGELOG_RE.test(n),
  )
  if (foreign.length) {
    out.push(`PR carries ${foreign.length} file(s) outside changeset bookkeeping (${foreign.slice(0, 6).join(", ")})`)
  }
  for (const f of changesets) {
    if (!["removed", "renamed"].includes(f.status)) out.push(`${f.filename} is "${f.status}"; a release only consumes changesets`)
  }
  return out
}

/** Fails closed: no checks is absence of evidence, and running is not green. */
export function verifyChecks(checkRuns = [], combinedStatus = null) {
  const out = []
  if (checkRuns.length === 0) out.push("no check runs on the head SHA, which is not green CI")
  const running = checkRuns.filter((c) => c.status !== "completed")
  if (running.length) out.push(`${running.length} check(s) still running (${running.map((c) => c.name).slice(0, 6).join(", ")})`)
  const bad = checkRuns.filter((c) => c.status === "completed" && !OK_CONCLUSIONS.has(c.conclusion))
  if (bad.length) out.push(`${bad.length} check(s) not green (${bad.map((c) => `${c.name}=${c.conclusion}`).slice(0, 6).join(", ")})`)
  if (combinedStatus?.statuses?.length && combinedStatus.state !== "success") {
    out.push(`combined commit status is "${combinedStatus.state}"`)
  }
  return out
}

/** The merge request body. The full head SHA makes GitHub refuse if the PR moved after verification. */
export function mergeBody(sha) {
  if (!/^[0-9a-f]{40}$/.test(String(sha))) throw new Error(`refusing to merge with SHA "${sha}": need the full 40-character head SHA`)
  return { merge_method: "squash", sha }
}

// ---------------------------------------------------------------------------
// GitHub REST
// ---------------------------------------------------------------------------

async function gh(pathname, { token, method = "GET", body } = {}) {
  console.log(`  ${method} ${pathname}`)
  const res = await fetch(`https://api.github.com${pathname}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "User-Agent": "visor-release-train",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${method} ${pathname} → HTTP ${res.status} ${text.slice(0, 300)}`)
  }
  return res.status === 204 ? null : res.json()
}

async function main() {
  const argv = process.argv.slice(2)
  const event = process.env.GITHUB_EVENT_NAME ?? "local"
  const schedule = process.env.SCHEDULE

  if (argv.includes("--gate")) {
    const go = isTrainRun({ event, schedule })
    console.error(`event=${event} schedule="${schedule ?? ""}" New York hour now=${nyHour(new Date())} → ${go ? "train runs" : "not the 5PM cron, skipping"}`)
    console.log(`go=${go}`)
    return
  }

  const repo = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  if (!repo) throw new Error("GITHUB_REPOSITORY is not set")
  const dryRun = argv.includes("--dry-run") || !MERGE_EVENTS.has(event)
  console.log(`Release train on ${repo} (event ${event}${dryRun ? ", dry run: nothing will be merged" : ""})`)

  const pulls = await gh(`/repos/${repo}/pulls?state=open&base=${BASE_BRANCH}&per_page=100`, { token })
  const candidates = selectCandidates(pulls)
  if (candidates.length === 0) {
    console.log("\nNo open Version Packages PR: no changesets are pending. Nothing to release.")
    return
  }
  if (candidates.length > 1) {
    throw new Error(`${candidates.length} PRs look like the release PR (${candidates.map((p) => `#${p.number}`).join(", ")}); refusing to pick one`)
  }

  const pr = await gh(`/repos/${repo}/pulls/${candidates[0].number}`, { token })
  const sha = pr.head.sha
  const files = await gh(`/repos/${repo}/pulls/${pr.number}/files?per_page=100`, { token })
  const { check_runs: checkRuns = [] } = await gh(`/repos/${repo}/commits/${sha}/check-runs?per_page=100`, { token })
  const combined = await gh(`/repos/${repo}/commits/${sha}/status`, { token })

  console.log(`\nCandidate: #${pr.number} "${pr.title}" at ${sha}`)
  console.log(`Files: ${files.map((f) => `${f.filename} (${f.status})`).join(", ")}`)
  console.log(`Checks: ${checkRuns.length} run(s), combined status ${combined?.state ?? "none"}`)

  const refusals = [...verifyPr(pr), ...verifyFiles(files), ...verifyChecks(checkRuns, combined)]
  if (refusals.length) {
    console.log(`\nREFUSED: #${pr.number} will not be merged today.`)
    for (const r of refusals) console.log(`  - ${r}`)
    process.exitCode = 1
    return
  }

  const body = mergeBody(sha)
  if (dryRun) {
    console.log(`\nDRY RUN: would squash-merge #${pr.number} at ${sha}. Nothing was merged.`)
    return
  }
  const result = await gh(`/repos/${repo}/pulls/${pr.number}/merge`, { token, method: "PUT", body })
  console.log(`\nMerged #${pr.number} (${result?.sha}). release.yml publishes from the push to main.`)
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`::error::release-train failed: ${err.message}`)
    process.exit(1)
  })
}
