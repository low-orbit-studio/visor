---
"@loworbitstudio/visor": minor
---

VI-423 feat: `visor sandbox` subcommand — scaffolded Next.js app for in-vivo primitive iteration with gap stubs.

A new `sandbox` subcommand group (`init`, `dev`, `approve`) bridges the gap between standalone-HTML prototypes and the production Visor scaffold in the `/lo-play pattern-build` pipeline. `visor sandbox init <name> --handoff <path> --theme <theme>` reads a Low Orbit design-handoff manifest, scaffolds a Next.js 16 app at `.lo/sandbox/<name>/`, runs `visor add` for every shipped primitive declared in the manifest, and generates visible dashed-border stub components for each declared gap primitive (`components/stubs/<name>.tsx`, each containing a `GAP: VI-<NNN>` marker).

`visor sandbox dev --name <name>` boots the dev server on an auto-allocated port (port 3000 is reserved per the Low Orbit convention; the allocator probes from port 4060 upward). The scaffolded app exposes one route per primitive (`/primitives/<name>`), one per screen declared in the recipe (`/screens/<name>`), plus an index at `/` linking to all of them.

`visor sandbox approve --name <name>` shells out to a sandbox-local Playwright install and captures full-page screenshots of every route into `captures/approved/`. `--diff` pixel-diffs the new capture against the approved baseline and writes only changed routes to `captures/diffs/<route>.diff.png`, so operator iterations stay traceable.

The CLI itself does not bundle Playwright — the sandbox scaffold declares `@playwright/test`, `pixelmatch`, and `pngjs` in its own devDependencies, keeping the published `@loworbitstudio/visor` package light. Unknown primitives in the handoff (declared shipped but missing from the registry) are skipped with a warning rather than aborting the scaffold.
