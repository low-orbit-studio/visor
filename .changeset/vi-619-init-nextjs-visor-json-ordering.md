---
"@loworbitstudio/visor": patch
---

VI-619: Fix `visor init --template nextjs` failing in an empty directory.

`initCommand` wrote `visor.json` into the target directory before shelling out to `create-next-app`. create-next-app refuses to scaffold into a directory that already contains conflicting files, and `visor.json` — which visor itself had just written — was exactly such a conflict, so the scaffold aborted with `create-next-app exited with code 1` on the documented empty-directory onboarding path.

The `visor.json` write now happens inside the nextjs scaffold, immediately after create-next-app succeeds, so the directory is clean when the scaffolder runs. The bare `visor init` path (and every non-template path) is unchanged — it still writes `visor.json` first, since nothing there shells out. `visor init --for <play>` alone never invoked create-next-app, so it did not share the defect; the combined `--for --template nextjs` case is covered by the same reorder.
