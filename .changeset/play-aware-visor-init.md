---
"@loworbitstudio/visor": minor
---

Add a play-aware entry point to `visor init` — `visor init --for {play-type}` (VI-596). On top of the existing Visor scaffold, it bootstraps the Playbook orchestration structure needed to start a play: writes `.lo/{play-subdir}/{name}/state.json` at `phase: 0` with metadata (D5), allocates a dev port via `/lo-ports` with a deterministic heuristic fallback + warning when the command is unavailable (D4), and prints the play's next-phase checklist from `~/.claude/skills/lo-play/{play-type}/entry-checklist.md` — falling back to a `/lo-play {play-type}` pointer when the file is missing (D6).

`--for` is additive to `--template nextjs`, not a replacement (D1). The initial known-plays set is `pattern-build`, `new-web-app`, and `feature-addition`; the table is a static, Playbook-owned-by-convention list (emitted to `dist/init-plays.json`), and an unknown `--for` value errors with the known-plays list (D2). New optional flags: `--play-name`, `--theme`, `--from`. Re-running with the same `--play-name` is an idempotent no-op that reports the existing state (D7).
