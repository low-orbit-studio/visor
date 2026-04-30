# W021 — Always run `npm run theme:sync` from the monorepo, not bare `visor theme sync`

**Tags:** cli, themes, sync, dev-environment

## The Lesson

Inside this repo, run **`npm run theme:sync`**. Never run bare `visor theme sync` — it picks the globally installed CLI, whose bundled `@loworbitstudio/visor-theme-engine` lags whatever's on `main` until the next publish.

`npm run theme:sync` rebuilds the workspace `theme-engine` and `cli` packages, then invokes the workspace `visor` (npm-script PATH lookup prefers `node_modules/.bin/`).

## Why This Matters

`PATH` ordering puts the global fnm `bin/` ahead of `node_modules/.bin/`, so a bare `visor` invocation hits the published version. When the published version is older than HEAD, `visor theme sync` silently emits CSS missing the latest layer wrappers and semantic tokens — corrupting tracked stock theme files in the process.

This bit us during the `animal` theme rollout: the global engine pre-dated VI-209/VI-242/VI-280/VI-312, so a single sync call dropped `surface-popover`, `surface-selected`, `surface-elev-*`, and the `@layer visor-adaptive` wrap from every stock CSS file.

## How It Works

```json
"theme:sync": "npm run build -w packages/theme-engine && npm run build -w packages/cli && visor theme sync"
```

1. Rebuild `packages/theme-engine/dist/` — captures any source changes since the last build
2. Rebuild `packages/cli/dist/` — picks up workspace engine via symlink resolution
3. Invoke `visor` — npm runs scripts with `node_modules/.bin/` on PATH first, so this resolves to the workspace CLI, not the global one

## Diagnostic

If you suspect the wrong binary ran:

```bash
which visor                   # global fnm path = global install
ls -l node_modules/.bin/visor # symlink to packages/cli = workspace
```

Bare `visor` in a shell hits the global. `npm run` resolves to the workspace.
