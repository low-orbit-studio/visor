---
"@loworbitstudio/visor": minor
---

Add `visor spawn` — one-command fork of a Playbook blessed reference build with atomic theme re-skinning. `visor spawn --from blessed:{shape}:{pattern} --theme {id} --output {path}` discovers a blessed build (a directory shipping a Zod-validated `blessed-manifest.json`), copies its tree into a new independent project (excluding `node_modules`, `.next`, `.git`, and other transient dirs), and applies the theme via the nextjs adapter. Theme application is atomic: on failure the output dir is deleted so you get a clean fork or nothing. Flags: `--install` (opt-in `npm install`), `--validate` (opt-in theme validation with rollback), `--blessed-dir` / `VISOR_BLESSED_DIR` (blessed-build root override), and `--list-blessed` (discover all builds). Replaces the manual `cp -R` + `npm install` + `visor theme apply` dance. See `docs/blessed-builds.md` for the manifest contract.
