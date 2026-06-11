# Brand Workbench — Roadmap v2

> **Status:** Canonical product roadmap for the Brand Workbench.
> **Supersedes** the phase plan in the VI-498 research spike
> ([`docs/audits/brand-workbench-product-research.md`](./audits/brand-workbench-product-research.md)).
> It **keeps** that spike's researched substance — the derivation chain, the ~12-section
> minimum-lovable core, the Brand Record data model, and the framework stack — and
> re-centers it on the product direction locked with the operator: an **AI brand-strategist
> tool**, BYOK, built to run across the entire Low Orbit portfolio.

---

## North Star

> **An AI brand strategist that takes you from nothing to a complete, living, agent-readable
> brand system — and does it for every brand in the portfolio.**

Frontify and Zeroheight *host or document* a brand; Visor **compiles** one — from typed intent,
against a live token engine, for humans *and* agents. Visor's own brand is the public flagship
exemplar; every Low Orbit project becomes a **private brand system** authored in the same tool.

The product is not a brand book you look at. It is the tool you **build a brand in**.

---

## What it is (locked decisions)

| Decision | Call |
|---|---|
| Product | The **tool**, not a brand book you look at |
| Output | A **brand system** = theme (tokens) + Brand Record (strategy/verbal), rendered live, agent-readable |
| MVP | **Dogfood the Elicit loop on Visor's own brand** |
| Core UX | **Conversational Elicit** (AI interview) · split-screen, brand assembles live · guided-to-draft → free canvas |
| AI | The **premise**, not a feature. Killer = the adversarial strategist; moat = agent-readable output |
| Cost model | **BYOK.** No key = full manual tool; your key = the AI turbo. Local-first *(parked)* |
| Portfolio store | Private brand systems → **`brand-systems-private`** (rename of `visor-themes-private`) |

---

## The user journey (A → Z)

The user walks **down a derivation chain** (order is load-bearing), guided by AI that drafts and
a human who judges, **watching the brand system assemble itself live on real product chrome** the
whole way — then refines freely and exports.

```
 A — empty slate                                                      Z — finished brand system
 │                                                                                    │
 ▼      ① START         ② STRATEGY         ③ VERBAL          ④ VISUAL     ⑤ PROVE  ⑥ EXPORT
        name +          onliness ──▶        voice ──▶          tokens       coherence  .visor.yaml
        public/         essence  ──▶        tone-by-           (colors→53)   checks:    brand-strategy
        private         personality         context            logo/marks    pillar     + agent manifest
        (import?)       + archetype         lexicon            clearspace     governs    + live book
                            │                                  /misuse        nothing?      │
                            ▼                                                 contrast   ┌──┴───┐
                        PILLARS (3–5, each                                    fails?   public  private
                        linked to the tokens     every step renders LIVE →             repo   brand-systems-
                        it governs)               on the right, instantly                      private
```

**Two constants across the whole journey:**

1. **Split screen, always.** Left = where you answer/edit. Right = the brand system **rebuilding
   live on real components** with every change. Assembling it in front of you *is* the experience —
   the differentiator turned into UX, not a "Preview" button.
2. **Guided to a draft, then free to refine.** First pass = a guided conversational **Elicit** flow
   that walks you to a *complete* draft. After that = a **canvas** where you edit any block in any
   order. AI drafts every field; the human holds the "is this actually *only*?" gate.

---

## Where AI is leveraged (the killer feature) + BYOK

AI is the **premise**, not a feature: the target user (a solo founder, a small studio) cannot afford
a brand strategist, so **the AI is the strategist.**

| Stage | The AI move | Level |
|---|---|---|
| Start | Ingest an existing site / deck / notes → first-draft hypothesis | Strong onboarding |
| Strategy | Runs the expert interview conversationally — you never need to know the frameworks | **KILLER — the front door** |
| Strategy | Drafts positioning, then **adversarially challenges it** ("that's not *only* — push harder") | **KILLER — fights the generic mean** |
| Strategy | Derives essence → personality → pillars down the chain | Strong (each a gated draft) |
| Verbal | Generates **tone-by-context, rendered live** in the real component | **KILLER — impossible for a PDF tool** |
| Verbal | Always-on **voice-linter**: paste copy → score + rewrite to voice | **KILLER — recurring daily value** |
| Visual | Suggests palette/type from strategy; generates misuse "don'ts" | Assistive (taste stays human) |
| Prove | **Coherence auditor**: dead pillars, voice/copy mismatch, AA fails | **KILLER — the self-proving system** |
| Export | Brand Record is **agent-readable** → every downstream AI stays on-brand | **KILLER — the moat** |

**Where AI must NOT drive:** the **differentiation call** ("is it actually *only*?") and **visual
taste.** LLMs regress to a safe, generic mean — fatal in a differentiation discipline. Everywhere
the pattern is **AI drafts and challenges → human decides.** That human gate is what keeps the
output from being the same beige brand every GPT wrapper produces.

**BYOK (Bring Your Own Key).** Visor is free/OSS/copy-and-own, so it cannot eat AI inference cost —
and BYOK is *more* on-brand than eating it would be: your brand strategy is sensitive IP that, with
BYOK, **never touches our servers.** Your keys, your data, your agents, your brand.

- **Keyless is still a real product:** no key = full manual tool (hand-author the Record, render
  live, run coherence checks, export). **AI accelerates; it never gates.**
- **Local-first** *(parked default)*: inference runs where the user already is — CLI / local
  Workbench — so the key never leaves their machine. A hosted managed-key tier is a possible later
  product, not this.
- **Provider:** Claude-first (best at nuanced draft + adversarial coaching), behind a thin provider
  seam so BYOK can be any key. The strategist is only as good as the key behind it — recommend a
  model floor and show cost estimates (it's the user's spend).

---

## Substance carried over from the VI-498 research

- **The derivation chain — order is load-bearing:** `Positioning → Essence → Personality →
  Pillars / Voice → Tone`. Author voice first and the adjectives are unfalsifiable. The UX enforces
  this gravity (AI drafts downstream *from* upstream).
- **The ~12-section minimum-lovable core** (Voice + Pillars alone is *decisively not enough*):

  | Strategy | Verbal | Visual / Guideline |
  |---|---|---|
  | Positioning (onliness) · Essence · Personality · **Pillars** | Voice · **Tone-by-context** · Lexicon | Logo/lockups *(shipped)* · Clearspace/min-size *(promote to enforced)* · Misuse · Color/Type *(shipped)* |

- **Pillars are self-proving:** each pillar *links to the tokens/components it governs*. A pillar
  that governs nothing is a visible smell a coherence check can fail — the slogan becomes a
  checkable claim.
- **The Brand Record data model:** a new top-level **`brand-strategy`** block in `.visor.yaml`,
  sibling to `brand` (not nested — different lifecycle, consumer, and privacy posture). Validated,
  linked, and serialized to an agent manifest — *not* expanded into derived tokens.
- **The authoring framework stack:** Neumeier **onliness** (the spearhead sentence) · **Brand-Key**
  one-pager (the structured spine) · **12 archetypes** (the personality/voice key) · Aaker
  core/extended (the override mechanic) · Keller pyramid (later diagnostic only).
- **The AI stance:** AI **structures, drafts, and adversarially challenges**; the human holds the
  taste gate. Never an autonomous strategist.

---

## Phases

| Phase | Goal | Key work |
|---|---|---|
| **0 · Foundations** *(largely done)* | The data substrate + preview surfaces exist | Brand Record schema ✅ · read-only surfaces shipped (strategy, pillars, verbal, messaging house, taglines, color/accessibility) — **reframed as the preview/output layer**, not the product |
| **1 · MVP — the Elicit loop** | Chat your way into **Visor's own** brand | Conversational AI strategist for the **generative core** (onliness→essence→personality→pillars→voice→tone) · the **adversarial "is it *only*?" coach** · split-screen live assembly · **BYOK (local-first)** · writes + exports Visor's Brand Record |
| **2 · Full single-brand Workbench** | One brand, end to end, *designed* | Finish the ~12-section core (verbal depth; promote clearspace/min-size + misuse) · **free-edit canvas** refine mode · **coherence auditor** · **design** the preview surfaces (currently undesigned) · `visor brand init` CLI |
| **3 · Portfolio + private** | "Use it on every project" | **`brand-systems-private`** rename + public/private split · onboard the **first real project** as a private brand system · provider abstraction (any BYOK) |
| **4 · Operational depth** | The mature brand book | Messaging house *(started)* · grammar/mechanics · holistic accessibility · governance/versioning · downstream **agents consume the manifest** |
| **5 · Long tail** *(allow, don't build)* | Extensibility | Archetype application · iconography/motion/photography · co-branding · templates — schema permits, build on demand |

---

## Parked / open decisions

- **Local vs. hosted** — defaulting **local-first**; revisit at Phase 1 build.
- **Monetization** — BYOK makes AI cost-neutral; money (if any) lives in the portfolio/private
  layer or a future managed-key tier. Separate conversation.
- **Schema-copies drift** — the spike flagged the two `visor-theme.schema.json` copies are out of
  sync; reconcile **before** the `brand-strategy` block lands.

---

## What this changes about work in flight

**Stop building read-only surfaces.** The surfaces shipped so far (messaging house, taglines,
color/accessibility) are the *output* layer and still need design — they are Phase 2/4 work, not the
product. The next thing built should be the **Elicit front-end**, because that is the product.

---

## Source material

- [`docs/audits/brand-workbench-product-research.md`](./audits/brand-workbench-product-research.md) — the VI-498 research spike (frameworks, derivation chain, ~12-section core, data model, competitive scan)
- [`docs/brand/visor-brand-strategy.md`](./brand/visor-brand-strategy.md) + [`docs/brand/visor-brand-record.yaml`](./brand/visor-brand-record.yaml) — Visor's own brand (the dogfood content + the data model in practice)
- `packages/docs/components/playgrounds/sections/` — the existing read-only surfaces (the preview/output layer to evolve)
