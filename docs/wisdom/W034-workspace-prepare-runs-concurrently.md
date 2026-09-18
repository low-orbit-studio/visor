# W034 — npm runs workspace `prepare` scripts concurrently in non-deterministic order; only the *root* `prepare` is ordered

**Tags:** npm, workspaces, monorepo, build-order, lifecycle-scripts, prepare, ci

**Source:** VI-644, following [W033](W033-gate-that-dies-before-it-runs.md). The obvious fix for "`npm ci` doesn't produce `packages/theme-engine/dist`" is a `prepare` script on that package. It works — but only because the engine happens to have no workspace build inputs. Extending the same fix to `packages/tokens`, whose build *imports* the engine, would have produced a coin-flip.

## What

`npm ci` and `npm install` **do** run `prepare` for workspace packages (`--ignore-scripts` suppresses it). What they do not do is order those scripts by the workspace dependency graph.

Measured on npm 11.11.0 / node 22.22.1, with a two-package synthetic workspace where `@x/aaa` declares a dependency on `@x/zzz`:

```
ci run 1: aaa zzz      ci run 5: zzz aaa
ci run 2: aaa zzz      ci run 6: zzz aaa
ci run 3: zzz aaa      ci run 7: aaa zzz
ci run 4: aaa zzz      ci run 8: zzz aaa
```

Identical command, identical tree, 4–4 split. Declaring the dependency (in `dependencies` or `devDependencies`) does not change this — the scripts are dispatched concurrently. The root `prepare`, by contrast, ran **last, every time**, on both `npm ci` and `npm install`.

## So

- A per-package `prepare` is safe **only** when that package's build consumes nothing else in the workspace. For a leaf like `packages/theme-engine` (deps: `yaml`) it is the idiomatic answer.
- The moment the package needs a sibling's `dist/`, a per-package `prepare` becomes a flaky-install generator that passes locally and fails ~half the time in CI. Worse, it races the sibling's own `tsup --clean`, which deletes `dist/` before rewriting it.
- To build more than one workspace package at install time **in a guaranteed order**, chain them from the *root* `prepare`:

  ```json
  "prepare": "husky 2>/dev/null; git config core.hooksPath .husky 2>/dev/null || true; npm run build -w packages/theme-engine -w packages/tokens"
  ```

  `npm run <script> -w A -w B` *is* sequential in the order given — the non-determinism is in npm's lifecycle dispatch, not in `-w`.

## When

Any time you reach for `prepare` to make a build artifact exist after a plain install in an npm-workspaces monorepo. Ask first: does this package's build read another workspace package? If yes, the root is the only ordered place to put it.

## Cost, and the escape hatch

Chaining from the root means every `npm ci` pays the build — measured at **1.54s** (theme-engine `tsup`) + **0.30s** (tokens) ≈ 1.8s, against an install that takes tens of seconds. It also means a broken engine build fails `npm ci` itself, including the install you need in order to fix it. That is the intended trade (silence is what W033 was about), and the escape hatch is one flag: `npm ci --ignore-scripts`.

## Don't assume — measure

The npm docs say `prepare` runs "before the package is packed and published, and on local `npm install` without any arguments." They say nothing about workspace ordering in either direction. Every claim above came from a synthetic workspace run eight times, not from reading the docs. Lifecycle-script ordering is exactly the kind of behaviour that is unspecified, version-dependent, and worth ten minutes of measurement before a design rests on it.
