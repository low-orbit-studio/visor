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

## Playbook Reference

The [Low Orbit Playbook](~/Code/low-orbit/low-orbit-playbook/) provides prescriptive methodology for every lifecycle stage. Global skills are installed at `~/.claude/skills/`.

- **`/lo`** — Orchestrator skill. Routes to the right treebranch for any task.
- **`/lo-{treebranch}`** — Direct access to a specific methodology domain.

When facing a decision, load the relevant playbook treebranch before proceeding. The playbook is prescriptive — follow it, don't improvise.

## Environment

- `.env.local` at repo root — contains API keys (if needed)

## Project Wisdom

Local lessons: [`docs/wisdom/wisdom.md`](./docs/wisdom/wisdom.md)
