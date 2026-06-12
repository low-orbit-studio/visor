# Brand Workbench — HiFi design prototypes

> **Status:** Design phase — approved direction. These are **HTML prototypes on real Visor
> tokens**, not product code. They define the visual + interaction direction for the Brand
> Workbench MVP. The build phase ("Visor-ify" — rebuild with real Visor components) is specced
> in [`BUILD-HANDOFF.md`](./BUILD-HANDOFF.md).

## What's here

| File | What it is |
|---|---|
| `elicit-core.html` | The **core Elicit screen** — the split-screen signature: left derivation spine · center conversational Elicit (modern chat) · right hybrid brand canvas. |
| `journey.html` | The **A→Z journey** — a navigable app where the spine switches between all stages: Start · Strategy · Verbal/Tone · Visual · Prove · Export · Canvas. |
| `shots/` | Rendered screenshots (2 themes × light/dark for the core screen; the full journey walkthrough + portability spot-checks). |
| `shoot.mjs` / `journey-shoot.mjs` | Playwright scripts that render the prototypes to `shots/`. |

## How to view

A static server is the easiest path (the prototypes link real fonts from `fonts.visor.design`
and Fontshare):

```bash
cd docs/design/brand-workbench
python3 -m http.server 4060
# → http://localhost:4060/elicit-core.html
# → http://localhost:4060/journey.html
```

Each prototype has a floating **Preview** switcher (bottom-center) to toggle
**modern-minimal ↔ space** and **light ↔ dark** — the whole surface re-resolves on real tokens,
which is the differentiator made visible. In `journey.html`, click the left **spine** to walk the
stages and flip the **Guided ⇄ Canvas** toggle at its base.

## Token fidelity

The prototypes hand-mirror the real per-mode semantic values lifted from
`packages/docs/app/{modern-minimal,space}-theme.css` into four `html.<theme>.<mode>` blocks; all
component CSS is pure `var(--token)` references, so they faithfully exercise the token **contract**
(surfaces, text, primary/accent, hairlines, shadows, radii, fonts). This is a prototype shortcut —
the build will consume the live theme engine instead.

## The locked direction (what the prototypes encode)

- **Split-screen, always:** left = where you answer/edit (the derivation spine, which is also the
  journey nav); center = the conversational Elicit; right = the brand system rebuilding live.
- **Modern chat:** plain-text assistant turns (no bubbles), soft user bubbles, inline structured
  tools (the onliness mad-lib), suggestion chips, a rounded tool-bearing composer.
- **The adversarial Challenge** is a first-class, distinct (amber) message type with the human
  holding the accept/revise **gate** — never an autonomous strategist.
- **Layered, kind progress:** global line + spine progress card (X of 10, %, encouraging copy) +
  per-section counts + segmented step meter + honest time estimates.
- **Hybrid canvas:** the Brand Record assembling **and** live components "Speaking" in the brand
  voice; tone-by-context rendered on real component states.
- **Guided → Canvas:** guided walks you to a complete draft; Canvas is free-edit, any block in any
  order.
- **BYOK, local-first:** keyless = a full manual tool; your key = the AI turbo.

All content is **Visor's own Brand Record** (true dogfood) — see
[`../../brand/visor-brand-strategy.md`](../../brand/visor-brand-strategy.md).

## Source-of-truth docs

- Roadmap: [`../../brand-workbench-roadmap.md`](../../brand-workbench-roadmap.md)
- Research (VI-498): [`../../audits/brand-workbench-product-research.md`](../../audits/brand-workbench-product-research.md)
- Brand data model: [`../../brand/visor-brand-record.yaml`](../../brand/visor-brand-record.yaml)
- Token rules: [`../../token-rules.md`](../../token-rules.md)
