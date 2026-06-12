# Brand Workbench MVP — Build Handoff

> Paste this into a fresh session to start the **build phase**. The design is approved; this phase
> re-implements the approved HiFi as a real **React + Visor-component** surface, theme-agnostic,
> wired progressively. Use existing Visor components everywhere possible; every **new** component is
> its own VI ticket.

---

## Where we are

The design phase is **complete and approved**. HiFi prototypes (HTML on real Visor tokens) live at
`docs/design/brand-workbench/`:

- `elicit-core.html` — the core Elicit screen (split-screen: spine · conversational chat · hybrid canvas).
- `journey.html` — the navigable A→Z journey (Start · Strategy · Verbal/Tone · Visual · Prove · Export · Canvas).
- `shots/` — screenshots across modern-minimal & space, light + dark. `README.md` documents how to view.

These are the **visual + interaction truth** for the build. They are prototypes (hand-mirrored
tokens, no real components, no AI) — the build replaces all of that with the real stack.

## Locked decisions (do not relitigate — see `docs/brand-workbench-roadmap.md`)

- It's a **tool** (AI brand strategist), not a brand book. Output = a **brand system** (theme +
  Brand Record), rendered live, agent-readable.
- **Core UX = split-screen:** left **derivation spine** (Start→Positioning→Essence→Personality→
  Pillars→Voice→Tone→Visual→Prove→Export, the chain is load-bearing and is also the nav) · center
  **conversational Elicit** · right **hybrid canvas** (Record assembling + live components Speaking).
- **Chat = modern** (Claude.ai/ChatGPT-class): plain assistant text, soft user bubbles, inline
  structured tools (onliness mad-lib), suggestion chips, rounded composer.
- **Challenge** = first-class adversarial message (amber), **human holds the gate**. AI drafts &
  challenges; never an autonomous strategist.
- **Progress** layered & kind: global line + spine progress card + per-section counts + segmented
  step meter + time estimates + encouraging copy.
- **Guided → Canvas:** guided walks to a complete draft; Canvas = free-edit board, any block/order.
- **BYOK, local-first:** keyless = full manual tool; key = the AI turbo. Provider seam Claude-first.
- MVP dogfoods **Visor's own brand** (`docs/brand/visor-brand-record.yaml`).

## Goal of this phase

Build the Brand Workbench front-end with **real Visor components on the live theme engine**, so the
entire surface **obeys any selected theme**. Start with the structural shell (no AI), then wire BYOK
+ the AI loop.

## Hard constraints

1. **100% theme-agnostic.** Every value through tokens — no hardcoded color/spacing/radius/shadow/
   stroke/opacity (`docs/token-rules.md`). It must render correctly under **all stock themes AND the
   Low Orbit private themes** at `/Users/justinschier/Code/low-orbit/visor-themes-private/themes`
   (animal, blacklight, blacklight-pro, entr, kaiah, knowmentum, reference-app, solespark, strata,
   veronica). Theme-proof against at least 2 stock + 2 private themes, light + dark.
2. **Use existing Visor components** (`packages/docs/components/ui/`) — don't hand-roll what exists.
3. **Stack:** React + TS · CSS Modules + CSS custom properties · CVA for variants · Radix only for
   complex behavior · Phosphor icons · Vitest/RTL. No Tailwind, no CSS-in-JS.
4. **Every new component = its own VI ticket** (branch `vi-<N>-<slug>`, PR `VI-<N> feat: …`), built
   to `/lo-component-library`: metadata + `when_to_use`, tests, docs (README + fumadocs), token-pure.
5. **Design-first is done** — build to the prototypes. Visual review (browser + screenshots across
   ≥2 stock + ≥1 private theme, light+dark) before each land. Commit per change; worktree from start.

## Component mapping — reuse vs. create

**Audit `packages/docs/components/ui/` first.** These already exist and should be reused (verify
APIs): `button`, `card`, `badge`, `text`, `heading`, `input`, `field`, `fieldset`, `label`,
`textarea`, `separator`, `tabs`, `progress`, `skeleton`, `alert`, `banner`, `toast`, `tooltip`,
`avatar`, `chip`, `status-badge`, `status-dot`, `stepper`, `code-block`, `switch`, `scroll-area`,
`empty-state`, `key-value-list`, `color-swatch`, `color-bar`, `sidebar`, `navbar`, `slider-control`,
`score-indicator`, `file-upload`, `command`, `kbd`.

**Likely NEW (each a VI ticket — but prefer extending an existing primitive via CVA over net-new):**

- **DerivationSpine** — vertical chain with done/active/locked states, section groups + counts, and a
  progress summary card. (Assess: a `stepper` variant?)
- **ConversationThread / ChatMessage** — modern chat turn (assistant plain text + avatar; soft user
  bubble); may just be a composition, not a component.
- **StructuredPrompt / SlotInput** — the inline "mad-lib" tool (onliness fill-in-the-blank).
- **ChallengeCard** — adversarial, first-class, with gate actions ("Use X" / "I'll rewrite" + "you
  hold the gate").
- **LiveBrandCanvas** — Record sections assembling + a "Speaking" specimen wrapper that renders real
  components in the brand voice; ghost/deriving states.
- **TonePreview** — context→component-state specimen (error/success/empty/loading/validation-warning).
- **CoherenceCheck** + **ScoreRing** — audit row (pass/warn/fail + fix action) and the score ring.
- **CanvasBoard / BrandBlock** — editable brand blocks for free-edit mode.
- **Composer** (chat input w/ tools + model chip) and **ProgressMeter** (segmented) — likely
  `progress`/`input` variants.
- **KeyStateChip** — BYOK/model status (`badge`/`chip` variant).

Deliver the audit + gap list as the first artifact, then file the new-component tickets.

## Where it lives

Recommend a **new docs app surface** (e.g. a `packages/docs/app/brand-workbench` route) or a
dedicated workbench package — decide with `/lo-architect-nextjs`. **Not** the read-only
`playgrounds/sections/*` (those are the *output/preview* layer; the Workbench is the *authoring*
front-end). The `brand-strategy` data model is VI-505.

## Suggested phasing (recommend an epic + sub-tickets)

1. **Component audit + gap list** → file VI tickets for each new component.
2. **Static Visor-ified core screen** — spine + chat + canvas, real components + live theme engine,
   theme-proofed across stock + private themes. Content = Visor's Brand Record fixtures (no AI yet).
3. **Journey stages** as routes/states (Start, Verbal/Tone, Visual, Prove, Export, Canvas).
4. **Guided ⇄ Canvas** state.
5. **BYOK + AI seam** (Claude-first, local-first): the Elicit loop, the adversarial challenge, the
   coherence auditor.
6. **Export**: read/write the `brand-strategy` block + emit the agent manifest.

## Done when

Renders faithfully to the prototypes; obeys all stock + private themes (light + dark); passes a11y
(WCAG 2.1 AA); tests + docs updated; each new component shipped under its own VI ticket with visual
review.

## Reference

- Prototypes + README: `docs/design/brand-workbench/`
- Roadmap: `docs/brand-workbench-roadmap.md` · Research: `docs/audits/brand-workbench-product-research.md`
- Brand data: `docs/brand/visor-brand-strategy.md` + `docs/brand/visor-brand-record.yaml`
- Token rules: `docs/token-rules.md` · Components: `packages/docs/components/ui/`
- Private themes: `/Users/justinschier/Code/low-orbit/visor-themes-private/themes`
- Playbook: `/lo-component-library`, `/lo-architect-nextjs`, `/lo-visual-design`
