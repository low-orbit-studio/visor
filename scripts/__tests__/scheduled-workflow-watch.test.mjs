import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"

import {
  DEFAULT_THRESHOLD,
  ISSUE_LABEL,
  hasScheduleTrigger,
  discoverScheduledWorkflows,
  computeStreak,
  decideAction,
  issueMarker,
  findOpenIssue,
  renderIssueTitle,
  renderIssueBody,
  renderResolutionComment,
  parseArgs,
  filterRunsToBranch,
} from "../scheduled-workflow-watch.mjs"

// VI-171/reference: vitest threads pool — import.meta.url is not a file:// URL,
// so resolve repo paths from cwd instead.
const REPO_ROOT = process.cwd()
const WORKFLOW_DIR = path.join(REPO_ROOT, ".github/workflows")

/** Newest-first run fixtures. */
const run = (conclusion, opts = {}) => ({
  conclusion,
  head_branch: "main",
  created_at: opts.created_at ?? "2026-09-01T06:00:00Z",
  updated_at: opts.updated_at ?? opts.created_at ?? "2026-09-01T06:05:00Z",
  html_url: opts.html_url ?? "https://github.com/o/r/actions/runs/1",
})

describe("hasScheduleTrigger", () => {
  it("detects a schedule key nested under a block-form on:", () => {
    expect(
      hasScheduleTrigger(["on:", "  workflow_dispatch:", "  schedule:", '    - cron: "0 6 * * *"'].join("\n")),
    ).toBe(true)
  })

  it("detects schedule in the inline list form", () => {
    expect(hasScheduleTrigger("on: [push, schedule]")).toBe(true)
    expect(hasScheduleTrigger("on: schedule")).toBe(true)
  })

  it("is false for a workflow with no schedule", () => {
    expect(hasScheduleTrigger(["on:", "  push:", "    branches: [main]"].join("\n"))).toBe(false)
    expect(hasScheduleTrigger("on: [push, pull_request]")).toBe(false)
  })

  it("does not match a `schedule` that belongs to a later top-level key", () => {
    const yaml = ["on:", "  push:", "jobs:", "  schedule:", "    runs-on: ubuntu-latest"].join("\n")
    expect(hasScheduleTrigger(yaml)).toBe(false)
  })

  it("ignores comments and blank lines inside the on: block", () => {
    const yaml = ["on:", "", "  # nightly", "  schedule:", '    - cron: "0 6 * * *"'].join("\n")
    expect(hasScheduleTrigger(yaml)).toBe(true)
  })

  it("handles empty / missing input", () => {
    expect(hasScheduleTrigger("")).toBe(false)
    expect(hasScheduleTrigger(null)).toBe(false)
  })

  it("tolerates CRLF line endings", () => {
    expect(hasScheduleTrigger("on:\r\n  schedule:\r\n    - cron: \"0 6 * * *\"\r\n")).toBe(true)
  })
})

describe("discoverScheduledWorkflows (against this repo)", () => {
  const found = discoverScheduledWorkflows(WORKFLOW_DIR)

  it("finds the known scheduled workflows and nothing that isn't", () => {
    // Cross-check the scanner against a naive grep of every workflow file, so a
    // newly added scheduled workflow fails here rather than going unwatched.
    const expected = readdirSync(WORKFLOW_DIR)
      .filter((f) => /\.ya?ml$/.test(f))
      .filter((f) => /^\s{1,4}schedule:\s*$/m.test(readFileSync(path.join(WORKFLOW_DIR, f), "utf-8")))
      .sort()
      .map((f) => `.github/workflows/${f}`)
    expect(found).toEqual(expected)
  })

  it("includes the two known scheduled workflows", () => {
    expect(found).toContain(".github/workflows/stale-version-packages-pr.yml")
    expect(found).toContain(".github/workflows/visor-publish-smoke.yml")
  })

  it("watches itself — VI-645 D5", () => {
    expect(found).toContain(".github/workflows/scheduled-workflow-watch.yml")
  })

  it("returns [] for a directory that does not exist", () => {
    expect(discoverScheduledWorkflows(path.join(REPO_ROOT, "no/such/dir"))).toEqual([])
  })
})

describe("computeStreak", () => {
  it("reports zero for an all-green history", () => {
    const r = computeStreak([run("success"), run("success")])
    expect(r.streak).toBe(0)
    expect(r.neverSucceeded).toBe(false)
  })

  it("counts consecutive failures and stops at the first success", () => {
    const r = computeStreak([
      run("failure", { html_url: "newest", created_at: "2026-09-03T06:00:00Z" }),
      run("failure", { created_at: "2026-09-02T06:00:00Z" }),
      run("failure", { created_at: "2026-09-01T06:00:00Z" }),
      run("success", { updated_at: "2026-08-31T06:05:00Z" }),
      run("failure", { created_at: "2026-08-30T06:00:00Z" }),
    ])
    expect(r.streak).toBe(3)
    expect(r.newestFailure.html_url).toBe("newest")
    expect(r.oldestFailure.created_at).toBe("2026-09-01T06:00:00Z")
    expect(r.lastSuccessAt).toBe("2026-08-31T06:05:00Z")
    expect(r.neverSucceeded).toBe(false)
  })

  it("treats timed_out and startup_failure as failures", () => {
    expect(computeStreak([run("timed_out"), run("startup_failure"), run("failure")]).streak).toBe(3)
  })

  it("ignores cancelled/skipped/in-progress without breaking the streak", () => {
    const r = computeStreak([
      run("failure"),
      run("cancelled"),
      run(null),
      run("skipped"),
      run("failure"),
    ])
    expect(r.streak).toBe(2)
  })

  it("flags a workflow that has never succeeded — VI-645 D3", () => {
    const r = computeStreak([run("failure"), run("failure"), run("failure")])
    expect(r.streak).toBe(3)
    expect(r.neverSucceeded).toBe(true)
    expect(r.lastSuccessAt).toBeNull()
  })

  it("does not claim 'never succeeded' when there are no runs at all", () => {
    const r = computeStreak([])
    expect(r.streak).toBe(0)
    expect(r.neverSucceeded).toBe(false)
  })

  it("reproduces VI-642: 276 consecutive failures after a regression from green", () => {
    const runs = [
      ...Array.from({ length: 276 }, (_, i) =>
        run("failure", { created_at: `2026-06-05T06:00:00Z`, html_url: `run-${i}` }),
      ),
      run("success", { updated_at: "2026-06-04T02:12:00Z" }),
    ]
    const r = computeStreak(runs)
    expect(r.streak).toBe(276)
    expect(r.lastSuccessAt).toBe("2026-06-04T02:12:00Z")
    expect(r.neverSucceeded).toBe(false)
    // Would have fired on day 3, not after three and a half months.
    expect(decideAction({ streak: 3, threshold: DEFAULT_THRESHOLD, hasOpenIssue: false })).toBe("open")
  })
})

describe("decideAction", () => {
  it("opens once the streak reaches the threshold", () => {
    expect(decideAction({ streak: 3, threshold: 3, hasOpenIssue: false })).toBe("open")
  })

  it("does not fire for a single failure inside the threshold", () => {
    expect(decideAction({ streak: 1, threshold: 3, hasOpenIssue: false })).toBe("none")
    expect(decideAction({ streak: 2, threshold: 3, hasOpenIssue: false })).toBe("none")
  })

  it("fires once per streak, not once per run", () => {
    expect(decideAction({ streak: 9, threshold: 3, hasOpenIssue: true })).toBe("none")
  })

  it("closes the alert when the workflow recovers, clearing state for a later streak", () => {
    expect(decideAction({ streak: 0, threshold: 3, hasOpenIssue: true })).toBe("close")
    // ...and the next streak opens a fresh one.
    expect(decideAction({ streak: 3, threshold: 3, hasOpenIssue: false })).toBe("open")
  })

  it("does nothing when green with no open issue", () => {
    expect(decideAction({ streak: 0, threshold: 3, hasOpenIssue: false })).toBe("none")
  })

  it("defaults the threshold", () => {
    expect(DEFAULT_THRESHOLD).toBe(3)
    expect(decideAction({ streak: 3 })).toBe("open")
  })
})

describe("issue identity", () => {
  it("marks an issue with the workflow path", () => {
    expect(issueMarker(".github/workflows/a.yml")).toBe(
      "<!-- scheduled-workflow-watch:.github/workflows/a.yml -->",
    )
  })

  it("finds the open issue for one workflow and not another's", () => {
    const issues = [
      { number: 1, body: `noise ${issueMarker(".github/workflows/a.yml")}` },
      { number: 2, body: `noise ${issueMarker(".github/workflows/b.yml")}` },
      { number: 3 },
    ]
    expect(findOpenIssue(issues, ".github/workflows/b.yml").number).toBe(2)
    expect(findOpenIssue(issues, ".github/workflows/c.yml")).toBeNull()
    expect(findOpenIssue([], ".github/workflows/a.yml")).toBeNull()
  })

  it("a rendered body is findable by its own marker — round trip", () => {
    const body = renderIssueBody({
      workflowName: "Visor Publish Smoke",
      workflowPath: ".github/workflows/visor-publish-smoke.yml",
      streak: 276,
      threshold: 3,
      lastSuccessAt: "2026-06-04T02:12:00Z",
      neverSucceeded: false,
      newestFailureUrl: "https://github.com/o/r/actions/runs/9",
      oldestFailureAt: "2026-06-05T06:00:00Z",
      repoUrl: "https://github.com/o/r",
    })
    expect(findOpenIssue([{ number: 7, body }], ".github/workflows/visor-publish-smoke.yml").number).toBe(7)
  })
})

describe("issue rendering", () => {
  const base = {
    workflowName: "Visor Publish Smoke",
    workflowPath: ".github/workflows/visor-publish-smoke.yml",
    streak: 276,
    threshold: 3,
    lastSuccessAt: "2026-06-04T02:12:00Z",
    neverSucceeded: false,
    newestFailureUrl: "https://github.com/o/r/actions/runs/9",
    oldestFailureAt: "2026-06-05T06:00:00Z",
    repoUrl: "https://github.com/o/r",
  }

  it("titles a regression with the streak length", () => {
    expect(renderIssueTitle({ workflowName: base.workflowName, streak: 276, neverSucceeded: false })).toBe(
      'Scheduled workflow "Visor Publish Smoke" has failed 276 consecutive runs',
    )
  })

  it("singularises a streak of one", () => {
    expect(renderIssueTitle({ workflowName: "W", streak: 1, neverSucceeded: false })).toContain(
      "failed 1 consecutive run",
    )
  })

  it("says 'never succeeded' out loud when it never has", () => {
    expect(renderIssueTitle({ workflowName: "W", streak: 5, neverSucceeded: true })).toBe(
      'Scheduled workflow "W" has never succeeded (5 runs)',
    )
  })

  it("titles an inactive workflow distinctly", () => {
    expect(renderIssueTitle({ workflowName: "W", streak: 0, disabled: true })).toBe(
      'Scheduled workflow "W" is not active',
    )
  })

  it("carries the four triage facts: workflow, streak, last success, newest failing run", () => {
    const body = renderIssueBody(base)
    expect(body).toContain(".github/workflows/visor-publish-smoke.yml")
    expect(body).toContain("276")
    expect(body).toContain("2026-06-04T02:12:00Z")
    expect(body).toContain("https://github.com/o/r/actions/runs/9")
  })

  it("marks a never-succeeded workflow in the body, not just the title", () => {
    const body = renderIssueBody({ ...base, neverSucceeded: true, lastSuccessAt: null })
    expect(body).toContain("no successful run on record")
    expect(body).toContain("**never**")
  })

  it("explains the inactive case instead of reporting a streak", () => {
    const body = renderIssueBody({ ...base, disabled: true, state: "disabled_inactivity" })
    expect(body).toContain("disabled_inactivity")
    expect(body).toContain("60 days")
    expect(body).not.toContain("consecutive runs")
  })

  it("tolerates a missing newest-failure link", () => {
    expect(renderIssueBody({ ...base, newestFailureUrl: null, oldestFailureAt: null })).toContain("unknown")
  })

  it("writes a resolution comment on recovery", () => {
    expect(renderResolutionComment({ workflowName: "W", lastSuccessAt: "2026-09-18T06:00:00Z" })).toContain(
      "green again",
    )
    expect(renderResolutionComment({ workflowName: "W" })).toContain("W")
  })
})

describe("parseArgs", () => {
  it("defaults to a live run at the default threshold", () => {
    expect(parseArgs([])).toEqual({ dryRun: false, threshold: DEFAULT_THRESHOLD })
  })

  it("accepts --dry-run and --threshold", () => {
    expect(parseArgs(["--dry-run", "--threshold", "5"])).toEqual({ dryRun: true, threshold: 5 })
  })

  it("rejects a non-positive or non-integer threshold", () => {
    expect(() => parseArgs(["--threshold", "0"])).toThrow(/positive integer/)
    expect(() => parseArgs(["--threshold", "abc"])).toThrow(/positive integer/)
  })
})

describe("filterRunsToBranch", () => {
  it("keeps only runs on the given branch", () => {
    const runs = [run("failure"), { ...run("failure"), head_branch: "feature" }]
    expect(filterRunsToBranch(runs, "main")).toHaveLength(1)
  })

  it("passes everything through when no branch is given", () => {
    expect(filterRunsToBranch([run("failure"), run("success")], undefined)).toHaveLength(2)
  })
})

describe("label", () => {
  it("is the stable name the workflow and issues agree on", () => {
    expect(ISSUE_LABEL).toBe("ci-watch")
  })
})
