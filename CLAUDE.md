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

## Token Rules

Full rules: [`docs/token-rules.md`](./docs/token-rules.md). Key enforcement points for AI-assisted work:

1. **Fallbacks use Gray, not Slate** — `var()` fallbacks must use Tailwind Gray hex values (`#111827`, not `#0f172a`)
2. **Shadows are tokenized** — Use `var(--shadow-xs|sm|md|lg|xl)`, never inline `rgba()` shadows
3. **Spacing on 4px grid** — Padding/gap/margin use `var(--spacing-N)` tokens
4. **Motion is tokenized** — Transitions use `var(--motion-duration-*)` + `var(--motion-easing-*)`
5. **Focus rings are tokenized** — Use `var(--focus-ring-width)` and `var(--focus-ring-offset)`
6. **Overlay uses token** — Backdrops use `var(--overlay-bg)`
7. **Themes follow 5-section template** — shared → dark → light → framework bridge → creative extensions
8. **Theme-specific tokens are namespaced** — `--space-glass`, `--veronica-warmth`, never bare `--glass`
9. **No magic numbers** — Every value traces to a token or is documented as intentional

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
- [`docs/ai-consumability.md`](./docs/ai-consumability.md) — AI agent consumability spec (metadata, manifest, patterns, agent-first CLI)
- [`docs/token-rules.md`](./docs/token-rules.md) — Token rules, theme contract, and 5-section theme template

**Current focus:** Phase 1a — Core Expansion + Theme Architecture Validation (~15 priority components, second standard theme, interactive adaptive tokens, docs theme switcher).

## Environment

- `.env.local` at repo root — contains API keys (if needed)
- `.env.schema` at repo root — documents all env vars with Varlock + Bitwarden SM integration. Run `varlock load` or use `npm run fonts:add` to auto-inject secrets from Bitwarden SM.

## Project Wisdom

Local lessons: [`docs/wisdom/wisdom.md`](./docs/wisdom/wisdom.md)
