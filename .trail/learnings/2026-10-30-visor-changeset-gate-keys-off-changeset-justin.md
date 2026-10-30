---
title: Visor changeset gate keys off changeset-paths.json shippingPaths
author: Justin
date: 2026-10-30
id: l-83d4b0e6
scope: repo
status: active
touches:
  - changeset-paths.json
  - ".github/workflows/changeset-gate.yml"
---

## Decided
The Visor Changeset Gate (`.github/workflows/changeset-gate.yml`) only requires a `.changeset/*.md` when the PR touches a **shipping path** listed in `changeset-paths.json` `.shippingPaths`: `components/**`, `blocks/**`, `hooks/**`, `lib/**`, `registry/**`, `themes/**`, `patterns/**`, `assets/**`, `packages/{cli,theme-engine,tokens,tailwind-preset}/src/**`, `packages/visor-flutter/lib/**` (minimatch — top-level only, so `packages/docs/app/.../lib/x.ts` does NOT match `lib/**`).

So a **docs-app-only change (`packages/docs/**`) + `tests/oracle/**` needs no changeset** — `packages/docs` is in changesets' `ignore` list, and the gate passes with `source=false`. Don't add a `@loworbitstudio/visor` patch "because the ticket template says so" — it would trigger a spurious CLI "Version Packages" release for a docs-only change (VI-560 ran into exactly this: ticket listed a changeset, but the diff shipped nothing publishable). When in doubt, diff your changed paths against `changeset-paths.json` before adding one. Skip-signal escape hatches: `[skip-changeset]` in the PR title or the `skip-changeset` label. Separate from the publish-coordination concern in reference_visor_changeset_release_pr_can_lag and reference_visor_ci_typecheck_separate.

_From Claude Code's memory of this repo, last updated Jun 26._
