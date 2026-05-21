---
"@loworbitstudio/visor": patch
---

VI-440 fix(sandbox): generated `next.config.ts` now bakes `turbopack: { root: __dirname }` so Next.js doesn't misdetect the workspace root in multi-lockfile setups.

When `visor sandbox init` scaffolded `.lo/sandbox/{name}/` inside a parent repo that already had its own `package-lock.json`, Next.js 16.2.6 chose the parent repo as the turbopack root and broke `@/lib/...` module resolution — routes 500'd on first request. The generated config now anchors `turbopack.root` to the sandbox dir via `fileURLToPath(import.meta.url)`, matching the manual workaround from PL-1570 finding #4.
