---
"@loworbitstudio/visor": minor
---

VI-439 feat(sandbox): `visor sandbox init` now resolves brand themes from a private themes directory via `VISOR_THEMES_PRIVATE_PATH` env var, and accepts an explicit `--theme-file <path>` override.

When the operator passes `--theme entr`, the CLI now walks a layered candidate list before falling back to the placeholder `globals.css`: `--theme-file <path>` wins if set, then `theme` interpreted as a direct path on disk, then `${VISOR_THEMES_PRIVATE_PATH}/themes/${theme}/theme.visor.yaml` when the env var is set (the canonical path for brand themes kept in `visor-themes-private`), then the existing `cwd/themes/${theme}.visor.yaml` and `cwd/custom-themes/${theme}.visor.yaml` fallback. If every candidate misses, the warning now lists the exact paths searched and prints the `npx visor theme apply` command the operator should run, instead of a generic "leaving placeholder" message that pointed at the wrong docs. Closes PL-1570 finding #3 — operators no longer have to run a second CLI invocation pointing at a private repo path after `init`.
