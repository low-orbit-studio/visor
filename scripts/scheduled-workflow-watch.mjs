#!/usr/bin/env node
/**
 * Scheduled-workflow watchdog.
 *
 * VI-642 was red for 276 consecutive runs across three and a half months before
 * anyone looked. It ran on a schedule, so no merge was ever blocked; it died
 * *before* its assertion, so the redness read as infrastructure noise; and CI
 * was green throughout, which actively reassured everyone. See
 * docs/wisdom/W033-gate-that-dies-before-it-runs.md.
 *
 * This script auto-discovers every workflow in .github/workflows/ that carries a
 * `schedule:` trigger, walks its recent run history on the default branch, and
 * opens a GitHub issue when a workflow has failed N consecutive runs. It closes
 * that issue when the workflow goes green again.
 *
 * Design notes:
 *
 *   - **Auto-discovery, not an allowlist.** The failure this exists to prevent is
 *     "nobody remembered to look." An allowlist reproduces it for the next
 *     scheduled workflow somebody adds. (VI-645 D2.)
 *
 *   - **GitHub issue, not Slack.** The issue is durable, closable, needs only the
 *     built-in GITHUB_TOKEN, and keeps private surfaces out of a public repo's CI
 *     — the same reasoning as the publish audit's PR comments (VI-306). It also
 *     supplies idempotency for free: an open issue carrying this script's marker
 *     *is* the "already alerted" state, so there is no cache key to get wrong.
 *     (VI-645 D4.)
 *
 *   - **No build step, no npm install.** The workflow that runs this checks out
 *     the repo and invokes node. There is deliberately no step that can fail
 *     before the assertion — which is precisely how VI-642 hid. (VI-645 D5.)
 *
 *   - **It watches itself.** This script's own workflow has a `schedule:` trigger,
 *     so auto-discovery picks it up like any other. That covers "the watcher runs
 *     but is failing." It cannot cover "the watcher never runs at all" — nothing
 *     inside the repo can. The nearest real mitigation is the disabled-workflow
 *     check below: GitHub auto-disables scheduled workflows after 60 days of
 *     repository inactivity, which is the most likely way this goes quiet, and a
 *     workflow whose state is not `active` is reported as its own finding.
 *
 * Usage:
 *   node scripts/scheduled-workflow-watch.mjs              # report + open/close issues
 *   node scripts/scheduled-workflow-watch.mjs --dry-run    # report only, no writes
 *   node scripts/scheduled-workflow-watch.mjs --threshold 5
 *
 * Environment:
 *   GITHUB_REPOSITORY  owner/repo (set by Actions)
 *   GITHUB_TOKEN       token with issues:write + actions:read
 *
 * Exit codes:
 *   0  ran to completion (findings are reported as issues, not as a red job —
 *      a red watcher would alert on itself)
 *   1  the watcher could not do its job (API or environment failure)
 */

import { readdirSync, readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "..")
const WORKFLOW_DIR = path.join(REPO_ROOT, ".github/workflows")

export const DEFAULT_THRESHOLD = 3
export const ISSUE_LABEL = "ci-watch"

/** Conclusions that extend a failure streak. */
export const FAILURE_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "startup_failure",
])

/**
 * Conclusions that neither extend nor break a streak. A cancelled run usually
 * means a human intervened or a newer run superseded it; a skipped run never
 * executed. Neither is evidence about the workflow's health.
 */
export const NEUTRAL_CONCLUSIONS = new Set([
  "cancelled",
  "skipped",
  "neutral",
  "stale",
  "action_required",
  null,
  undefined,
])

// ---------------------------------------------------------------------------
// pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/**
 * Does this workflow YAML declare a `schedule:` trigger?
 *
 * Deliberately a line scanner rather than a YAML parse: this script runs with no
 * `npm install` in front of it (see the header), so it has no parser available.
 * The scan finds the top-level `on:` block and looks for a `schedule:` key nested
 * directly inside it, which is the only place GitHub honours one.
 */
export function hasScheduleTrigger(yamlText) {
  if (!yamlText) return false
  const lines = yamlText.split("\n")
  let inOnBlock = false

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "")
    if (!line.trim() || line.trim().startsWith("#")) continue

    // Inline form: `on: [push, schedule]` or `on: schedule`
    const inline = line.match(/^on:\s*(\S.*)$/)
    if (inline) {
      return /\bschedule\b/.test(inline[1])
    }

    if (/^on:\s*$/.test(line)) {
      inOnBlock = true
      continue
    }

    if (inOnBlock) {
      // A new top-level key ends the `on:` block.
      if (/^\S/.test(line)) return false
      if (/^\s{1,4}schedule:\s*$/.test(line)) return true
    }
  }
  return false
}

/** Every `.github/workflows/*.y[a]ml` that declares a `schedule:` trigger. */
export function discoverScheduledWorkflows(dir = WORKFLOW_DIR) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .filter((f) => hasScheduleTrigger(readFileSync(path.join(dir, f), "utf-8")))
    .map((f) => `.github/workflows/${f}`)
}

/**
 * Walk run history newest-first and measure the current failure streak.
 *
 * `runs` must be newest-first, already filtered to the branch of interest.
 * Returns the streak length, the newest failing run (the one to link), when the
 * workflow last went green, and whether it has *ever* gone green in the window —
 * "never succeeded" is the nastier class and gets said out loud (VI-645 D3).
 */
export function computeStreak(runs = []) {
  let streak = 0
  let newestFailure = null
  let lastSuccessAt = null
  let oldestFailure = null

  for (const run of runs) {
    const conclusion = run?.conclusion
    if (conclusion === "success") {
      lastSuccessAt = run.updated_at ?? run.created_at ?? null
      break
    }
    if (NEUTRAL_CONCLUSIONS.has(conclusion)) continue
    if (!FAILURE_CONCLUSIONS.has(conclusion)) continue

    streak += 1
    if (newestFailure === null) newestFailure = run
    oldestFailure = run
  }

  return {
    streak,
    newestFailure,
    oldestFailure,
    lastSuccessAt,
    // Only meaningful when there is a streak: we saw failures and no success in
    // the whole fetched window.
    neverSucceeded: streak > 0 && lastSuccessAt === null,
  }
}

/**
 * What to do about one workflow, given its streak and whether an alert issue is
 * already open for it.
 *
 * "open" fires once per streak because the open issue is itself the state. "close"
 * clears that state on recovery so a later streak alerts again.
 */
export function decideAction({ streak, threshold = DEFAULT_THRESHOLD, hasOpenIssue = false }) {
  if (streak >= threshold) return hasOpenIssue ? "none" : "open"
  return hasOpenIssue ? "close" : "none"
}

/** Hidden, stable marker tying an issue to one workflow file. */
export function issueMarker(workflowPath) {
  return `<!-- scheduled-workflow-watch:${workflowPath} -->`
}

/** Find an open alert issue for this workflow, by marker. */
export function findOpenIssue(issues = [], workflowPath) {
  const marker = issueMarker(workflowPath)
  return issues.find((i) => typeof i?.body === "string" && i.body.includes(marker)) ?? null
}

export function renderIssueTitle({ workflowName, streak, neverSucceeded, disabled }) {
  if (disabled) return `Scheduled workflow "${workflowName}" is not active`
  const runs = streak === 1 ? "run" : "runs"
  return neverSucceeded
    ? `Scheduled workflow "${workflowName}" has never succeeded (${streak} ${runs})`
    : `Scheduled workflow "${workflowName}" has failed ${streak} consecutive ${runs}`
}

/**
 * The body carries the four facts needed to triage without opening the Actions
 * tab: which workflow, how long it has been red, when it was last green, and a
 * link to the newest failing run.
 */
export function renderIssueBody({
  workflowName,
  workflowPath,
  streak,
  threshold,
  lastSuccessAt,
  neverSucceeded,
  newestFailureUrl,
  oldestFailureAt,
  repoUrl,
  disabled,
  state,
}) {
  const lines = []

  if (disabled) {
    lines.push(
      `\`${workflowPath}\` is scheduled but its state is \`${state}\`, so it is not running at all.`,
      "",
      "GitHub disables scheduled workflows after 60 days of repository inactivity. " +
        "Re-enable it from the Actions tab.",
    )
  } else {
    lines.push(
      neverSucceeded
        ? `\`${workflowPath}\` has failed its last **${streak}** runs and has **no successful run on record**.`
        : `\`${workflowPath}\` has failed its last **${streak}** consecutive runs.`,
      "",
      "| | |",
      "| -- | -- |",
      `| Workflow | \`${workflowPath}\` |`,
      `| Consecutive failures | ${streak} (threshold ${threshold}) |`,
      `| Last success | ${neverSucceeded ? "**never** — no successful run in the fetched history" : lastSuccessAt} |`,
      `| Failing since | ${oldestFailureAt ?? "unknown"} |`,
      `| Newest failing run | ${newestFailureUrl ?? "unknown"} |`,
      "",
      "A scheduled workflow blocks nobody's merge, so nothing surfaces it on its own. " +
        "Check whether it is failing **at** its assertion or **before** it — a job that dies " +
        "during setup is indistinguishable from one that passes, which is how VI-642 stayed " +
        "red for three and a half months.",
    )
  }

  lines.push(
    "",
    `Opened automatically by [\`scripts/scheduled-workflow-watch.mjs\`](${repoUrl}/blob/main/scripts/scheduled-workflow-watch.mjs). ` +
      "It closes itself when the workflow goes green again.",
    "",
    issueMarker(workflowPath),
  )

  return lines.join("\n")
}

export function renderResolutionComment({ workflowName, lastSuccessAt }) {
  return (
    `:white_check_mark: \`${workflowName}\` is green again` +
    (lastSuccessAt ? ` (last success ${lastSuccessAt})` : "") +
    ". Closing — a future failure streak will open a fresh issue."
  )
}

export function parseArgs(argv = []) {
  const args = { dryRun: false, threshold: DEFAULT_THRESHOLD }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--dry-run") args.dryRun = true
    else if (a === "--threshold") {
      const n = Number(argv[++i])
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`--threshold expects a positive integer, got "${argv[i]}"`)
      }
      args.threshold = n
    }
  }
  return args
}

/** Runs on the default branch only — a workflow's PR runs say nothing about its schedule. */
export function filterRunsToBranch(runs = [], branch) {
  return runs.filter((r) => !branch || r?.head_branch === branch)
}

// ---------------------------------------------------------------------------
// GitHub REST (kept thin; the logic above is what the tests exercise)
// ---------------------------------------------------------------------------

const API = "https://api.github.com"

async function gh(pathname, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      "User-Agent": "scheduled-workflow-watch",
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

async function ensureLabel(repo, token) {
  try {
    await gh(`/repos/${repo}/labels/${ISSUE_LABEL}`, { token })
  } catch {
    await gh(`/repos/${repo}/labels`, {
      token,
      method: "POST",
      body: {
        name: ISSUE_LABEL,
        color: "d93f0b",
        description: "Opened by scripts/scheduled-workflow-watch.mjs",
      },
    }).catch(() => {}) // a concurrent run may have won the race
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const repo = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN

  if (!repo) throw new Error("GITHUB_REPOSITORY is not set")
  if (!token && !args.dryRun) throw new Error("GITHUB_TOKEN is not set")

  const repoUrl = `https://github.com/${repo}`
  const scheduled = discoverScheduledWorkflows()
  if (scheduled.length === 0) {
    console.log("No scheduled workflows found — nothing to watch.")
    return
  }

  const { default_branch: defaultBranch } = await gh(`/repos/${repo}`, { token })
  const { workflows } = await gh(`/repos/${repo}/actions/workflows?per_page=100`, { token })
  const openIssues = await gh(
    `/repos/${repo}/issues?state=open&labels=${ISSUE_LABEL}&per_page=100`,
    { token },
  )

  if (!args.dryRun) await ensureLabel(repo, token)

  console.log(
    `Watching ${scheduled.length} scheduled workflow(s) on ${repo}@${defaultBranch}, ` +
      `threshold ${args.threshold}${args.dryRun ? " (dry run)" : ""}\n`,
  )

  let findings = 0

  for (const workflowPath of scheduled) {
    const wf = workflows.find((w) => w.path === workflowPath)
    if (!wf) {
      console.log(`  ? ${workflowPath} — not registered with Actions yet, skipping`)
      continue
    }

    const disabled = wf.state !== "active"
    const { workflow_runs: allRuns = [] } = await gh(
      `/repos/${repo}/actions/workflows/${wf.id}/runs?per_page=100&exclude_pull_requests=true`,
      { token },
    )
    const runs = filterRunsToBranch(allRuns, defaultBranch)
    const { streak, newestFailure, oldestFailure, lastSuccessAt, neverSucceeded } =
      computeStreak(runs)

    const existing = findOpenIssue(openIssues, workflowPath)
    const action = disabled
      ? existing
        ? "none"
        : "open"
      : decideAction({ streak, threshold: args.threshold, hasOpenIssue: Boolean(existing) })

    const status = disabled
      ? `state=${wf.state}`
      : streak === 0
        ? "green"
        : `${streak} consecutive failure(s)`
    console.log(`  ${action === "open" ? "!" : action === "close" ? "+" : "·"} ${wf.name} — ${status} → ${action}`)

    if (action === "open") {
      findings += 1
      if (args.dryRun) continue
      const created = await gh(`/repos/${repo}/issues`, {
        token,
        method: "POST",
        body: {
          title: renderIssueTitle({ workflowName: wf.name, streak, neverSucceeded, disabled }),
          body: renderIssueBody({
            workflowName: wf.name,
            workflowPath,
            streak,
            threshold: args.threshold,
            lastSuccessAt,
            neverSucceeded,
            newestFailureUrl: newestFailure?.html_url ?? null,
            oldestFailureAt: oldestFailure?.created_at ?? null,
            repoUrl,
            disabled,
            state: wf.state,
          }),
          labels: [ISSUE_LABEL],
        },
      })
      console.log(`      opened ${created.html_url}`)
    } else if (action === "close") {
      if (args.dryRun) continue
      await gh(`/repos/${repo}/issues/${existing.number}/comments`, {
        token,
        method: "POST",
        body: { body: renderResolutionComment({ workflowName: wf.name, lastSuccessAt }) },
      })
      await gh(`/repos/${repo}/issues/${existing.number}`, {
        token,
        method: "PATCH",
        body: { state: "closed", state_reason: "completed" },
      })
      console.log(`      closed ${existing.html_url}`)
    }
  }

  console.log(`\n${findings} new alert(s).`)
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`::error::scheduled-workflow-watch failed: ${err.message}`)
    process.exit(1)
  })
}
