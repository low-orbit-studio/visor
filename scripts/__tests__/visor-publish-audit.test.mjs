import { describe, it, expect } from "vitest"
import {
  extractVIRefs,
  mapDriftToTickets,
  formatAuditReport,
  formatLinearComment,
  parseArgs,
} from "../visor-publish-audit.mjs"

describe("extractVIRefs", () => {
  it("returns empty for empty/missing input", () => {
    expect(extractVIRefs("")).toEqual([])
    expect(extractVIRefs(null)).toEqual([])
    expect(extractVIRefs(undefined)).toEqual([])
  })

  it("finds a single VI- reference", () => {
    expect(extractVIRefs("VI-306 fix: governance loop")).toEqual(["VI-306"])
  })

  it("finds multiple VI- references and dedupes in order", () => {
    expect(
      extractVIRefs("VI-280 / VI-281 / VI-282 chore: bundle tokens (VI-280)"),
    ).toEqual(["VI-280", "VI-281", "VI-282"])
  })

  it("ignores PL- and BO- refs", () => {
    expect(extractVIRefs("PL-99 BO-14 feat: unrelated")).toEqual([])
  })

  it("normalizes lowercase to uppercase", () => {
    expect(extractVIRefs("vi-306 fix: typo")).toEqual(["VI-306"])
  })

  it("matches VI- in branch-name-style suffixes", () => {
    expect(
      extractVIRefs("Merge pull request from vi-306-borealis-governance"),
    ).toEqual(["VI-306"])
  })

  it("does not match VI- as part of a larger word", () => {
    expect(extractVIRefs("REVI-50 not a real ticket")).toEqual([])
  })
})

describe("mapDriftToTickets", () => {
  it("maps a single drift to its touching commit's VI- ref", () => {
    const drifts = [
      { name: "stat-card", files: ["components/ui/stat-card/stat-card.tsx"] },
    ]
    const commits = [
      {
        sha: "abc1234567",
        subject: "VI-288 feat: stat-card hero typography",
        files: [
          "packages/cli/src/registry/components/ui/stat-card/stat-card.tsx",
        ],
      },
    ]
    const { findings, orphans } = mapDriftToTickets(drifts, commits)
    expect(orphans).toEqual([])
    expect(findings).toEqual([
      {
        ticketId: "VI-288",
        primitives: [
          {
            name: "stat-card",
            sha: "abc1234",
            subject: "VI-288 feat: stat-card hero typography",
          },
        ],
      },
    ])
  })

  it("groups multiple drifts under one ticket when one commit touched all of them", () => {
    const drifts = [
      { name: "command-dialog", files: ["components/ui/command-dialog/x.tsx"] },
      { name: "tabs", files: ["components/ui/tabs/tabs.tsx"] },
    ]
    const commits = [
      {
        sha: "deadbeef00",
        subject: "VI-290 chore: two-component fix",
        files: [
          "packages/cli/src/registry/components/ui/command-dialog/x.tsx",
          "packages/cli/src/registry/components/ui/tabs/tabs.tsx",
        ],
      },
    ]
    const { findings, orphans } = mapDriftToTickets(drifts, commits)
    expect(orphans).toEqual([])
    expect(findings).toHaveLength(1)
    expect(findings[0].ticketId).toBe("VI-290")
    expect(findings[0].primitives.map((p) => p.name).sort()).toEqual([
      "command-dialog",
      "tabs",
    ])
  })

  it("creates entries for each VI- ref when a commit references multiple", () => {
    const drifts = [
      { name: "stat-card", files: ["components/ui/stat-card/stat-card.tsx"] },
    ]
    const commits = [
      {
        sha: "0a1b2c3d4e",
        subject: "VI-280 / VI-281 chore: foundations",
        files: [
          "packages/cli/src/registry/components/ui/stat-card/stat-card.tsx",
        ],
      },
    ]
    const { findings } = mapDriftToTickets(drifts, commits)
    expect(findings.map((f) => f.ticketId)).toEqual(["VI-280", "VI-281"])
  })

  it("classifies orphans when no commit touched the drifted files", () => {
    const drifts = [
      { name: "ghost", files: ["components/ui/ghost/ghost.tsx"] },
    ]
    const commits = [
      {
        sha: "abc1234567",
        subject: "VI-100 feat: unrelated",
        files: ["packages/cli/src/registry/components/ui/other/other.tsx"],
      },
    ]
    const { findings, orphans } = mapDriftToTickets(drifts, commits)
    expect(findings).toEqual([])
    expect(orphans).toEqual([{ name: "ghost", reason: "no-touching-commit" }])
  })

  it("classifies orphans when the touching commit has no VI- ref", () => {
    const drifts = [
      { name: "stat-card", files: ["components/ui/stat-card/stat-card.tsx"] },
    ]
    const commits = [
      {
        sha: "abc1234567",
        subject: "chore: bulk rename, no ticket",
        files: [
          "packages/cli/src/registry/components/ui/stat-card/stat-card.tsx",
        ],
      },
    ]
    const { findings, orphans } = mapDriftToTickets(drifts, commits)
    expect(findings).toEqual([])
    expect(orphans).toEqual([{ name: "stat-card", reason: "no-vi-ref" }])
  })

  it("sorts findings by numeric VI- order", () => {
    const drifts = [
      { name: "a", files: ["components/ui/a/a.tsx"] },
      { name: "b", files: ["components/ui/b/b.tsx"] },
    ]
    const commits = [
      {
        sha: "1111111111",
        subject: "VI-100 a",
        files: ["packages/cli/src/registry/components/ui/a/a.tsx"],
      },
      {
        sha: "2222222222",
        subject: "VI-9 b",
        files: ["packages/cli/src/registry/components/ui/b/b.tsx"],
      },
    ]
    const { findings } = mapDriftToTickets(drifts, commits)
    expect(findings.map((f) => f.ticketId)).toEqual(["VI-9", "VI-100"])
  })
})

describe("formatAuditReport", () => {
  it("returns the empty-state message when there are no findings or orphans", () => {
    const out = formatAuditReport({
      findings: [],
      orphans: [],
      publishedVersion: "0.10.2",
    })
    expect(out).toContain("No publish-audit findings")
  })

  it("snapshots a happy-path report", () => {
    const out = formatAuditReport({
      findings: [
        {
          ticketId: "VI-288",
          primitives: [
            {
              name: "stat-card",
              sha: "abc1234",
              subject: "VI-288 feat: stat-card hero typography",
            },
          ],
        },
      ],
      orphans: [{ name: "ghost", reason: "no-touching-commit" }],
      publishedVersion: "0.10.2",
    })
    expect(out).toContain("1 VI- ticket")
    expect(out).toContain("VI-288")
    expect(out).toContain("stat-card")
    expect(out).toContain("(abc1234)")
    expect(out).toContain("ghost")
    expect(out).toContain("no recent commit touched")
    expect(out).toContain("Resolution: cut a new @loworbitstudio/visor release")
  })
})

describe("formatLinearComment", () => {
  it("includes a traceability marker for each primitive", () => {
    const out = formatLinearComment(
      {
        ticketId: "VI-288",
        primitives: [
          {
            name: "stat-card",
            sha: "abc1234",
            subject: "VI-288 feat: stat-card hero typography",
          },
          {
            name: "admin-detail-drawer",
            sha: "def5678",
            subject: "VI-288 feat: stat-card hero typography",
          },
        ],
      },
      "0.10.2",
    )
    expect(out).toContain("Publish-audit signal")
    expect(out).toContain("@loworbitstudio/visor@0.10.2")
    expect(out).toContain("Publish-audit marker: stat-card@abc1234")
    expect(out).toContain("Publish-audit marker: admin-detail-drawer@def5678")
    expect(out).toContain("W020")
  })

  it("uses singular phrasing when only one primitive is affected", () => {
    const out = formatLinearComment(
      {
        ticketId: "VI-9",
        primitives: [
          { name: "lone", sha: "0000000", subject: "VI-9 fix: lone" },
        ],
      },
      "1.0.0",
    )
    expect(out).toContain("its primitive is")
    expect(out).not.toContain("its primitives are")
  })
})

describe("parseArgs", () => {
  it("returns defaults for empty argv", () => {
    expect(parseArgs([])).toEqual({
      json: false,
      postComments: false,
      version: null,
      localTarballDir: null,
      help: false,
    })
  })

  it("parses every flag", () => {
    const out = parseArgs([
      "--json",
      "--post-comments",
      "--version",
      "0.5.0",
      "--local",
      "/tmp/pkg",
    ])
    expect(out.json).toBe(true)
    expect(out.postComments).toBe(true)
    expect(out.version).toBe("0.5.0")
    expect(out.localTarballDir).toBe("/tmp/pkg")
  })

  it("throws on unknown flag", () => {
    expect(() => parseArgs(["--what"])).toThrow(/Unknown argument/)
  })
})
