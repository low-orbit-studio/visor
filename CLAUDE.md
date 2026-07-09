# Visor

> Low Orbit Studio's shared design system — a two-layer distribution model: components via a shadcn-style registry (copy-and-own) and tokens via an npm package (`@loworbitstudio/visor-core`).

## Distribution Model

Visor uses two distribution layers:

1. **Components → Registry (copy-and-own).** Consumers run `npx visor add button`, source files get copied into their project. Full edit rights, no lock-in. Scaffolded from shadcn's `registry-template`.
2. **Tokens → npm package (`@loworbitstudio/visor-core`).** The only npm-distributed piece. CSS custom properties that all components reference. Updates propagate automatically via `npm update`, keeping design consistency across projects without constraining component implementations.

**Why this model:** Consumers can edit components without forking. Aligns with the playbook's "own your components" philosophy while the shared tokens package keeps design consistency effortless.

## Stack

- **Framework:** React + TypeScript
- **Registry:** shadcn-style (`registry-template` scaffold)
- **Tokens package:** `@loworbitstudio/visor-core` (CSS custom properties)
- **Styling:** CSS Modules + CSS custom properties (no Tailwind, no CSS-in-JS)
- **Variants:** CVA (class-variance-authority)
- **Primitives:** Radix UI (complex behaviors only)
- **Icons:** @phosphor-icons/react
- **Testing:** Vitest + React Testing Library
- **Docs:** fumadocs (Next.js MDX site)

## Linear

- **Default team:** Visor (VI)

## Documentation

Visor is open-source and public-facing. When adding features, commands, or components, update both the README and the fumadocs site (`packages/docs/`) to reflect the changes.

## Relevant Playbook Treebranches

| Treebranch | When to Use | Skill |
|------------|-------------|-------|
| `nextjs-architecture/` | Docs site patterns, server-first, CSS-first | `/lo-architect-nextjs` |
| `design-system/` | Design token methodology, 3-tier token architecture | `/lo-design-system` |
| `component-library/` | Reusable component patterns, API design | `/lo-component-library` |
| `deployment/` | CI/CD, npm publishing, docs hosting | `/lo-deployment` |

Use `/lo` to route to the right methodology for any task.

## Design System Architecture

Visor's token system follows the 3-tier architecture adapted from Blacklight:

1. **Primitives** — Raw values (colors, spacing, font sizes)
2. **Semantic** — Named by purpose (`--text-primary`, `--surface-card`, `--border-default`)
3. **Adaptive** — Theme-aware tokens that switch based on active theme class

**Theming is the core differentiator.** All components must be fully theme-agnostic — they reference CSS custom properties, never hard-coded values. Themes are distributable CSS variable sets shipped via `@loworbitstudio/visor-core`.

Reference design system: `~/Code/low-orbit/low-orbit-playbook/reference-nextjs-app/`
Source components: `~/Code/kaiah/kaiah-app/packages/ui/src/components/ui/`
Source tokens: `~/Code/blacklight/packages/design-tokens/`

## Component Build Workflow

### Render-vs-design self-check (default-on, keyed on `design_ref`)

When a component you are building or changing has an **approved design**, you MUST render the built component and diff it against that design **before opening the PR**. This is a build-time step, not an optional checklist item — the whole point (W-111) is that a gate needing a hand-authored opt-in reproduces the "codified but never adopted" gap it was meant to close.

**The intrinsic trigger is a `design_ref` on the component's `.visor.yaml`.** If a component in your diff carries `design_ref`, the self-check below is mandatory. No separate manifest, flag, or checklist item enables it — presence of the field *is* the enablement. (This makes CLAUDE.md's advisory "Design-Fidelity Before Done" ASK, which can be waived, a concrete build-time step for any component with an approved design.)

**When it fires** (a component in the diff has a `design_ref`):

1. **Render** the built component with the BO-66 harness across **≥2 themes × both modes**:

   ```bash
   npx tsx packages/cli/src/index.ts render <component> --theme space   --mode dark  --out .visor/renders/<component>__space__dark.png
   npx tsx packages/cli/src/index.ts render <component> --theme space   --mode light --out .visor/renders/<component>__space__light.png
   npx tsx packages/cli/src/index.ts render <component> --theme neutral  --mode dark  --out .visor/renders/<component>__neutral__dark.png
   npx tsx packages/cli/src/index.ts render <component> --theme neutral  --mode light --out .visor/renders/<component>__neutral__light.png
   ```

   (Published-CLI form: `npx @loworbitstudio/visor render <component> --theme <slug> --mode <light|dark>`. Requires `playwright` + `esbuild` — optional deps; the command prints an install prompt if absent. See [`docs/cli`](./packages/docs/content/docs/cli.mdx).) Use ≥2 *contrasting* themes — a decorative theme (e.g. `space`, `blackout`) surfaces radius/surface-ramp drift that a plain theme hides.

2. **Multimodal side-by-side.** `Read` the `design_ref` image **and** each rendered PNG in the same turn and inspect them together — the way the operator would. This is the load-bearing step: pixel-precise self-inspection is uniquely the model's strength (see the playbook wisdom [`self-inspect-before-approval-ping.md`](~/Code/low-orbit/low-orbit-playbook/roots/foundations/wisdom/self-inspect-before-approval-ping.md)). A green `validate:strict` is **not** proof of fidelity — token *names* lie about rendered values per theme (`--surface-subtle` reads lighter than the card in dark; `--radius-xl` balloons to 32px on decorative themes).

3. **Enumerate deltas.** Walk each surface and name every mismatch against the design in these classes: **radius** (cluster/pill corner rounding), **spacing** (padding, gaps, vertical rhythm), **color** (fill, border, text, accent — especially recessed vs raised surfaces), and **alignment** (optical centering, baseline drift).

4. **Fix, then re-render** until the built surface matches the design. Only then open the PR.

**Rationale / prior art:** W-110 (Cited ≠ Embedded ≠ Built — an approved design accumulates three separate, non-substitutable fidelity claims; only a rendered diff proves *Built*) and W-111 (an opt-in enforcement gate reproduces the codification gap; trigger from an intrinsic signal — here, `design_ref`). Both live under `~/Code/low-orbit/low-orbit-playbook/roots/foundations/wisdom/`. This step is Visor-repo-scoped for now (not yet in the shared `lo-swarm` teammate prompt) — it generalizes once proven.

**Where the `design_ref` comes from (v1):** the self-check fires only when a `design_ref` was *supplied* on the component's `.visor.yaml`. It does not (yet) hard-require a `/lo-visual-design` or `/lo-prototype` output as a precondition to *build* a component — it enforces fidelity when an approved design exists, without blocking components that have none. Point `design_ref` at the approved fragment/mockup (a repo-relative path or a URL). The `visor-yaml-design-ref` validate rule confirms it resolves; a stale reference warns.

**Worked example — doc-nav (retroactive proof).** See [`docs/audits/BO-67/`](./docs/audits/BO-67/): the pre-VI-611 doc-nav rendered vs the approved design surfaces exactly the deltas the operator had to hand-catch — medium-gray `--surface-subtle` pills (should be recessed wells darker than the card in both modes), ballooned group-cluster radius (decorative themes inflate `--radius-xl` past a fixed ~12px), title-case oversized labels (should be all-caps mono a step smaller), a weak outlined active pill (should be a vivid accent fill), and group-label caps riding ~2px high off the scope dot.

## Token Rules

Full rules: [`docs/token-rules.md`](./docs/token-rules.md). Key enforcement points for AI-assisted work:

1. **Fallbacks use Gray, not Slate** — `var()` fallbacks must use Tailwind Gray hex values (`#111827`, not `#0f172a`)
2. **Shadows are tokenized** — Use `var(--shadow-xs|sm|md|lg|xl)`, never inline `rgba()` shadows
3. **Strokes are tokenized** — Use `var(--stroke-width-thin|regular|medium|thick)` (Flutter: `context.visorStrokeWidths`); never hardcode border/outline/divider widths
4. **Opacity is tokenized** — Use `var(--opacity-{5|10|12|20|40|50|60|80})` (Flutter: `context.visorOpacity.alphaN`); never hardcode `.withValues(alpha: 0.N)` literals or inline `opacity: 0.N`
5. **Spacing on 4px grid** — Padding/gap/margin use `var(--spacing-N)` tokens
6. **Motion is tokenized** — Transitions use `var(--motion-duration-*)` + `var(--motion-easing-*)`
7. **Focus rings are tokenized** — Use `var(--focus-ring-width)` and `var(--focus-ring-offset)`
8. **Overlay uses token** — Backdrops use `var(--overlay-bg)`
9. **Themes follow 5-section template** — shared → dark → light → framework bridge → creative extensions
10. **Theme-specific tokens are namespaced** — `--space-glass`, `--veronica-warmth`, never bare `--glass`
11. **Font coverage** — Every `--font-*` quoted family must have a matching `@font-face` or Google Fonts `@import` in the same emitted CSS. Set `typography.<slot>.source: visor-fonts|google-fonts`; the build-time `validateFontCoverage` validator catches drift.
12. **Semantic alias surface (VI-451)** — Bare-name intent (`--primary`, `--accent`, `--destructive`, ...), hairline (`--hairline`, `--hairline-strong`), and discrete scales (`--text-N`, `--space-N`) emit in the `visor-semantic` cascade layer. Themes pin per-mode values via flat-key overrides (`primary: "#..."`); bare `primary` resolves to the intent group, prefixed `text-primary` continues to route to the text group.
13. **No magic numbers** — Every value traces to a token or is documented as intentional

## Playbook Reference

The [Low Orbit Playbook](~/Code/low-orbit/low-orbit-playbook/) provides prescriptive methodology for every lifecycle stage. Global skills are installed at `~/.claude/skills/`.

- **`/lo`** — Orchestrator skill. Routes to the right treebranch for any task.
- **`/lo-{treebranch}`** — Direct access to a specific methodology domain.

When facing a decision, load the relevant playbook treebranch before proceeding. The playbook is prescriptive — follow it, don't improvise.

## Vision & Roadmap

Visor's long-term goals, phased roadmap, and detailed specs live in `/docs/`. Read these when working on strategic decisions, planning new features, or understanding priorities:

- [`docs/vision.md`](./docs/vision.md) — Goals, design principles, source material
- [`docs/roadmap.md`](./docs/roadmap.md) — 8-phase plan with current status
- [`docs/component-inventory.md`](./docs/component-inventory.md) — Current vs target components, source material for each
- [`docs/interchange-format.md`](./docs/interchange-format.md) — Design system interchange format spec (draft)
- [`docs/ai-consumability.md`](./docs/ai-consumability.md) — AI agent consumability spec (metadata, manifest, composition recipes, agent-first CLI)
- [`docs/token-rules.md`](./docs/token-rules.md) — Token rules, theme contract, and 5-section theme template

> **Borealis vocabulary:** Visor's `patterns/*.visor-pattern.yaml` are **composition recipes** — an AI-consumability artifact (powering `visor suggest`), distinct from Playbook design-language **patterns**. The directory and extension keep their physical names; only prose uses "composition recipe." See [Borealis Playbook `GLOSSARY.md` §3 "Disambiguating pattern"](~/Code/low-orbit/low-orbit-playbook/GLOSSARY.md#3-disambiguating-pattern).

**Current focus:** Phase 1a — Core Expansion + Theme Architecture Validation (~15 priority components, second standard theme, interactive adaptive tokens, docs theme switcher).

## Publish Gate

The Borealis publish gate prevents drift between the source in this repo and the registry that powers `npx visor add`. Symptom of drift: a VI- ticket is marked Done, the source file ships a new feature (e.g. `valueAs="hero"` on `stat-card`), but `npx visor add stat-card` writes the older version because the CLI hasn't been re-published.

**The check:** [`scripts/visor-publish-smoke.mjs`](./scripts/visor-publish-smoke.mjs) compares this repo's locally-built `packages/cli/dist/registry.json` against the `dist/registry.json` shipped in the latest published `@loworbitstudio/visor` tarball. Any per-file content drift fails the job and names the drifted primitives.

**Run it locally:**

```bash
npm run build -w packages/cli
npm run smoke:publish
```

**In CI:** [`.github/workflows/visor-publish-smoke.yml`](./.github/workflows/visor-publish-smoke.yml) runs the smoke daily at 06:00 UTC, on `workflow_dispatch`, and after every successful `Release` workflow run.

**When it fails:** cut a new `@loworbitstudio/visor` release that includes the drifted primitives. See [`docs/wisdom/W020-publish-coordination-drift.md`](./docs/wisdom/W020-publish-coordination-drift.md) for the failure-class background.

### Governance signal — GitHub PR audit (VI-306)

The smoke detects drift; the audit closes the loop on the **PR** that landed the drifted primitive. When the smoke fails in CI, [`scripts/visor-publish-audit.mjs`](./scripts/visor-publish-audit.mjs) walks `git log` per drifted file, finds the most recent commit that touched it, extracts the `VI-N` reference and PR number from the commit subject (squash-merge `(#N)` suffix), and posts a comment on each affected PR via the built-in `GITHUB_TOKEN` — flagging that the PR landed but its primitive is still missing from the published registry.

The PR is the durable, public artifact connecting a commit to the change that introduced the drift, so this is the right place for the signal. No external API keys live in repo secrets — Linear and other private surfaces stay out of public-repo CI.

**Run the audit locally:**

```bash
npm run build -w packages/cli
npm run audit:publish               # human report
npm run audit:publish -- --json     # machine-readable
GITHUB_TOKEN=... npm run audit:publish -- --post-comments
```

**In CI:** the audit step in [`.github/workflows/visor-publish-smoke.yml`](./.github/workflows/visor-publish-smoke.yml) runs only when the smoke step fails, uses the built-in `GITHUB_TOKEN`, and requires no operator setup. The workflow holds `pull-requests: write` scope only.

**When you see an audit comment on a PR:** treat it as a signal that the change merged but never made it into the published registry. Cut a coordinated release per [`docs/wisdom/W020-publish-coordination-drift.md`](./docs/wisdom/W020-publish-coordination-drift.md); the next smoke run will clear the drift and no further audit comments will fire. See [`docs/wisdom/W029-vi-ticket-publish-governance.md`](./docs/wisdom/W029-vi-ticket-publish-governance.md) for the full governance pattern.

## Environment

- `.env.local` at repo root — contains API keys (if needed)
- `.env.schema` at repo root — documents all env vars with Varlock + Bitwarden SM integration. Run `varlock load` or use `npm run fonts:add` to auto-inject secrets from Bitwarden SM.

## Project Wisdom

Local lessons: [`docs/wisdom/wisdom.md`](./docs/wisdom/wisdom.md)
