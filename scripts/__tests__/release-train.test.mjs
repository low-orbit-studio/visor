import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"
import { parse } from "yaml"

import {
  MERGE_EVENTS,
  nyHour,
  isTrainRun,
  selectCandidates,
  verifyPr,
  verifyFiles,
  verifyChecks,
  mergeBody,
} from "../release-train.mjs"

// vitest threads pool: import.meta.url is not a file:// URL, so resolve from cwd.
const WORKFLOWS = path.join(process.cwd(), ".github/workflows")
const readWorkflow = (f) => parse(readFileSync(path.join(WORKFLOWS, f), "utf-8"))

const SHA = "9d0b603b9ffe3ef3d0272692aa0a667cdbc0e8b9"

/** Shaped like Version Packages PR #906. */
const releasePr = (over = {}) => ({
  number: 906,
  title: "Version Packages: visor@1.62.0, visor-theme-engine@0.48.0",
  state: "open",
  draft: false,
  head: { ref: "changeset-release/main", sha: SHA },
  base: { ref: "main" },
  author_association: "MEMBER",
  mergeable: true,
  mergeable_state: "clean",
  ...over,
})

const releaseFiles = () => [
  { filename: ".changeset/vi-805-field-control-glass.md", status: "removed" },
  { filename: "packages/cli/CHANGELOG.md", status: "modified" },
  { filename: "packages/cli/package.json", status: "modified" },
  { filename: "packages/tokens/package.json", status: "modified" },
]

const check = (name, conclusion = "success", status = "completed") => ({ name, status, conclusion })

describe("isTrainRun (5PM New York across daylight saving)", () => {
  const winter = new Date("2026-11-24T22:03:00Z") // EST, UTC-5
  const summer = new Date("2026-07-14T21:03:00Z") // EDT, UTC-4

  it("reads New York's hour", () => {
    expect(nyHour(winter)).toBe(17)
    expect(nyHour(summer)).toBe(17)
  })

  it("keeps the 22:00 UTC cron in standard time and skips the 21:00 one", () => {
    expect(isTrainRun({ event: "schedule", schedule: "0 22 * * *", now: winter })).toBe(true)
    expect(isTrainRun({ event: "schedule", schedule: "0 21 * * *", now: winter })).toBe(false)
  })

  it("keeps the 21:00 UTC cron in daylight time and skips the 22:00 one", () => {
    expect(isTrainRun({ event: "schedule", schedule: "0 21 * * *", now: summer })).toBe(true)
    expect(isTrainRun({ event: "schedule", schedule: "0 22 * * *", now: summer })).toBe(false)
  })

  it("goes by the cron that fired, not the clock, so a late run still counts", () => {
    const late = new Date("2026-11-24T22:58:00Z")
    expect(isTrainRun({ event: "schedule", schedule: "0 22 * * *", now: late })).toBe(true)
  })

  it("lets a manual dispatch through at any hour", () => {
    expect(isTrainRun({ event: "workflow_dispatch", now: new Date("2026-11-24T14:00:00Z") })).toBe(true)
  })

  it("skips a schedule run with no readable cron", () => {
    expect(isTrainRun({ event: "schedule", schedule: undefined, now: winter })).toBe(false)
  })
})

describe("selectCandidates", () => {
  it("finds nothing when no Version Packages PR is open", () => {
    expect(selectCandidates([{ title: "VI-1 feat: x", head: { ref: "vi-1-x" } }])).toEqual([])
    expect(selectCandidates([])).toEqual([])
  })

  it("picks up either half of the costume so verifyPr can refuse it loudly", () => {
    const impostor = { title: "Version Packages: visor@9.9.9", head: { ref: "evil" } }
    expect(selectCandidates([releasePr(), impostor])).toHaveLength(2)
  })
})

describe("verifyPr", () => {
  it("accepts the real release PR", () => {
    expect(verifyPr(releasePr())).toEqual([])
  })

  it.each([
    ["a foreign head branch", { head: { ref: "evil", sha: SHA } }, /head branch/],
    ["a non-main base", { base: { ref: "next" } }, /base branch/],
    ["a wrong title", { title: "Bump stuff" }, /title/],
    ["a draft", { draft: true }, /draft/],
    ["an outside author", { author_association: "CONTRIBUTOR" }, /association/],
    ["conflicts", { mergeable: false }, /not mergeable/],
    ["a blocked merge state", { mergeable_state: "dirty" }, /mergeable_state/],
  ])("refuses %s", (_label, over, pattern) => {
    expect(verifyPr(releasePr(over)).join("\n")).toMatch(pattern)
  })
})

describe("verifyFiles", () => {
  it("accepts changeset bookkeeping only", () => {
    expect(verifyFiles(releaseFiles())).toEqual([])
  })

  it("refuses an empty diff and a diff that consumes no changeset", () => {
    expect(verifyFiles([]).join()).toMatch(/no files/)
    expect(verifyFiles(releaseFiles().slice(1)).join()).toMatch(/consumes no/)
  })

  it("refuses a diff that bumps no manifest", () => {
    expect(verifyFiles(releaseFiles().filter((f) => !f.filename.endsWith("package.json"))).join()).toMatch(/bumps no/)
  })

  it("refuses source changes riding along", () => {
    const files = [...releaseFiles(), { filename: "components/ui/button/button.tsx", status: "modified" }]
    expect(verifyFiles(files).join()).toMatch(/outside changeset bookkeeping/)
  })

  it("refuses a release that adds a changeset", () => {
    const files = [...releaseFiles(), { filename: ".changeset/new.md", status: "added" }]
    expect(verifyFiles(files).join()).toMatch(/only consumes/)
  })
})

describe("verifyChecks", () => {
  it("accepts green, skipped and neutral checks", () => {
    expect(verifyChecks([check("Build & Test"), check("Proof", "skipped"), check("x", "neutral")], { state: "success", statuses: [{}] })).toEqual([])
  })

  it("fails closed with no checks at all", () => {
    expect(verifyChecks([]).join()).toMatch(/no check runs/)
  })

  it("refuses while CI is still running at 5PM", () => {
    expect(verifyChecks([check("Typecheck", null, "in_progress")]).join()).toMatch(/still running/)
  })

  it("refuses red or cancelled checks", () => {
    expect(verifyChecks([check("Lint", "failure"), check("Docs", "cancelled")]).join()).toMatch(/2 check\(s\) not green/)
  })

  it("refuses a failing commit status", () => {
    expect(verifyChecks([check("Build")], { state: "failure", statuses: [{}] }).join()).toMatch(/combined commit status/)
  })
})

describe("mergeBody", () => {
  it("squash-merges pinned to the full head SHA", () => {
    expect(mergeBody(SHA)).toEqual({ merge_method: "squash", sha: SHA })
  })

  it("throws on a short SHA", () => {
    expect(() => mergeBody("9d0b603")).toThrow(/40-character/)
  })
})

describe("only schedule and manual dispatch may merge", () => {
  it("treats every other event as a dry run", () => {
    expect([...MERGE_EVENTS].sort()).toEqual(["schedule", "workflow_dispatch"])
  })
})

describe("release-train.yml", () => {
  const wf = readWorkflow("release-train.yml")
  const steps = wf.jobs.train.steps

  it("fires on both 5PM crons and by hand with a dry_run input", () => {
    expect(wf.on.schedule.map((s) => s.cron)).toEqual(["0 21 * * *", "0 22 * * *"])
    expect(wf.on.workflow_dispatch.inputs.dry_run.type).toBe("boolean")
  })

  it("gates the train step on the 5PM gate", () => {
    const train = steps.find((s) => s.name === "Run the train")
    expect(steps.find((s) => s.id === "gate").env.SCHEDULE).toBe("${{ github.event.schedule }}")
    expect(train.if).toBe("steps.gate.outputs.go == 'true'")
  })

  it("merges with the PAT so release.yml runs on the merge", () => {
    const train = steps.find((s) => s.name === "Run the train")
    expect(train.env.GITHUB_TOKEN).toBe("${{ secrets.CHANGESETS_PAT }}")
    expect(train.shell).toBe("bash")
  })

  it("has no install or build step that could fail before the train", () => {
    expect(steps.some((s) => /npm (ci|install)|npm run build/.test(s.run ?? ""))).toBe(false)
  })
})

describe("stale-version-packages-pr.yml", () => {
  const wf = readWorkflow("stale-version-packages-pr.yml")

  it("alerts when a Release Train run completes", () => {
    expect(wf.on.workflow_run).toEqual({ workflows: ["Release Train"], types: ["completed"] })
    expect(wf.jobs["train-alert"].if).toMatch(/workflow_run/)
    expect(wf.jobs["train-alert"].permissions.issues).toBe("write")
    expect(wf.jobs["train-alert"].steps[0].run).toMatch(/"Run the train"/)
  })

  it("keeps the hourly drift check off train events and ignores changesets under a day old", () => {
    expect(wf.jobs["check-drift"].if).toBe("github.event_name != 'workflow_run'")
    const drift = wf.jobs["check-drift"].steps.find((s) => s.id === "drift")
    expect(drift.run).toMatch(/-ge 86400/)
  })
})
