# Zero-To-Brand AI Interview — Concept Brief & Sizing

> **VI-499.** Think through and size an AI tool that interviews a founder and produces a complete brand strategy + guidelines, output as a structured `brand-strategy` Brand Record that Visor's Brand Workbench renders. Out of scope: building it.
>
> **Prior art:** [`docs/audits/brand-workbench-product-research.md`](./brand-workbench-product-research.md) (VI-498). WS4 covers founder-elicitation methodology and the existing-tool scan; WS5(a) defines the Brand Record schema this tool emits; WS5(f.6) is the original "take the bet, framed narrowly" recommendation. This brief is the focused sizing layer that turns that recommendation into a Go decision.

## TL;DR

**Go — but as a narrow, structurally-defensible bet, not a moonshot.** Build it as a **Visor Brand Workbench mode** ("Elicit") with a companion **`visor brand init`** CLI, both writing the same `brand-strategy` block in `.visor.yaml`. The structured 80% (interview, framework-fit, first-draft) is squarely inside current LLM capability; the hard 20% (coherence, taste) gets sidestepped by framing the tool as a **structuring first-draft accelerator**, not an autonomous strategist. The MVP is a quarter of focused work *after* two prerequisites land: the `brand-strategy` schema (~M ticket) and the Brand Workbench Phase 1 surfaces that render it (~L). Skip the standalone-SaaS path for v1 — extraction into `@loworbitstudio/visor-brand` is a Phase-3 move once Visor's own brand has dogfooded the flow end-to-end.

## What it is

A guided AI interview that takes a founder from a blank page to a **first-draft, framework-grounded brand strategy** in roughly an hour, then writes the result as a structured `brand-strategy` Brand Record that the Visor Brand Workbench renders live alongside the running theme.

In one sentence: *AI strategist on rails — conversational where founders are good, structured where founders are bad.*

What it produces (the artifact):

- A populated `brand-strategy:` block in the founder's `.visor.yaml` (or a draft `.brand-strategy.yaml`), conforming to the Brand Record schema defined in VI-498 WS5(a).
- A live-rendered Brand Workbench view of that record: positioning, essence, personality, archetype, pillars (each linked to the tokens/components it governs), voice traits with do/don't pairs, tone keyed to UI states (`error`, `success`, `empty`, `loading`), lexicon, and a message-house roof.
- A short reviewable markdown summary (the brand "one-pager") generated from the same record — for the founder to share with collaborators / sleep on / push back against.

What it explicitly is **not**:

- Not a logo / visual-identity generator. That's a separate, much-harder problem the existing AI tools (Looka, Brandmark, Tailor) already occupy and ceiling at.
- Not a brand-content engine (Jasper's lane). It outputs *strategy as data*, not on-brand copy at scale.
- Not a replacement for a senior strategist. It is a first-draft accelerator — coherent, structured, framework-grounded — that a human can refine.

## The interview flow

The flow is the canonical funnel from VI-498 WS4, conducted conversationally rather than as a six-hour workshop. Each step has a fixed prompt set, a framework target, and a structured output. The LLM's job is **adaptive elicitation** (follow-ups when answers are thin) and **framework-fit** (snap free-text answers onto the schema), not improvisation.

| # | Stage | Source framework | What it produces | The elicitation move |
|---|-------|------------------|------------------|---------------------|
| 1 | **Horizon** | GV Brand Sprint #1 | Long-horizon purpose | "Where could this company plausibly be in 20 years? What changed in the world because of it?" Free-text → essence seed. |
| 2 | **Purpose** | Sinek Golden Circle (Sprint #2) | `why`, draft `essence` | "*What* do you make? *How* is it different? *Why* does it exist?" Three short answers; the *why* feeds essence. |
| 3 | **Audience** | Sprint #4 | Ranked audience list | "List everyone this is for. Rank them. When two of them conflict — which one wins?" Forces priority, kills "everyone." |
| 4 | **Values** | Value-sort / Sprint #3 | Three core values | LLM brainstorms ~20 candidate values from the answers above, then runs a card-sort dialog: *not important / important / very important*, force-rank to three. Gut-check prompt: "Which would you hold even at a cost?" Mitigates the aspirational-virtue trap. |
| 5 | **Personality** | Sprint #5 sliders | `personality[]` with antonym pairs | Pre-set slider pairs (*friendly↔authoritative*, *playful↔serious*, *modern↔classic*, etc.). Founder places a dot; LLM converts coordinate to a trait + sharpening antonym ("precise, not fussy"). |
| 6 | **Archetype** | Mark & Pearson (12 archetypes) | `archetype.primary` + `secondary` | Card-sort over the twelve. LLM proposes a primary based on stages 1–5, then asks the founder to confirm or override; secondary as runner-up. One enum field; deterministic seed for voice. |
| 7 | **Positioning** | Geoffrey Moore mad-lib | `positioning.{category, differentiation}` | The five-slot fill-in: *For \[X\] who \[need\], we are the \[category\] that \[benefit\], unlike \[alt\], because \[diff\].* LLM proposes the slots from prior answers; founder corrects. |
| 8 | **Onliness** | Neumeier *Zag* | `positioning.onliness` | "We are the *only* \[category\] that \[benefit\]." LLM applies Neumeier's litmus: if it can't truthfully say *only*, it loops back to stage 7. The brutal test is the value here, not the sentence. |
| 9 | **Message** | Message house | `pillars[]` + draft `messaging.roof` | LLM derives 3 pillar candidates from positioning + values + personality, asks founder to confirm/edit, then attaches proof points. The roof line emits last. |

**Voice + tone** are *derived*, not elicited directly. The LLM generates them from `personality[]` and `archetype.primary`, then validates with a small live preview: a real `Button`, `Alert.error`, and empty-state — rendered in the founder's voice. Founder pushes back; LLM iterates. This is the surface most directly proven by *seeing it run* on real UI, which is why it co-locates with the Workbench.

**Lexicon** is generated last as a use/avoid pairs list, seeded from the personality antonyms and the archetype's typical vocabulary, then surfaced for founder review.

**Adaptive rules** the LLM applies throughout:

- *Thin answers* (<10 words on an open prompt) trigger a clarifying follow-up — once per stage, then move on.
- *Contradictions across stages* (Sage positioning + Jester personality) trigger an explicit "these don't agree — which one is the real brand?" prompt. This is the LLM doing coherence-checking, which is the hard 20% — see Feasibility.
- *Generic-virtue values* ("integrity, innovation, excellence") trigger the cost-test: "Which would you hold even if it cost you a deal? Which have you *already* held under pressure?"
- *Aspirational positioning* (claims unsupported by stages 1–4) triggers the proof-point gate: "What evidence backs this? Cite three." If the founder can't, the positioning gets a `confidence: weak` flag in the output.

## Output → Visor brand model mapping

The output is the `brand-strategy` Brand Record from VI-498 WS5(a), a new top-level block in `.visor.yaml` (sibling to `brand`, not nested inside it). Every interview stage writes to specific fields:

| Interview stage | Writes to field(s) | Notes |
|-----------------|--------------------|-------|
| 1. Horizon | (none direct; seeds 2) | Horizon is internal context for the LLM, not a persisted field. Optional `manifesto.horizon` string for the about-page. |
| 2. Purpose | `essence: [...]` (2–3 words) · `why: "..."` | `why` is single-seed for manifesto, per WS5(c). |
| 3. Audience | `audience.primary` · `audience.tiers[]` | Ranked list; primary is the one that wins conflicts. |
| 4. Values | (informs `personality`, `pillars`) | Not its own first-class field in v1 — values are upstream context. (Open question: do values become a field? See below.) |
| 5. Personality | `personality[]` with `{trait, not}` antonym pairs | Slider coordinates → trait + sharpening antonym. |
| 6. Archetype | `archetype.primary` · `archetype.secondary` | Two enums from the twelve. |
| 7. Positioning | `positioning.category` · `positioning.differentiation` · `positioning.moore: {target, need, benefit, alt, diff}` | Moore slots persisted for traceability. |
| 8. Onliness | `positioning.onliness: "..."` | The Neumeier sentence; the single most-load-bearing field. |
| 9. Message | `pillars[].{id, statement, governs}` · `messaging.roof` · `messaging.pillars[]` (id refs) | Pillars in Phase 1; full message house with proof points in Phase 2. |
| Derived | `voice.traits[].{name, do, dont, example}` · `tone.{error, success, empty, loading}` · `lexicon[].{use, avoid}` | Generated from personality + archetype, founder-edited. |
| Defaults | `core: ["positioning", "essence", "pillars"]` · `visibility: public\|private` | Aaker core/extended split + privacy posture. |

The interview never touches the visual `brand` block (logos, marks, color, type) — that's the existing asset-resolution surface. Strategy is separate from identity by design.

A reference output sketch:

```yaml
brand-strategy:
  positioning:
    onliness: "The only sneaker that adapts to the way your foot actually moves."
    category: "performance footwear"
    differentiation: "biomechanic-aware fit"
    moore:
      target: "everyday athletes"
      need: "shoes that don't fight their stride"
      benefit: "less fatigue, fewer injuries"
      alt: "stability-or-cushion brand binaries"
      diff: "per-foot adaptive geometry"
  essence: ["adaptive", "honest", "alive"]
  why: "Because every foot is different, and footwear has been pretending otherwise for 50 years."
  personality:
    - trait: "candid"; not: "blunt"
    - trait: "scientific"; not: "clinical"
    - trait: "warm"; not: "saccharine"
  archetype:
    primary: "explorer"
    secondary: "sage"
  pillars:
    - id: "adaptivity"
      statement: "The shoe meets the foot, not the other way around."
      governs: { tokens: ["--primary"], components: ["product-card", "hero"] }
    - id: "evidence"
      statement: "Every claim has data behind it."
      governs: { components: ["proof-block", "study-citation"] }
  voice:
    traits:
      - name: "plainspoken"; do: "Say it once."; dont: "Hedge with qualifiers."
      - name: "specific"; do: "Name the millimeter."; dont: "Reach for vague benefits."
  tone:
    error: { feeling: "calm, accountable", example: "That didn't go through. Here's why — and how to fix it." }
    success: { feeling: "quietly affirming", example: "Saved. You're set." }
    empty: { feeling: "inviting", example: "Nothing here yet. Add your first run." }
    loading: { feeling: "unhurried", example: "Reading your stride…" }
  lexicon:
    - use: "stride"; avoid: "gait"
    - use: "adaptive"; avoid: "smart"
  messaging:
    roof: "Footwear that meets your stride."
    pillars: ["adaptivity", "evidence"]
  core: ["positioning", "essence", "pillars"]
  visibility: public
```

Every field has a one-stage-of-the-interview provenance. The schema is the contract; the interview is the friendly front-end that writes it.

## Where it could live

Four candidate homes, evaluated against three lenses: **strategic fit** (does it strengthen Visor's thesis?), **distribution** (can it reach users?), and **engineering cost** (what does it actually take to build?).

### Option A — Visor Brand Workbench "Elicit" mode (recommended)

The interview sits as a guided mode inside the Brand Workbench, alongside the existing brand-rendering surfaces. The output writes directly to the founder's `.visor.yaml` (or a fresh one if they're starting from scratch), which the Workbench then renders live.

**Pros:**
- Maximally cohesive: the elicitation writes data the rest of Visor already consumes. There's no integration cost — the moment the Brand Record exists, the Workbench renders it.
- Strongest possible thesis proof: "Visor compiles your brand from typed intent" extends from tokens up to brand strategy. The Elicit mode is the on-ramp.
- Dogfooded: Visor's own brand is the first one through it. Public exemplar built in.
- Discoverable to anyone already on Visor.

**Cons:**
- Requires the Brand Workbench Phase 1 surfaces to exist first (prerequisite chain).
- Less discoverable to founders not yet on Visor.

### Option B — `visor brand init` CLI

The same elicitation funnel, run from a terminal as an agent-first command. Emits `.visor.yaml` to disk. Companion to A, not a replacement for it.

**Pros:**
- Matches Visor's AI-consumability ethos: agents can run the elicitation against a project spec without a UI.
- Useful in non-Visor projects: cargo a `.brand-strategy.yaml` into any repo as a portable strategy file.
- Cheap to add once the elicitation engine exists.

**Cons:**
- Conversational UX is impoverished on a CLI — sliders, card-sorts, and live previews want a richer surface. Best as a *companion* to A, not standalone.

### Option C — Standalone mini-SaaS (`zerotobrand.ai` or similar)

A public web app at its own domain. Founder signs up, runs the interview, gets a downloadable brand kit. Optional paid tier for export to Figma / Notion / etc.

**Pros:**
- Reaches founders who'd never adopt a design system.
- Clean indie-product story; chargeable on its own (small ARR upside).
- Distribution surface (SEO, sharing).

**Cons:**
- **Strategically off-thesis.** Visor's edge is "design intent as data, in your repo." A web-only SaaS gives that up — the output stops being a portable file that compiles in your project.
- Engineering cost ~3× higher: auth, payments, sessions, hosting, support, abuse mitigation.
- Competes with custom GPTs on price floor — the GPT version is free.
- Adds a product surface to operate before the underlying schema is even validated.

### Option D — Playbook methodology (prompts + agent, no UI)

Ship the elicitation as a Playbook skill (`/lo-brand-init`) — a structured prompt sequence + custom agent — with no dedicated UI. The output is markdown + YAML the operator pastes into a project.

**Pros:**
- Cheapest by far. Could ship in days.
- Matches the Playbook's prescriptive-methodology ethos.
- Useful internally for Low Orbit client work immediately.

**Cons:**
- No live brand-rendering, so no proof-by-seeing-it. Strategy stays prose, not data.
- Misses the structural advantage: the Workbench is what makes the output *self-proving*.
- Doesn't reach external founders meaningfully.

### Recommendation

**A + B, in that order.** Build the Elicit mode as the primary surface (the rich, live-rendered experience), with `visor brand init` as a thin CLI wrapper over the same engine for agent-first use. Defer C until A+B have been in the wild long enough to know whether the standalone path is structurally different (it likely isn't — the schema is the product). Defer D unless we want a fast internal-only stopgap before A ships.

**The decisive argument for A+B over C:** Whatever emits the brand strategy should be the *same structured object* the rest of Visor consumes. Build the data model first; the elicitation flow is then a friendly front-end that writes it. A SaaS that doesn't write to Visor breaks the thesis.

**Future option:** When `@loworbitstudio/visor-brand` is extracted (the package path from VI-498 WS3), the Elicit mode can ship with it as a hosted standalone — re-using all the engine work. That's the right moment to revisit C, not now.

## Feasibility + MVP scope

### What's actually easy

The structured part — and it's most of the funnel:

- **Stages 1–9 intake.** LLMs do conversational structured-Q&A well. The prompts are public; the schemas are finite. This is well inside current capability.
- **Framework-fit.** "Given these answers, fill the Moore slots" / "Given these traits, which of twelve archetypes fits" — these are constrained classification tasks LLMs are good at.
- **First-draft emission.** Generating `voice.traits[]` from `personality[]` + `archetype.primary`, generating `tone` examples for a fixed set of UI states — all well inside current capability.
- **Round-trip rendering.** Once `brand-strategy` exists in `.visor.yaml`, the Workbench's existing rendering machinery shows it. No new render path needed.

### What's actually hard

Three rising ceilings that the design must consciously work *around*, not pretend to solve:

1. **Coherence across artifacts** (medium). The LLM will happily emit a Sage positioning with a Jester voice. The fix is a *coherence-check pass*: after the first draft, re-run a check agent that scores cross-field consistency (positioning ↔ archetype ↔ voice ↔ tone) and flags drift for founder review. This is real engineering, not a prompt. **MVP move:** ship a simple check ("does the archetype's typical voice match the generated voice?"), flag mismatches in the Workbench, defer auto-resolution.
2. **Taste — the strategic differentiation ceiling** (hard). LLMs regress to a safe, generic mean, which is *actively harmful* in a differentiation discipline. An onliness statement that isn't actually "only" is worse than none. **MVP move:** *frame the tool honestly.* It produces a structured, framework-grounded v1 — not a finished strategy. The Neumeier litmus ("is this actually only?") runs as an explicit gate the founder confirms. We do not pretend the LLM is a strategist.
3. **Visual identity from strategy** (very hard, out of scope). Turning the strategy into a coherent logo/type/color system at pro quality is what the existing AI tools already can't do well. Visor sidesteps this entirely: the theme engine *already* compiles design intent into tokens. The Elicit mode writes strategy; the theme engine produces tokens; the Workbench renders them. Visual identity remains a human discipline; the tool doesn't try to automate it.

### MVP scope

The MVP slice that proves the bet:

| Component | What it does | Phase |
|-----------|--------------|-------|
| **Brand Record schema** (`brand-strategy` block) | The data contract. Without this, nothing else is portable. | **Prerequisite** (separate ticket — call it M) |
| **Workbench Phase 1 rendering** | Renders a `brand-strategy` block as live surfaces: positioning, essence, personality, archetype, pillars (with `governs` highlights), voice, tone keyed to real UI states. | **Prerequisite** (separate Phase 1 ticket cluster — L) |
| **Elicit mode v0** — the interview engine | LLM-driven 9-stage funnel. Conversational UI in the Workbench. Writes to `brand-strategy`. | **MVP — this ticket family** |
| **Coherence check v0** | Single-shot consistency pass after the first draft. Flags mismatches; does not auto-fix. | **MVP** |
| **Onliness litmus gate** | Explicit founder-confirmation step on the positioning sentence. No bypass. | **MVP** |
| **`visor brand init` CLI** | Same engine, terminal UX. Emits `.visor.yaml`. | **MVP** |
| **Round-trip demo** | Run the Elicit mode on Visor's own brand; ship Visor's `brand-strategy.yaml` as the public exemplar. | **MVP completion gate** |
| Message-house generation w/ proof-point capture | Beyond the roof + pillars (which MVP does); full proof scaffolding under each pillar. | **Phase 2** |
| Auto-resolution of coherence drift | LLM proposes coherent fixes when the check flags drift. | **Phase 2** |
| Visual exemplar selection / per-archetype reference inspiration | Surface "brands like this" exemplars per archetype to help founder gut-check. | **Phase 2** |
| Multi-founder workshops, vote-and-decider mechanics | Run the Sprint *with the team*, not just the founder. | **Phase 3** |
| Standalone hosted SaaS (Option C) | Public web app, possibly chargeable. | **Phase 3 — revisit only if A+B prove demand** |

**Out of scope for MVP** (explicitly):

- Logo / mark generation
- Color-palette generation from strategy (this is a *theme-engine* job, not Elicit's)
- Long-tail guideline sections (clearspace, misuse, co-branding) — these come from the Workbench Phase 2/3 tracks
- Multi-language / localization of voice and tone
- Versioning / diff of brand strategy across edits

## Build-complexity estimate

**MVP, end-to-end (assuming prerequisites land first):** **t-shirt M-to-L**, approximately *one focused quarter* of one engineer's time. Roughly:

- Elicit mode UI (chat surface + slider/card-sort components + live preview) — ~3 weeks
- Interview engine (prompt sequencing, framework-fit, state machine across 9 stages) — ~3 weeks
- Coherence check + onliness litmus + lexicon generation — ~2 weeks
- `visor brand init` CLI — ~1 week
- Dogfooding pass (run on Visor's own brand, fix what breaks, capture wisdom) — ~2 weeks
- Slack / buffer — ~1–2 weeks

**Prerequisites that block MVP start:**

1. **`brand-strategy` schema lands** in `.visor.yaml` (extends the existing schema, validated, JSON-Schema'd, both copies reconciled per VI-498 WS5(f.2)). Size: M. Effort: ~1–2 weeks. *Hard prerequisite.*
2. **Brand Workbench Phase 1 surfaces render the Brand Record.** Size: L. Effort: roughly one quarter. *Hard prerequisite for the Workbench mode; soft prerequisite for the CLI (CLI could ship first and write data the Workbench renders later).*

**Risks (and the mitigation already baked into the design):**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Generic output that's "technically on-framework" but flat | High | High | Onliness litmus gate; founder confirmation on positioning sentence; explicit "first-draft" framing |
| Coherence drift between archetype / voice / tone | Medium | High | Coherence check pass; visible drift flags; defer auto-fix to Phase 2 |
| Founder hallucinating differentiation the company can't back | Medium | High | Proof-point capture as gate (message-house foundation); `confidence: weak` flag in output |
| Workbench Phase 1 slips, blocks MVP | Medium | Medium | Ship CLI first; Workbench mode follows when surfaces render |
| Schema churn during dogfooding | High | Low | Build extraction-clean from day one (per VI-498 WS5(a)); accept that v0.x will iterate |
| LLM cost per interview balloons | Low | Low | Stages are bounded; ~50 LLM turns per interview; well within reasonable per-user-cost ceilings |
| Founder abandons mid-interview | Medium | Low | Resumable from `.visor.yaml` partial state — same auto-save pattern Visor already uses |

**What flips the estimate up:** If the Workbench Phase 1 surfaces turn out to need more than a quarter (they might — full schema reconciliation, public/private mechanics, and the `governs` highlight machinery are not trivial), the prerequisite chain stretches. The MVP itself is well-scoped; the dependencies are where the risk lives.

## Go / No-Go

### Recommendation: **Go**

Conditional on three things being true:

1. **The Brand Workbench is actually built** (Phase 1 surfaces ship). Elicit without a renderer is just a chatbot. If the Workbench stalls, Elicit stalls with it.
2. **The schema is extracted-clean** from day one. This is the line that makes the whole bet defensible — `brand-strategy` data is portable, agent-readable, and survives any UI we wrap around it.
3. **The framing stays honest.** This is a structuring first-draft accelerator, not an autonomous strategist. The moment the marketing copy says "AI does your brand," the bet collapses — LLMs cannot deliver that, and over-promising lights up exactly the failure mode (generic output, taste regression) the design works around.

### Why Go

- **Strategic fit:** This is the cleanest possible proof that Visor's "design intent as data" thesis extends from tokens up to brand. No other Visor feature is as on-thesis.
- **White space:** Per VI-498 WS4, no incumbent owns the strategy layer as data. Generators do pixels; Frontify does enforcement; copy tools do voice-from-samples; custom GPTs do unstructured ad-hoc. Visor's `brand-strategy` Brand Record is structurally different — and structurally impossible for a CMS or DAM to copy.
- **Operator demand is real:** Justin would use this internally *today*, alongside Visor + the Playbook. That's the strongest signal — the first user is committed.
- **Engineering is plausibly bounded:** The hard problems (coherence, taste) are explicitly designed around, not pretended away. The easy problems (intake, framework-fit, first-draft) are squarely inside current LLM capability.
- **Compounding value:** Every founder who runs Elicit produces a `brand-strategy.yaml` that the Workbench renders, which becomes a public (if `visibility: public`) or private (if not) exemplar — feedback for the next round.

### What flips it to No-Go

- The Workbench Phase 1 doesn't ship within ~6 months. Without the renderer, Elicit has no live surface and degrades to a fancy custom GPT.
- Dogfooding on Visor's own brand exposes that the *schema* doesn't actually capture brand. (Unlikely — VI-498 validated the schema against the canonical frameworks — but a possible discovery.)
- A credible competitor ships a structurally-equivalent product first (none on the horizon per VI-498 scan).

### What we hold for later

- Standalone SaaS (Option C): right call once A+B are in the wild for ~6 months and we know whether external demand justifies a separate product surface.
- Multi-founder workshop mode: Phase 3. The single-founder MVP is the validation; team flows are the depth play.
- Visual identity from strategy: not on the roadmap. Visor's theme engine handles the strategy → tokens step; logo/mark generation is the hardest leg in AI brand-building and yields the worst output of any AI category today.

## If Go — follow-up ticket outline

Order matters: the prerequisites are hard prerequisites, not soft ones. Build the data model and the renderer first, then the elicitation.

### Prerequisites (must land before MVP)

1. **VI-???? — `brand-strategy` block: schema design + validation**
   *Size:* M (~1–2 weeks)
   *Scope:* New top-level `brand-strategy` block in `.visor.yaml`, sibling to `brand`. Schema design per VI-498 WS5(a). JSON-Schema typed. Reconcile both copies (docs + theme-engine) per VI-498 WS5(f.2) before adding. Validator + tests. Visibility (`public|private`) field included. Aaker core/extended (`core: [...]`) mechanic supported.
   *Blocks:* both the Workbench Phase 1 surfaces and the Elicit MVP.

2. **VI-???? — Brand Workbench Phase 1: render the Brand Record**
   *Size:* L (~one quarter)
   *Scope:* The Phase 1 surfaces per VI-498 WS5(b) — Positioning, Essence, Personality, Archetype, Pillars (with `governs` highlights), Voice (traits + do/don't + example), Tone-by-context (live in real UI states), Lexicon. Read-only rendering; editing comes later. Cohesion CI check (`governs` references must resolve).
   *Blocks:* Elicit mode UI (the renderer is the live preview).
   *Does not block:* `visor brand init` CLI (the CLI can ship first and emit data the Workbench renders later).

### MVP (the actual Zero-To-Brand work)

3. **VI-???? — Elicit interview engine: 9-stage funnel**
   *Size:* L
   *Scope:* The interview state machine: 9 stages from Horizon → Message; adaptive follow-ups; framework-fit; first-draft generation. Headless (no UI); exposed via a typed engine API. Includes the coherence-check pass and the onliness-litmus gate. Run on Visor's own brand as the development testbed.
   *Depends on:* schema (#1).

4. **VI-???? — `visor brand init` CLI**
   *Size:* M
   *Scope:* CLI wrapper over the Elicit engine. Conversational at the terminal (text-only fallback for sliders/card-sorts; rich Ink components if practical). Emits `.visor.yaml` or `.brand-strategy.yaml`. Resumable.
   *Depends on:* engine (#3).

5. **VI-???? — Elicit Workbench mode: conversational UI**
   *Size:* L
   *Scope:* The rich UI surface: chat panel + sliders + archetype card-sort + live brand preview (renders the Workbench Phase 1 surfaces against the draft Brand Record). Onliness-litmus gate as a modal. Coherence flags as inline warnings.
   *Depends on:* engine (#3) + Workbench Phase 1 (#2).

6. **VI-???? — Dogfood: ship Visor's own `brand-strategy.yaml` as public exemplar**
   *Size:* M
   *Scope:* Run the Elicit mode on Visor's own brand end-to-end. Commit Visor's `brand-strategy.yaml` to the repo (public, per VI-498 — Visor as the flagship exemplar). Capture wisdom. Fix what the dogfooding pass exposes.
   *Depends on:* Workbench mode (#5).
   *Gates:* MVP "done."

### Phase 2 (after MVP ships and survives the wild)

7. **VI-???? — Message-house: pillars + proof-point capture**
8. **VI-???? — Coherence drift: auto-resolution proposals**
9. **VI-???? — Archetype exemplars: "brands like this" reference surfaces**
10. **VI-???? — Private brand records: gitignored sync (mirrors private-themes mechanic)**

### Phase 3 (revisit when A+B have been in the wild ~6 months)

11. **VI-???? — Multi-founder workshop mode (vote + decider)**
12. **VI-???? — Standalone hosted Elicit (Option C, revisited)**
13. **VI-???? — Extraction into `@loworbitstudio/visor-brand` package**

## Open questions for operator review

These should resolve before MVP build begins, not during it. Recommendation given on each.

1. **Are values a first-class field or upstream context?** *Recommend:* upstream context only in v1. Values inform pillars and personality but don't get their own surface — the field churn is real and the canonical frameworks disagree (Sprint #3 makes them first-class; Aaker doesn't). Re-evaluate after dogfooding. *Agree?*
2. **What's the LLM provider story?** *Recommend:* Anthropic Claude via the API as primary (already in use across the playbook); structured-output mode for framework-fit steps; cache the system prompt + framework definitions per session. Cost ceiling ~$0.50 per completed interview at current pricing.
3. **Does Elicit support resuming a partial interview?** *Recommend:* yes — auto-save after every stage to `.visor.yaml`. Founders abandon mid-flow; that's not a failure mode, that's normal use.
4. **Should the CLI ship before the Workbench mode?** *Recommend:* probably yes. The engine is the same; the CLI ships in M-weeks; the Workbench mode is L-weeks and depends on Workbench Phase 1. Shipping the CLI first lets us collect interview data (with consent) and validate the funnel before investing in the rich UI.
5. **Where does the "first user" (Justin) actually run it?** *Recommend:* run it manually on Visor's own brand as soon as the engine works (#3), well before #5 or #6. The dogfooding starts at the engine, not at the polished UI.
6. **What's the public-vs-private default for the emitted Brand Record?** *Recommend:* `private` by default. Brand strategy is more sensitive than themes; the public option is opt-in. Visor's own record is the exception (explicit `public`).
