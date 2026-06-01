# Brand Foundations & Product Definition — Brand Workbench Research (VI-498)

> **Status:** Research spike — brand-strategy foundations + product definition. No implementation code ships with this ticket; it informs the Brand Workbench build and the authoring of Visor's own brand (both deliberately out of scope here).
>
> **Goal:** Build the brand-strategy foundation and product definition for the Visor Brand Workbench, and answer rigorously: *is Voice + Pillars enough as the workbench surfaces, or do we need more?*
>
> **Method:** Deep-research spike. Nine web-enabled sub-agents fanned out one-per-workstream (WS1–WS5), cited primary/authoritative sources, adversarially fact-checked their load-bearing claims (37 of 43 fully supported as stated; 6 refined; none refuted), then synthesized. Full method + verification ledger in §6.
>
> **Headline answer:** **No — Voice + Pillars is not enough.** They are two of a ~12-section minimum-lovable core and sit *downstream* of the generative trio **Positioning → Essence → Personality**. Build the data model (the "Brand Record") first; render every surface live against the running theme.

---

## Contents

- **Recommendation at a glance**
- **§1 · WS1 — Fundamentals & Frameworks** — the vocabulary, the major frameworks, and which to adopt
- **§2 · WS2 — Anatomy of Best-in-Class Brand Guidelines** — the complete layered section taxonomy (strategy / verbal / visual / application)
- **§3 · WS3 — Brand Workbench Product Definition** *(core)* — the surface set, competitive/white-space scan, and data model
- **§4 · WS4 — Zero-to-Brand Elicitation + AI Opportunity** — how strategists elicit a brand; the feasibility of an AI tool
- **§5 · WS5 — Synthesis, Recommendation & Roadmap** — the Brand Record, phase plan, framework to adopt, operator primer, reading list, open questions
- **§6 · Methodology & verification** — how this was researched and adversarially fact-checked
- **§7 · Source index** — primary sources consulted, by workstream

---

## Recommendation at a glance

Build the Brand Workbench around a canonical brand object we call the Brand Record — a single, serializable schema that encodes positioning, essence, pillars, archetype, personality, voice, tone, lexicon, and messaging. Author it as a new top-level `brand-strategy` block in `.visor.yaml` (sibling to the existing asset-only `brand` block), extraction-clean for a future `@loworbitstudio/visor-brand` package. Do NOT extend the `brand` block: that block is cleanly typed asset resolution (`VisorBrand` → `--brand-*`), a different lifecycle and consumer.

Is Voice + Pillars enough? No — decisively. Voice and Pillars are the two most visible sections but sit downstream of the generative trio Positioning → Essence → Personality. Ship them alone and you reproduce the dead-PDF failure (adjectives asserted with nothing upstream to justify them). The Phase-1 minimum-lovable core is ~12 sections: the trio, plus Pillars (token-linked), Voice + Tone-by-context + Lexicon on the verbal side, and the first asset-guideline trio (logo lockups already shipped; clearspace/min-size; misuse). Tone-by-context is the single highest-leverage move — it is the verbal analog of Visor's light/dark mode switching, and it is invisible to every PDF-shaped competitor.

Framework to adopt for Visor's own brand: a composed stack of three that map to distinct data shapes — Neumeier's onliness statement (the spearhead difference), a Brand-Key-style one-pager (the structured spine), and the 12 Archetypes (the personality key that seeds voice). Borrow Aaker's core/extended split as an override mechanic and Keller's pyramid as a later diagnostic overlay, not an authoring tool.

Phased shape: Phase 1 generative core (data model + the five strategy/verbal surfaces rendered live on theme tokens); Phase 2 operational depth (messaging, grammar, accessibility, governance); Phase 3 the fully-loaded long tail the schema must merely allow. A `visor brand init` CLI plus an "Elicit" Workbench mode is a high-leverage, near-term, defensible bet because the elicitation funnel is finite, public question-sets — but ship the data model first and treat the AI flow as a structuring first-draft accelerator, never an autonomous strategist.

---

## 1. WS1 — Fundamentals & Frameworks

Before the Brand Workbench can decide *what to model*, the operator needs the vocabulary and the framework map. This section levels that up: precise definitions, the major frameworks named correctly with their real shapes, and a recommendation for which ones a token-native OSS product brand should actually adopt. The payoff lands at the end — which concepts have to become first-class **data surfaces**, not just docs prose.

### The three layers people conflate: strategy → identity → guidelines

These are not synonyms; they are a pipeline, and the order is load-bearing.

| Layer | What it is | Lives as | Example artifact |
|---|---|---|---|
| **Brand strategy** | The deliberate *decisions* about what you stand for, who you serve, how you differ, and how you'll show up — the decision-making system. | Positioning, mission, audience, value prop, personality, voice | "Visor is the only design system that ships *design intent* as a portable, AI-readable file." |
| **Brand identity** | The *expression* of that strategy — the visible/audible system that makes you recognizable. | Logo, wordmark, color, type, motion, voice-in-practice | The brandmark, the token palette, the docs typography |
| **Brand guidelines** | The *rules* that keep the identity consistent across people and time. | A style guide / brand book | "Use `--brand-logo` on dark surfaces only; voice is plainspoken, never salesy." |

The key relationship, stated plainly: **strategy decides, identity expresses, guidelines enforce.** Strategy comes first because it determines what the identity should communicate; the identity determines *how*; guidelines record decisions already made so they aren't relitigated on every new artifact ([Selah Creative Co. — "Brand Strategy vs. Brand Identity"](https://selahcreativeco.com/blog/brand-strategy-vs-brand-identity-whats-the-difference); [sitecentre — "Brand Style Guide vs. Brand Identity"](https://www.sitecentre.com.au/blog/brand-style-guide-vs-brand-identity)).

For Visor this maps almost too cleanly: today's assets-only brand block (`logo`/`wordmark`/`brandmark` → `--brand-*`) is **identity-as-data**. The docs Brand section and cohesion Showcase are **guidelines-as-surface**. The missing layer — the entire point of this spike — is **strategy-as-data**: the decisions *upstream* of the assets, which nothing in the current system captures.

### Working vocabulary (use these words correctly)

The single most common failure mode for an intuitive-but-unstudied practitioner is using these terms loosely. They are distinct, and several form a strict hierarchy (essence ⊂ promise ⊂ positioning ⊂ value prop, roughly inner→outer).

| Term | One-sentence definition | Crisp example |
|---|---|---|
| **Brand** | A person's *gut feeling* about a product, company, or service — not the logo, not what you say (Neumeier). | "Visor feels like it was built by engineers who respect my ownership." |
| **Pillar** | A small set (3–5) of strategic themes the brand consistently stands on; the load-bearing supports under everything else. | Visor pillars: *Ownership · Theming-first · AI-consumable.* |
| **Essence** | The brand's timeless heart, compressed to ~2–3 words ("adjective, adjective, noun"); internal-facing, not a tagline. | Volvo = *"Safety."* Disney = *"Family magic."* |
| **Promise** | The commitment to the experience customers can expect, every time — derived from positioning + value prop. | "Only Volvo assures a safe ride to parents who care about their children's safety." |
| **Positioning** | How the brand is perceived *relative to competitive alternatives* — value prop placed in the market landscape. | "For solo product engineers, Visor is the copy-and-own design system that stays theme-portable." |
| **Value proposition** | The concrete value a customer gets from using the product (more feature/benefit-focused than promise). | "Edit any component freely; tokens still update via `npm update`." |
| **Personality** | The human character traits attributed to the brand. | Plainspoken, precise, generous, dry-witted. |
| **Archetype** | A universal character pattern (from Jung) used to give the brand instantly-legible meaning. | Visor leans *Sage* (mastery/truth) with a *Creator* streak. |
| **Voice** | The brand's consistent character in language — it *does not change*. | Mailchimp's voice: "plainspoken… genuine… dry humor." |
| **Tone** | The *flexing* of voice for context and the reader's emotional state — it *changes all the time*. | Calm/reassuring in an error message; playful in a success toast. |
| **Messaging hierarchy** | The ranked structure of what you say — essence → pillars → proof points → supporting copy. | Headline claim down to feature-level RTBs. |
| **Tagline** | The *permanent*, brand-level signature line (≈7 words or fewer). | Nike — "Just Do It." |
| **Slogan** | A *temporary*, campaign-level line tied to a specific push. | A seasonal product campaign line that rotates out. |

Two distinctions the operator must internalize. **Voice vs. tone:** "You have the same voice all the time, but your tone changes" ([Mailchimp Content Style Guide — "Voice and Tone"](https://styleguide.mailchimp.com/voice-and-tone/)). **Tagline vs. slogan:** the tagline is the permanent statement of *who you are*; the slogan is the tactical message of *what you're selling now* ([Indeed — "Tagline vs. Slogan"](https://www.indeed.com/career-advice/career-development/tagline-vs-slogan)). Treat this boundary as a prevailing convention, not a law — practitioners routinely blur it, and Nike's "Just Do It" is itself the canonical case of a *campaign slogan* that hardened into a permanent tagline. For a workbench, voice and tone are different shapes of data — one stable record, one set of context-keyed variants — and that distinction should survive into the schema.

### The major frameworks

Each framework is a *lens* — it decides which facets of a brand get formalized. They overlap and compose; none is complete alone.

**Marty Neumeier — *The Brand Gap* / *Zag* / *The Brand Flip*.** Neumeier's contribution is less a rigid template than a *posture*. *The Brand Gap* defines a brand as "a person's gut feeling" and frames brand-building as five disciplines — differentiate, collaborate, innovate, validate, cultivate — bridging the chasm between business strategy and design ([Neumeier — "The Brand Gap"](https://www.martyneumeier.com/the-brand-gap)). *Zag* contributes the **onliness statement** — the radical-differentiation litmus test in the form "Our [offering] is the *only* [category] that [benefit]"; if you can't say it briefly with the word *only*, you don't have a zag ([Valchanova — *Brand Gap / Zag* notes](https://valchanova.me/brand-gap-zag-book-summary/)). *The Brand Flip* adds the modern thesis that **customers, not companies, own the brand** — "a brand isn't what you say it is, it's what they say it is" ([Neumeier — "The Brand Flip"](https://www.martyneumeier.com/the-brand-flip)). *Captures:* differentiation + the strategy↔execution bridge. *Best for:* fast-moving teams that need one sharp, testable difference. *Limits:* deliberately thin on the structured internal anatomy of identity — it sharpens the point, it doesn't model the whole brand.

**David Aaker — Brand Identity System / Brand Vision Model.** The most *comprehensive* system. A brand is examined through **four perspectives** — brand-as-product, brand-as-organization, brand-as-person, brand-as-symbol — yielding up to ~12 identity elements, split into a stable **core identity** (2–5 ideas you'd defend at all costs) and a richer **extended identity** that adds texture; a single-thought **brand essence** sits at the center, and **positioning** is the subset of identity you actively emphasize to compete ([How Brands Are Built — "Aaker's Brand Vision Model"](https://howbrandsarebuilt.com/david-aakers-brand-vision-model-and-how-it-works-part-one/); [Umbrex — "Aaker Brand Identity Model"](https://umbrex.com/resources/frameworks/marketing-frameworks/aaker-brand-identity-model/)). *Captures:* the full anatomy of identity + its strategic core. *Best for:* durable foundations, brand architecture, anything that must stay coherent across many surfaces. *Limits:* heavy; the 12-cell grid is more than a small product brand needs day-to-day — but the **core/extended** split is a gift for schema design.

**Kevin Lane Keller — Customer-Based Brand Equity (Brand Resonance Pyramid).** Keller's model is *diagnostic and customer-side*: it measures the brand as it lives in the customer's head, as a four-level climb. Bottom to top: **Salience** ("who are you?") → **Meaning** = Performance + Imagery ("what are you?") → **Response** = Judgments + Feelings ("what about you?") → **Resonance** ("what kind of bond do we have?"), with resonance defined as deep loyalty, active engagement, and brand–self alignment ([Umbrex — "Keller CBBE Pyramid"](https://umbrex.com/resources/frameworks/marketing-frameworks/keller-customer-based-brand-equity-cbbe-pyramid/)). *Captures:* the customer's escalating relationship with the brand. *Best for:* measuring brand health and deciding where to invest next. *Limits:* it diagnoses outcomes, it doesn't *author* the identity — you still need Aaker/Neumeier to decide what the brand *is*.

**Carol Pearson & Margaret Mark — 12 Brand Archetypes (*The Hero and the Outlaw*).** Built on Jung's archetypes (universal patterns in the collective unconscious), this is the first systematic method for mapping a brand to one of twelve characters — Innocent, Sage, Explorer, Outlaw, Magician, Hero, Lover, Jester, Everyman, Caregiver, Ruler, Creator — to give it instant, resonant meaning ([Mark & Pearson, *The Hero and the Outlaw* (2001)](https://www.amazon.com/Hero-Outlaw-Building-Extraordinary-Archetypes/dp/0071364153)). *Captures:* personality and emotional meaning, fast. *Best for:* unlocking voice, tone, and narrative; deciding *how* the brand should feel. *Limits:* it's a starting lens, not a positioning or differentiation tool — two competitors can share the Sage archetype and still need very different zags.

**Jean-Noël Kapferer — Brand Identity Prism.** A six-facet hexagon (1986) balancing **sender-side** and **receiver-side** expression: **Physique** (tangible features), **Personality**, **Culture** (the value system/origin), **Relationship** (the brand↔customer dynamic), **Reflection** (how the *typical user* is portrayed), and **Self-image** (how the customer sees *themselves* using it). The left facets are externalized, the right internalized ([How Brands Are Built — "The Brand Identity Prism"](https://howbrandsarebuilt.com/the-brand-identity-prism-and-how-it-works/); [Mindtools — "Kapferer's Brand Identity Prism"](https://www.mindtools.com/awqj2p3/kapferers-brand-identity-prism/)). *Captures:* identity as a coherent six-sided whole, including the often-missed *reflection vs. self-image* split. *Best for:* checking that an identity is internally consistent and human-meaningful. *Limits:* European/academic, abstract; the reflection/self-image nuance is easy to fumble without practice.

**Simon Sinek — The Golden Circle (*Start With Why*).** Three concentric rings — **Why** (purpose/cause/belief, the center), **How** (the differentiating process/values), **What** (products/services) — and the thesis to communicate inside-out: "People don't buy *what* you do, they buy *why* you do it" ([Sinek — "The Golden Circle"](https://simonsinek.com/golden-circle/)). *Captures:* purpose and the narrative spine. *Best for:* finding and articulating a compelling *why* — a manifesto, an about-page, a founding story. *Limits:* it is one idea, not a brand system; it says nothing about identity anatomy, competitive positioning, or measurement. Use it to *seed* the why, not to *run* the brand.

**The Brand Key / Brand Pyramid family.** The pragmatist's one-pager. Unilever's **Brand Key** stacks nine interlocking parts — root strengths, competitive environment, target, **insight**, benefits, values & personality, **reasons-to-believe (RTBs)**, **discriminator**, all culminating in a central **brand essence** ([Umbrex — "Unilever Brand Key"](https://umbrex.com/resources/frameworks/marketing-frameworks/brand-key-unilever/); [Toolshero — "Brand Key Model"](https://www.toolshero.com/marketing/brand-key-model/)). Brand *pyramids* are the same impulse in triangular form: features → benefits → emotional payoff → essence at the apex. *Captures:* a complete, fill-in-the-blanks positioning on a single page. *Best for:* operators who need *structured fields* and a shared template fast. *Limits:* can become box-ticking; quality depends entirely on the insight and discriminator, which the template can't generate for you.

#### Framework comparison

| Framework | What it captures | Best for | Limits |
|---|---|---|---|
| **Neumeier** (Gap/Zag/Flip) | Differentiation; strategy↔design bridge; customer-ownership | One sharp, testable difference (the "zag") | Thin on internal identity anatomy |
| **Aaker** (Identity System) | Full identity anatomy: 4 perspectives, core/extended, essence, positioning | Durable foundations, architecture, multi-surface coherence | Heavyweight; 12-cell grid overkill for a small brand |
| **Keller** (Resonance Pyramid) | Customer-side equity as a 4-level climb to resonance | Measuring brand health; prioritizing investment | Diagnoses, doesn't author the brand |
| **Pearson & Mark** (12 Archetypes) | Personality + emotional meaning via Jungian patterns | Unlocking voice/tone/narrative fast | A lens, not positioning; non-unique |
| **Kapferer** (Identity Prism) | 6-facet identity incl. reflection vs. self-image | Coherence + human-meaning checks | Abstract; nuances easy to fumble |
| **Sinek** (Golden Circle) | Purpose + narrative spine ("why") | Manifesto, founding story, about-page | One idea, not a system |
| **Brand Key / Pyramid** | Complete positioning on one page (insight, RTBs, discriminator, essence) | Structured, fast, shared template | Box-ticking risk; only as good as the insight |

### Recommendation: what a token-native OSS product brand should adopt

For Visor — small team, OSS, system-native, fast-moving, AI-consumable as a design goal — the answer is a **composed stack of three**, chosen because they map to *distinct data shapes* rather than overlapping:

1. **Neumeier's onliness/zag as the spearhead.** A single `onliness` field ("the only [category] that [benefit]") forces the core differentiation and is *trivially serializable and AI-readable* — exactly the kind of compressed intent Visor already ships in `.visor.yaml`. It is the fastest, sharpest entry for a small team and resists the bloat of heavier systems.

2. **A Brand-Key-style one-pager as the structured spine.** It gives the workbench a finite, fill-able field set — insight, target, benefits, values/personality, RTBs, discriminator, **essence** — that serializes 1:1 to JSON. This is the pragmatic backbone: it's a *form*, which is what an AI-consumable, extraction-clean schema wants to be.

3. **The 12 Archetypes as the personality/voice key.** A single `archetype` enum (Sage, Creator, …) is a one-token field that *deterministically seeds* voice, tone, and narrative — the bridge from strategy-data into the voice/tone surfaces the spike is scoping. It's the highest-leverage, lowest-footprint way to make personality machine-actionable.

This trio **composes** the way mature practice does: **positioning + archetype + essence-pyramid** is the canonical combination — Neumeier sharpens the *difference*, the Brand Key structures the *substance*, the archetype encodes the *character*. Borrow two structural ideas from the heavier frameworks without adopting them wholesale: **Aaker's core-vs-extended split** (mark some strategy fields as the immutable core, the rest as extended/overridable — which dovetails perfectly with Visor's theme/mode-aware override model), and **Keller's pyramid as a *maturity/diagnostic* overlay** rather than an authoring tool (a future "how resonant is this brand" read, not a thing the operator fills in). *(This recommendation is my synthesis for Visor's specific constraints, not a claim from any single source.)*

Deliberately **not** front-and-center: Kapferer's prism (too abstract for a v1 schema, though its reflection/self-image split is worth a future field) and Sinek's Golden Circle as a *system* (keep `why` as one field that seeds the about-page/manifesto, but don't let a single idea structure the whole model).

### WS1 takeaways for the workbench

The frameworks agree on a small set of concepts that recur in every model — and *those* are what must become **first-class, queryable data surfaces**, not docs prose: **onliness/positioning** (the differentiator — Neumeier, Brand Key discriminator), **essence** (the 2–3-word core — Aaker, Brand Key, pyramid apex), **pillars** (the 3–5 strategic supports), **archetype** (the one-token personality key that seeds voice — Pearson/Mark), and the **voice/tone pair** modeled as *two different shapes* (one stable voice record + context-keyed tone variants — Mailchimp). Each is short, serializable, AI-legible, and theme/mode-aware-capable — i.e., each behaves exactly like the design *intent* Visor already ships in `.visor.yaml`. The recurring concepts across all seven frameworks are the strongest possible signal for the schema's required fields; the framework-specific extras (Kapferer's six facets, Keller's pyramid levels) become *optional overlays*, not the spine. The headline answer this feeds into the central spike question: **voice + pillars is the right *core*, but it is not enough — onliness/positioning, essence, and archetype are equally load-bearing and equally serializable, and the workbench should treat all five as the first-class surface set.**

---

## 2. WS2 — Anatomy of Best-in-Class Brand Guidelines

A modern brand guideline is not a document — it is a **stratified system**. The best ones separate concerns into four layers that build on each other: **strategy** (why the brand exists and how it's positioned), **verbal** (how it speaks), **visual** (how it looks), and **application** (how the first three combine in the real world). The deeper layers should be *derivable* from the shallower ones — voice should fall out of personality; color usage should fall out of positioning. When that derivation chain is explicit, the guideline becomes a reasoning engine instead of a lookup table. This is exactly the property an AI-consumable, theme-aware system like Visor needs.

A second axis cuts across all four layers, and it is the one that matters most for WS3. Every section is one of three kinds of thing:

- **[strategy]** — *intent*. Prose, principles, the "why." Not directly machine-renderable; it's the reasoning that *justifies* the other two. (Voice, personality, positioning.)
- **[guideline]** — *rules*. Constraints and usage: clearspace, tone-by-context, do/don't, contrast minimums. Conditional logic over assets. Partly machine-checkable.
- **[asset]** — *artifacts*. The renderable payload: logo files, color values, type scales, motion curves. This is what Visor's `brand` block already ships today.

Visor's existing brand layer is **100% [asset]** (logo/wordmark/favicon slots → `--brand-*` vars). The entire opportunity of this spike lives in the **[strategy]** and **[guideline]** columns that no current Visor surface touches.

### What the best-in-class books actually contain

I surveyed the published structures of eight exemplars. The pattern is consistent and instructive:

| Source | What it nails | Layer emphasis |
|---|---|---|
| **Mailchimp Content Style Guide** [Mailchimp — "Voice and Tone" (styleguide.mailchimp.com)] | The canonical **verbal** book. Voice = 4 fixed traits (plainspoken, genuine, translator, dry humor); tone = mapped to the **reader's emotional state** ("relieved," "confused and seeking help"). Plus a full Word List, grammar/mechanics, accessibility, translation. | Verbal-dominant |
| **Twilio Paste** [Twilio — "Content / Voice and tone" (paste.twilio.design)] | Treats content as a **Foundation** alongside color/spacing: Overview, **Content checklist**, Voice and tone, **Product style guide**, **Word list**. Plus data-viz, localization, elevation, illustration. | Balanced strategy→asset |
| **Shopify Polaris** [Shopify — "Foundations / Content" (polaris.shopify.com)] | Foundations / Design / **Content** / Patterns / Components / **Tokens** / Icons. Content sits as a first-class peer to code. | System-dominant |
| **Atlassian Design System** [Atlassian — "Foundations" (atlassian.design)] | Foundations include **Logos**, Color, Typography, Iconography, **Illustrations**, **Content**, Accessibility, Tokens, Elevation, Border, Radius — i.e. brand assets *and* verbal sit in one foundation set. | Balanced |
| **IBM Carbon** [IBM — "Guidelines" (carbondesignsystem.com)] | Deep **visual** system: 2x Grid, spacing scale, IBM Plex type tokens, motion curves, WCAG 2.1 AA accessibility baked into components. Verbal layer is comparatively thin — a telling gap. | Visual-dominant |
| **Google Material 3** [Google — "Foundations / Content design" (m3.material.io)] | Three parts — Foundations, Styles, Components. **Content design** (UX writing, style guide, accessibility writing) lives *inside* Foundations, beside color/typography/motion/layout. | Balanced |
| **NASA Brand Center** [NASA — "Brand Guidelines" (nasa.gov/nasa-brand-center)] | The classic **visual-asset** canon, modernized: Insignia (versions, **clearspace + min size**, **violations**), Typography, Supporting Elements (logotype, seals, emblems), and **Application** (film, merchandise, strategic partnerships, images). | Visual + application |
| **Spotify Design & Branding** [Spotify — "Design guidelines" (developer.spotify.com/documentation/design)] | The **partner/application** archetype: logo usage, **clearspace, minimum size, prohibited modifications**, color usage, **naming restrictions**, attribution, co-branding rules. | Visual + application |

Three things jump out. **(1)** The leaders increasingly fold verbal content *into* the same surface as visual tokens (Material, Atlassian, Paste) rather than shipping a separate PDF — content is a Foundation, not an appendix. **(2)** The "rules" sections — clearspace, min-size, **misuse/violations** — are near-universal and are pure **[guideline]** logic over **[asset]** payloads. **(3)** The verbal layer is the most *unevenly* covered: Mailchimp and Paste treat it as the spine; Carbon and the legacy NASA manual barely touch it. A system that makes verbal-strategy *first-class and structured* is differentiated, because most "design systems" still don't.

### The complete taxonomy (master checklist)

Tagged `[strategy] / [guideline] / [asset]`. This is the backbone WS3 maps onto.

| Layer | Section | Kind | What it specifies |
|---|---|---|---|
| **Strategy** | Purpose / Mission | [strategy] | Why the brand exists; the "Why" at the center of Sinek's Golden Circle [Sinek, *Start With Why* (2009)] |
| Strategy | Vision | [strategy] | The future state the brand is working toward |
| Strategy | Values | [strategy] | Beliefs that govern behavior and decisions |
| Strategy | Positioning | [strategy] | The space owned in the customer's mind; Neumeier's **onliness statement**: "the ONLY [category] that [point of radical differentiation]" [Neumeier, *Zag* (2006)] |
| Strategy | Audience / Personas | [strategy] | Who the brand is for; needs, contexts, jobs-to-be-done |
| Strategy | Competitive frame | [strategy] | The reference set the brand is judged against |
| Strategy | Brand pillars | [strategy] | 3–5 strategic themes that organize everything below |
| Strategy | Brand essence | [strategy] | The irreducible core, often 2–3 words (Aaker's "brand essence" at the heart of the identity system) [Aaker, *Building Strong Brands* (1996)] |
| Strategy | Brand promise | [strategy] | The commitment made to the customer; Aaker's value proposition (functional + emotional + self-expressive benefits) [Aaker, 1996] |
| Strategy | Personality | [strategy] | Human traits (brand-as-person) — the bridge from strategy to voice [Aaker, 1996] |
| Strategy | Archetype | [strategy] | One of 12 narrative patterns (Hero, Sage, Outlaw, Creator, Jester, …) [Mark & Pearson, *The Hero and the Outlaw* (2001)] |
| **Verbal** | Voice | [strategy] | Stable personality-in-language; a small fixed trait set (Mailchimp: 4 traits) [Mailchimp] |
| Verbal | Tone (by context) | [guideline] | How voice **flexes** by reader emotional state / channel [Mailchimp; Material content design] |
| Verbal | Vocabulary / Lexicon | [guideline] | Words we use vs. avoid; the **Word List** (Mailchimp, Twilio Paste) |
| Verbal | Naming conventions | [guideline] | How products/features are named & capitalized; naming restrictions [Spotify] |
| Verbal | Messaging hierarchy / key messages | [strategy] | Primary → supporting message ladder per audience |
| Verbal | Taglines / slogans | [asset] | Locked external lines |
| Verbal | Boilerplate | [asset] | The reusable "about us" paragraph(s) |
| Verbal | Grammar & mechanics | [guideline] | Punctuation, capitalization, numbers, dates [Mailchimp; GOV.UK A-to-Z] |
| **Visual** | Logo + lockups | [asset] | Primary mark, horizontal/vertical/stacked lockups [NASA; Spotify] |
| Visual | Brandmark / symbol | [asset] | Icon-only mark (Visor `brandmark` slot) |
| Visual | Wordmark / monochrome | [asset] | Type-only + single-color marks (Visor `wordmark`/`monochrome` slots) |
| Visual | Clearspace + min size | [guideline] | Protected space, minimum legible size [NASA; Spotify] |
| Visual | Misuse / don'ts ("violations") | [guideline] | Prohibited modifications [NASA "Insignia Violations"; Spotify] |
| Visual | Color (palette) | [asset] | Brand + neutral values (already Visor token territory) |
| Visual | Color usage + accessibility | [guideline] | Where each color is allowed; WCAG 2.1 AA contrast [Carbon; Material] |
| Visual | Typography | [asset] | Type families, scale, weights (Visor `--font-*` tokens) |
| Visual | Iconography | [asset] | Icon style, grid, library [Carbon; Atlassian] |
| Visual | Illustration | [asset] | Illustration style + library [Atlassian; Twilio Paste] |
| Visual | Photography / imagery | [guideline] | Art direction, treatment, do/don't [NASA "Images & Media"] |
| Visual | Motion | [guideline] | Duration + easing curves (Visor `--motion-*` tokens) [Carbon] |
| Visual | Layout / grid | [guideline] | Grid + spacing scale [Carbon 2x Grid; Atlassian] |
| Visual | Data-viz | [guideline] | Chart palettes, types, encoding rules [Twilio Paste; Carbon] |
| **Application** | Do/don't galleries | [guideline] | Right-vs-wrong worked examples (cross-layer) |
| Application | Accessibility (holistic) | [guideline] | Contrast, alt text, inclusive writing [Carbon; Material; Mailchimp] |
| Application | Co-branding / partner rules | [guideline] | Lockups with third parties, endorsement [Spotify; NASA "Strategic Partnerships"] |
| Application | Templates | [asset] | Slides, email, social, app starter layouts |
| Application | Channel-specific | [guideline] | Social, email, slides, app, environment specifics [Mailchimp; Spotify] |
| Application | Merch / environment | [guideline] | Physical/spatial application [NASA "Merchandise"; Spotify] |
| Application | Legal / trademark | [guideline] | ™/® usage, attribution, copyright [Mailchimp "Copyright and Trademarks"; Spotify "Attribution"] |
| Application | Governance / versioning | [guideline] | Ownership, change process, version history (how the book stays alive) |

### Patterns: the core, the advanced, and what makes a book *living*

**The core (appears in nearly every best-in-class book).** A small set recurs everywhere: **logo + lockups, clearspace/min-size, misuse, color, typography** on the visual side; **voice + tone** on the verbal side; **positioning/essence** on the strategy side; **accessibility + legal/trademark** on the application side. These ~10 are table stakes. Notably, the **[strategy]** core is thin in *design-system* docs (Carbon, Material lead with tokens, not mission) but thick in true *brand* books — which is precisely the gap Visor would fill by treating strategy as data.

**The advanced/optional set.** Archetype, competitive frame, messaging hierarchy, data-viz, illustration systems, co-branding, environment/merch, and formal governance show up only in mature programs. They're the "fully-loaded" tier — valuable, but a brand doesn't *need* them to be coherent.

**What makes guidelines feel living vs. a dead PDF** — the through-line of every leader I surveyed:

1. **Examples over assertions.** Mailchimp doesn't say "be clear," it shows a confused-on-Twitter reader and the right response. Material/Paste pair every rule with do/don't. *Rules without worked examples don't change behavior.*
2. **Conditional tone, not one fixed register.** The best verbal systems make tone a **function of context** (reader state, channel) — exactly the kind of `mode`-aware logic Visor already does for tokens. Tone-by-context is the verbal analog of theme/mode switching.
3. **Co-located with the live system.** Material, Atlassian, Polaris, and Paste ship brand/content guidance *in the same surface as the running tokens and components*, so the guideline updates when the system does. The dead-PDF failure mode is exactly the drift problem Visor's publish-gate philosophy already fights.
4. **Interactive, inspectable tokens.** Carbon/Polaris expose tokens you can read and copy. The frontier (and Visor's natural edge) is making **strategy** equally inspectable — voice traits, tone rules, and positioning as queryable data an agent can read, not prose an agent must parse.

The decisive observation for the product: across all eight exemplars, **[asset]** sections are already well-served by tokens (Visor's strength), **[guideline]** sections are semi-structured rules begging to be data (Visor's clear next step), and **[strategy]** sections are almost always *unstructured prose* — even in the best books. The unmet need in the entire market is **structured, machine-readable brand strategy**. That is the white space.

### WS2 takeaways for the workbench

**The minimal "core" every brand needs (the must-have set):**

- *Strategy:* **Positioning** (onliness), **Brand essence**, **Personality** — the 3 that *generate* everything downstream.
- *Verbal:* **Voice** (fixed traits) + **Tone-by-context** (the flex) + a **Word list** (use/avoid).
- *Visual:* the assets Visor already has (logo/wordmark/mark/color/type) + **clearspace/min-size/misuse** as the first **[guideline]** sections to add.
- *Application:* **Accessibility** + **Legal/trademark** + lightweight **governance/versioning**.

That core is roughly **a dozen sections** — and critically, it is **Voice + Pillars PLUS a handful more**: positioning/essence/personality (the strategy that *justifies* voice), tone-by-context (the operational half of voice), word list, and the logo-usage guideline trio. **Voice + Pillars alone is not enough** — they are the most visible two of a ~12-section core, and they sit *downstream* of positioning/essence, which the workbench needs in order for voice and pillars to be derivable rather than asserted.

**The full set** adds the advanced tier: archetype, competitive frame, audience personas, messaging hierarchy, taglines/boilerplate, iconography/illustration/photography/motion/data-viz guidelines, co-branding, templates, channel-specific, and merch/environment — the fully-loaded brand book WS3 should treat as the extensible long tail, not the v1 surface.

---

## 3. WS3 — Brand Workbench Product Definition

The Brand Workbench is the surface where a `.visor.yaml` stops describing only *how a product looks* and starts describing *what a brand is and how it speaks* — modeled as data, theme- and mode-aware, inspectable by humans and agents, and provably coherent with the running design system. Today Visor's brand layer is 100% **[asset]**: the `brand` block resolves logo/wordmark/mark/favicon slots into `--brand-*` CSS custom properties in a dedicated `visor-brand` cascade layer, and the docs Visual Explorer renders them on light/dark surfaces as the "do they sing" cohesion test (`packages/docs/components/playgrounds/sections/brand.tsx`). That is the entire visual-identity foundation, and it already does something Frontify cannot: the marks re-tint and re-resolve live as you switch theme and mode. The Workbench is the build-out of the **[strategy]** and **[verbal]** columns the WS2 taxonomy names — the white space no current Visor surface, and almost no competitor, touches as structured data.

### Is Voice + Pillars enough? — No.

**Decisively no, and the reason is structural, not a matter of taste.** Voice and Pillars are the two most *visible* sections of a brand, which is exactly why they're the tempting starting point — but they sit **downstream** of work that has to exist first for them to be derivable rather than asserted. WS2's central finding holds: across eight best-in-class exemplars, the deeper layers are meant to *fall out of* the shallower ones — "voice should fall out of personality; color usage should fall out of positioning." A workbench that ships Voice + Pillars alone reproduces the dead-PDF failure mode in structured clothing: four adjectives and three themes asserted with nothing upstream to justify them, and nothing operational downstream to apply them. Specifically:

- **Voice is half a system.** Mailchimp's voice is four *fixed* traits — "plainspoken, genuine, translator, dry humor" — but the book's actual engine is **tone**: "You have the same voice all the time, but your tone changes," flexed by the reader's emotional state ("relieved to be finished," "confused and seeking our help on Twitter") [Mailchimp — "Voice and Tone" (styleguide.mailchimp.com)]. Voice without tone-by-context is a personality with no behavior. And tone-by-context is *the verbal analog of Visor's mode switching* — the one place Visor's architecture is unfairly suited to win, and it's the half that gets dropped if you stop at "Voice."
- **Voice without Personality/Essence is unfalsifiable.** David Aaker's identity system contributes **personality** (brand-as-person, one of its four perspectives) and a stable **core identity** [Aaker, *Building Strong Brands* (1996)]; pair that with a 2–3-word **brand essence** (a centerpiece Aaker stresses more in his later brand-vision work) and you have the upstream that *justifies* voice — the "bridge from strategy to voice" is our synthesis, not Aaker's own wording. Skip it and "plainspoken" is a preference; include it and it's a *consequence* — the agent can explain *why* the voice is what it is, which is the entire point of making strategy machine-readable.
- **Pillars without Positioning float.** Pillars are "3–5 strategic themes that organize everything below" — but what they organize *toward* is the position. Marty Neumeier's **onliness statement** ("the ONLY [category] that [point of radical differentiation]") is the single most generative sentence in a brand [Neumeier, *Zag* (2006)]. Pillars are derivable from positioning; positioning is not derivable from pillars.

So the answer to the brief's central question is: **Voice + Pillars are two of a ~12-section minimum-lovable core — and not the two you build first.** The generative trio is **Positioning → Essence → Personality**; Voice and Pillars are what those *produce*.

### The recommended surface set (phased)

Each surface maps to a WS2 taxonomy section and a layer tag. Visual-layer rows are mostly **already shipped** via `--brand-*` and the Explorer; the Workbench's job is the strategy + verbal columns and the **[guideline]** logic over the existing assets.

#### Phase 1 — Minimum-Lovable Workbench (the generative core)

| Surface | WS2 section | Layer | Status in Visor | What it adds |
|---|---|---|---|---|
| **Positioning** (onliness) | Positioning [Neumeier] | strategy | new | The generative sentence; the only [strategy] input the others derive from |
| **Essence** | Brand essence [Aaker] | strategy | new | 2–3-word irreducible core |
| **Personality** | Personality [Aaker] | strategy | new | Brand-as-person traits; the bridge to voice |
| **Pillars** | Brand pillars | strategy | new | 3–5 themes, each *linked to tokens/components it governs* |
| **Voice** | Voice [Mailchimp] | verbal | new | Small fixed trait set (recommend 3–4) |
| **Tone by context** | Tone [Mailchimp; Material] | verbal | new | Voice flexed by UI state — the mode-aware half |
| **Word list** | Vocabulary / Lexicon | verbal | new | use / avoid pairs, agent-queryable |
| **Logo + lockups** | Logo + lockups [NASA] | visual | **shipped** (`logo`/`wordmark`/`brandmark` slots) | — |
| **Clearspace + min-size** | Clearspace/min-size [NASA] | visual→guideline | **partial** (`clearSpace`/`aspectRatio` tokens exist) | promote to an enforced, shown rule |
| **Misuse / don'ts** | Violations [NASA; Spotify] | guideline | new | the first true [guideline] surface over the marks |
| **Color + type** | Color / Typography | visual | **shipped** (token system) | — |

That is roughly a dozen sections, exactly WS2's "must-have set." Phase 1 is *lovable* because it closes the derivation chain end to end — positioning generates pillars, personality generates voice, voice flexes into tone, and every one of them is shown *on the running theme*, not in a PDF.

#### Phase 2 — Operational depth

| Surface | WS2 section | Layer |
|---|---|---|
| Messaging hierarchy / key messages | Messaging hierarchy | verbal/strategy |
| Taglines + boilerplate | Taglines / Boilerplate | asset |
| Grammar & mechanics | Grammar & mechanics [Mailchimp] | guideline |
| Color-usage + accessibility (WCAG 2.1 AA) | Color usage [Carbon; Material] | guideline |
| Audience / personas | Audience | strategy |
| Accessibility (holistic) + Legal/trademark | Accessibility; Legal [Mailchimp; Spotify] | application |
| Governance / versioning | Governance | application |

#### Phase 3 — Fully-loaded long tail (the extensible tier, not v1)

Archetype [Mark & Pearson, *The Hero and the Outlaw* (2001)], competitive frame, iconography/illustration/photography/motion/data-viz guidelines, co-branding/partner rules, templates, channel-specific guidance, merch/environment. WS2 is right that these appear only in mature programs — treat them as the documented long tail the schema must *allow*, not the surface to build first.

### Competitive / white-space scan

The brand-tooling market splits into three camps, and **none of them is token-native, copy-and-own, or AI-consumable** — the three properties that define Visor.

| Tool | What it does | For whom | Pricing / posture | Structural gap vs. Visor |
|---|---|---|---|---|
| **Frontify** | Cloud brand-management: editable guidelines + DAM + templates + portals, AI governance, usage analytics | Mid-market / enterprise marketing | MAU-based, quote-only ("only pay for active users") [Frontify — "Brand Guidelines" (frontify.com); "Pricing" (frontify.com/en/pricing)] | Guidelines are *authored content blocks*, not data derived from a token engine. No copy-and-own; brand lives in their cloud. Not built for agents. |
| **Brandpad** | Template-forward interactive guidelines; hex→RGB/PMS auto-calc; client sharing | Independent designers / studios | Free start, tiered by portfolio/features [Brandpad — "Pricing" (brandpad.io/pricing)] | A *publishing* tool. No live system underneath; the guideline never re-renders against running product code. |
| **Standards (standards.site)** | Code-free "guidelines as stylish websites"; type/color automations; account-free viewing | Designers / studios | SaaS | Visual-asset-centric. No strategy/verbal as data; no machine-readable export for agents. |
| **Zeroheight** | Design-system *documentation* synced from Figma/Storybook/repo; an editor-facing AI assistant for doc creation/maintenance | Product design-system teams | Free · Starter ~\$59/editor·mo (~\$49 annual) · Enterprise (custom) [zeroheight — "Pricing" (zeroheight.com/pricing)] | Closest on "AI context," but it *documents* a system someone else owns; it doesn't *generate* the identity from intent or model brand strategy as a typed schema. |
| **Brandfolder (Bynder)** | Enterprise DAM + brand-asset governance + analytics | 500-person marketing depts w/ regulatory exposure | Enterprise quote [Brandfolder — "DAM" (brandfolder.com/product)] | Asset *storage and enforcement*. No strategy layer, no token engine, no derivation. |
| **Design-system brand sites** (Polaris, Carbon, Material, Atlassian) | Publish brand/content *beside* live tokens & components | The owning org only | In-house / OSS | The right *shape* — content as a Foundation [Twilio Paste — "Content/Voice and tone" (paste.twilio.design); Shopify — "Voice and tone" (polaris.shopify.com)] — but **bespoke, single-tenant, hand-written prose**. Not a portable format, not multi-brand, not a product you can point at *your* identity. |

**Where Visor's white space is.** Three things, in combination, are structurally impossible for Frontify or Zeroheight to copy:

1. **Strategy as derivable data, not authored prose.** Every exemplar — even Mailchimp and Paste — ships strategy as *unstructured prose*. WS2's decisive observation: "[asset] sections are already well-served by tokens, [guideline] sections are semi-structured rules begging to be data, and [strategy] sections are almost always unstructured prose." A `.visor.yaml` that types positioning, essence, voice, and tone — and serializes them to JSON for a manifest an agent reads — is the unmet market need. Frontify *can't* do this; their guideline is a CMS, not a compiler.
2. **The same engine renders brand and product.** Visor already expands intent (`colors.primary`) into 53 derived tokens and renders brand marks live against them. No competitor owns both halves; their guideline and the consumer's product are different systems that drift. Visor's whole publish-gate philosophy exists to kill exactly that drift.
3. **Portfolio-OS with a public/private split.** One studio, many client brands. Visor's own brand is the **public flagship exemplar** in the OSS docs; client brands are **private** (synced, gitignored), exactly as the private-theme gallery already does (`packages/docs/lib/private-themes.ts`). Frontify charges per-brand per-MAU; a copy-and-own format charges nothing to fork the *N*th brand. That is a category Frontify's business model cannot follow.

**The one-line claim:** Frontify/Zeroheight *document or host* a brand; Visor *compiles* one — from typed intent, against a live token engine, for both humans and agents, across a whole portfolio.

### Data model — recommend a new top-level `brand-strategy` block

The brief asks where brand-strategy data should live. Four candidate homes:

| Option | Verdict |
|---|---|
| Extend the existing `brand` block | **No.** `brand` is cleanly typed as **[asset]** resolution (`VisorBrand` → `BrandResolution` → `--brand-*`, `packages/theme-engine/src/brand/types.ts`). Strategy is **[strategy]/[verbal]** — different lifecycle, different consumer (agents/prose, not CSS vars), different privacy posture. Mixing them pollutes a tight pipeline and breaks the asset/strategy separation WS2 is built on. |
| New top-level `brand-strategy` block in `.visor.yaml` | **Recommended.** Sits beside `brand`, mirrors the proven `typography`/`brand` structure, is parsed by the theme-engine, serializes to JSON for the manifest, and is extraction-clean — lift the block + its types into a future `@loworbitstudio/visor-brand` package with no churn. |
| Docs-layer schema only | **No.** Strands brand data in the docs app; defeats the interchange-format and AI-consumability goals and can't be consumed by non-docs adapters. |
| Future dedicated package now | **Premature.** Build the block *extraction-clean* first; promote to the package once the Phase-1 surfaces are validated by real use (same path `brand` itself took). |

This respects every Visor convention: `.visor.yaml` describes **intent**; the theme-engine validates it against the **two hand-maintained schema copies** (`docs/visor-theme.schema.json` + `packages/theme-engine/src/visor-theme.schema.json` — which have currently *drifted* out of sync, since no generator keeps them aligned, so a new block must be added to both by hand); it serializes to JSON for the agent manifest; and it is **mode-aware** where the WS2 taxonomy says tone should be (the verbal analog of theme/mode switching). One critical distinction from the token pipeline: strategy is **not expanded into derived values** — there is no "53 tokens from one input." It is validated, normalized, *linked* (pillars → tokens/components), and serialized. The engine's job here is coherence-checking and manifest emission, not generation.

**Phase-1 schema sketch:**

```yaml
# --- Brand strategy (optional; new top-level block) ---
brand-strategy:
  # [strategy] — the generative trio. Everything below derives from these.
  positioning:
    onliness: "The only design system that compiles a brand — visual AND verbal —
               from one portable file, for humans and agents alike."
    category: "design system"
    differentiation: "brand strategy as derivable, machine-readable data"
  essence: ["coherent", "inspectable", "yours"]      # 2–3 words (Aaker)
  personality:                                        # brand-as-person (Aaker)
    - trait: "precise"
      not: "fussy"                                    # antonym sharpens the trait
    - trait: "candid"
      not: "blunt"
  pillars:
    - id: "coherence"
      statement: "Every layer derives from the one above it."
      # The living link: this pillar is *proven by* these tokens/components.
      governs:
        tokens: ["--primary", "--surface-card"]
        components: ["button", "card"]
    - id: "ownership"
      statement: "Copy-and-own; no lock-in, ever."
      governs: { components: ["*"] }

  # [verbal] — voice is fixed; tone flexes (the mode-aware half).
  voice:
    traits:
      - name: "plainspoken"
        do: "Say the thing. One clause."
        dont: "Bury it in qualifiers."
      - name: "candid"
        do: "Name the tradeoff out loud."
        dont: "Hedge."
  tone:
    # Keyed by REAL UI state — the verbal analog of light/dark mode.
    # Each maps to a component/state the Explorer already renders.
    error:    { feeling: "calm, accountable", example: "That didn't save. Here's why — and the fix." }
    success:  { feeling: "quietly affirming", example: "Saved. You're set." }
    empty:    { feeling: "inviting",          example: "Nothing here yet. Add your first theme." }
    loading:  { feeling: "unhurried",         example: "Composing your tokens…" }
  lexicon:
    - use: "theme"          ; avoid: "skin"
    - use: "copy-and-own"   ; avoid: "fork"
    - use: "compose"        ; avoid: "drag-and-drop"

  # Privacy posture: Visor's own brand is public (OSS docs flagship);
  # client brands set `visibility: private` → synced + gitignored,
  # exactly as the private-theme gallery already handles themes.
  visibility: public   # public | private
```

The serialized JSON form of this block becomes `brand-strategy` in the agent manifest — an agent reads `voice.traits` and `tone.error` the same way it reads a component's `when_to_use` today (`docs/ai-consumability.md`), then writes an error toast in the brand's actual voice without parsing a single line of prose.

### What makes it "living" — and how it proves cohesion

A static brand PDF asserts; a living brand system *demonstrates against the running product, and re-demonstrates the instant either side changes.* Visor already has the proof mechanism for the visual layer — the Explorer renders the marks on light/dark surfaces and the Showcase is "a deliberately curated composite… everything is a real Visor component on live theme tokens — switch theme/mode and the whole surface re-resolves" (`packages/docs/components/playgrounds/sections/showcase.tsx`). The Workbench's mandate is to give **strategy and verbal the identical treatment**, so brand strategy is *tested*, not *filed*:

1. **Voice shown on real components, not in a callout.** Render each voice trait as live copy inside an actual `Button`, `Alert`, and `Banner` on the active theme — the same components the Showcase already drives. Switch theme and the *words stay* while the *surface re-resolves*: the cohesion question becomes "does this voice still sing on *this* identity?" — the verbal twin of the "do they sing" mark test that `brand.tsx` already runs.
2. **Tone mapped to real UI states (the mode-aware payoff).** `tone.error` renders in a real `StatusBadge`/`Alert` error state; `tone.empty` in a real empty-state; `tone.loading` in a real `Skeleton`/progress. Tone-by-context stops being a table and *becomes the product's actual error message*. This is the single highest-leverage move: it's the one place Visor's mode-switching architecture has a direct verbal analog, and it's invisible to every PDF-shaped competitor.
3. **Pillars linked to the tokens and components they govern.** The `governs` field turns each pillar from a slogan into a *claim the system can check*: click "coherence" and the Explorer highlights `--primary`/`button`; if a pillar governs nothing, that's a visible smell. This is the strategy layer made inspectable — the frontier WS2 names ("making strategy equally inspectable… queryable data an agent can read, not prose an agent must parse").
4. **Co-located with the live system, so it can't drift.** Like Material, Polaris, and Paste, the strategy ships *in the same surface as the running tokens and components* [Twilio Paste — "Content" (paste.twilio.design)]. Because it's a block in the same `.visor.yaml` the engine already compiles, the publish-gate philosophy extends to it for free: a coherence check ("every pillar `governs` a real token; every `tone` key maps to a state with a registered component") fails CI exactly the way token drift does. The dead-PDF failure mode is *structurally* unavailable.
5. **Examples over assertions, enforced by schema.** WS2's first living-system rule — "Mailchimp doesn't say 'be clear,' it shows a confused-on-Twitter reader and the right response" — is encoded by making `do`/`dont`/`example` first-class fields. A voice trait without a worked example is an incomplete record the validator can flag, so the book *can't* regress into adjectives.

The result is a brand system that is portable (one file), derivable (each layer falls out of the one above), inspectable (humans *and* agents query it), and *self-proving* (it renders against — and is gated against — the live design system). That is the Brand Workbench: not a place to *write* a brand, but a place to *compile* one and watch it hold together.

---

## 4. WS4 — Zero-to-Brand Elicitation + AI Opportunity

The interesting fact about brand strategy is how *structured* the supposedly-mystical part actually is. A founder "knows the brand in their gut," and the strategist's job is to get it out of the gut and onto a page. The methods that do this are not improvisation — they are **fixed question sets bolted to named frameworks**, run as time-boxed workshops. That structure is exactly why this is a tractable AI surface, and exactly why the failure modes are predictable. This section documents the real practice (Part A), then assesses the build (Part B).

### Part A — How strategists elicit a brand from a founder

Every credible elicitation method shares a shape: **diverge** (get everything out of heads), **converge** (force prioritization), **fit** (snap the output into a canonical framework — positioning statement, archetype, value set, message house). The differences are which framework and which prompts. Here are the canonical ones.

#### The GV "Brand Sprint" (Jake Knapp / Google Ventures)

The single best-documented elicitation method, and the closest thing to a turnkey script. Knapp built it as a three-hour, founder-in-the-room workshop with **six exercises run in sequence**, each producing a concrete diagram [Knapp, *"The Three-Hour Brand Sprint"* (library.gv.com)]. The discipline is the point: short timeboxes, individual note-then-vote (to avoid the loudest-voice problem), and a single "Decider" who breaks ties. The six:

| # | Exercise | What it extracts | The prompt |
|---|----------|------------------|------------|
| 1 | **20-Year Roadmap** | Long-horizon purpose; forces thinking past the next funding round | "Where could this company be in 20 years? Sketch milestones at 5/10/15/20 years." |
| 2 | **What / How / Why** | Core purpose, structured as Sinek's Golden Circle | "*What* do we make? *How* do we do it differently? *Why* does the company exist?" |
| 3 | **Top 3 Values** | The non-negotiables | Brainstorm many; cut to three. The gut-check: pick values you'd hold *even at a cost*, not generic virtues every company claims. |
| 4 | **Top 3 Audiences** | Who the brand is *for* (and the priority order) | "List every audience; rank them. Which one wins when they conflict?" |
| 5 | **Personality Sliders** | Attitude and style, made tangible | Place a dot on each spectrum between opposing traits. |
| 6 | **Competitive Landscape** | Where the brand sits vs. competitors — the open space to own | Plot competitors and your own position on a 2×2 map (axes *classic ↔ modern* and *expressive ↔ reserved*); find the white space. |

The exercises map almost one-to-one onto the surfaces WS1–WS3 are debating: purpose (1, 2), values (3), audience (4), personality/voice (5), and competitive positioning (6). That alignment is the strongest single signal in this spike that **voice + pillars is the floor, not the ceiling** — the canonical founder-extraction ritual produces *six* distinct artifacts, and positioning is one of them.

The **Personality Sliders** deserve a note because they are the mechanic most directly portable into a Visor workbench. Each slider is a spectrum between two opposing adjectives — the canonical examples are pairs like *friendly ↔ authoritative*, *young ↔ mature*, *playful ↔ serious*, *mass-market ↔ elite/exclusive* — and the team marks where the brand sits [Knapp, *"The Three-Hour Brand Sprint"* (library.gv.com); the specific pairs above are illustrative of the format, which Knapp specifies, rather than a fixed canonical list]. The slider is doing real work: it turns an ineffable quality ("we're warm but not soft") into a *coordinate*, which is to say into **data** — the same move Visor already makes when it turns "this theme feels confident" into token values.

#### Marty Neumeier's exercises — the Onliness Statement

Neumeier's contribution is the sharpest *differentiation* tool. The **Onliness Statement** is a fill-in-the-blank that forces a brand to claim a category of one:

> "Our brand is the only ___ [category] that ___ [benefit]." [Neumeier, *Zag: The #1 Strategy of High-Performance Brands* (2006)]

Expanded, Neumeier hangs six interrogatives off it — *what, how, who, where, why, when* — so the statement carries offering, mechanism, audience, market, purpose, and timing. His test is brutal and useful: "If you can't say why your brand is both different and compelling in a few words, don't fix your positioning statement… fix your company" [Neumeier, *"The Onlyness Test"* (martyneumeier.com)]. The downstream artifact is the **trueline** — "the one true thing you can say about your brand, based on your onliness statement," which competitors can't claim and customers find credible [Neumeier, *Zag* (2006)]. Onliness is the elicitation prompt; trueline is the compressed output.

#### Geoffrey Moore's positioning template

The most-copied positioning *mad-lib* in tech, from *Crossing the Chasm*. It is a single sentence with five slots:

> "For **(target customer)** who **(need/opportunity)**, **(product)** is a **(category)** that **(key benefit)**. Unlike **(primary competitive alternative)**, our product **(primary differentiation)**." [Moore, *Crossing the Chasm* (1991/2014)]

Moore's framing is that this must pass "the elevator test." The value for an AI flow is that the *slots are explicit*: customer, need, category, benefit, alternative, differentiator. That is a schema, not prose.

#### Brand archetypes — the card-sort

From Mark & Pearson's *The Hero and the Outlaw*, the **twelve archetypes** (Innocent, Sage, Explorer, Outlaw, Magician, Hero, Lover, Jester, Everyman, Caregiver, Ruler, Creator) organized into four motivational quadrants — stability, independence, belonging, mastery [Mark & Pearson, *The Hero and the Outlaw: Building Extraordinary Brands Through the Power of Archetypes* (2001)]. The authors report that tightly-defined-archetype brands outperformed "confused" brands on a value metric over six years — the empirical hook for the whole method. As an *exercise*, this runs as a **card-sort or quiz**: the founder ranks or eliminates archetype cards until a primary (and often secondary/tertiary) emerges. This is the most quiz-native of all the methods — there are dozens of public archetype quizzes precisely because the format is mechanical [e.g. Vision One, Branding5, archetypes.com brand-archetype quizzes].

#### Value-sort / "values diamond"

A structured convergence ritual: brainstorm a large value pool, then sort cards into *not important / important / very important*, discard the first two piles, affinity-cluster the survivors, and force-rank down to 3–5 [SessionLab, *"Core Values"* workshop library; Learning Loop, *"Top Brand Values"*]. The recurring expert warning: naïve runs produce *aspirational* virtue-lists ("integrity, innovation, excellence") rather than *authentic drivers*; good facilitation interrogates actual behavior, not wishes. This is the same diverge→converge→deduplicate shape as Sprint exercise #3.

#### Message house

The output-side framework that organizes the *messaging* once strategy is set: a **roof** (one overarching umbrella statement), **3–4 pillars** (supporting themes), and a **foundation** of proof points (evidence, data, quotes) under each pillar [Umbrex, *"Message House Framework"*; The Branding Journal, *"The Strategic Advantage of a Messaging House"*]. Note the direct overlap with WS-level "pillars" — the message house is essentially *pillars + evidence*, and its single-page hierarchy is a clean serialization target.

**Synthesis across all six methods:** the strategist's elicitation is a fixed funnel — *purpose → audience → values → personality → differentiation → message*, each step a prompt set that snaps to a named template. Nothing here is improvised, which is the whole reason Part B is plausible.

### Part B — An AI "Zero-to-Brand-Strategy" tool

Because the workshops are structured question sets plus framework-fitting, the elicitation maps cleanly onto an **LLM-driven intake flow**:

1. **Intake interview** — an adaptive Q&A that walks the Sprint/Neumeier/Moore prompts conversationally, asking follow-ups when answers are thin (the human facilitator's job).
2. **Framework fit** — classify the answers: snap personality answers onto sliders, run an archetype card-sort against the twelve, force-rank values, slot the positioning mad-lib.
3. **Draft** — emit a positioning statement (Moore), an onliness/trueline (Neumeier), primary + secondary archetype, 3 pillars + proof scaffolding (message house), and a voice/tone definition.
4. **Iterate** — present drafts, let the founder push back, regenerate. This is the loop a human strategist runs across review sessions.

#### What already exists (honest scan)

| Tool / class | What it actually does | Strategy elicitation? |
|---|---|---|
| **Looka, Brandmark, Tailor Brands** | AI *visual* identity: logo, palette, fonts, brand-kit, social templates from a name + style picks | No. Visual identity only; no positioning/archetype/voice-from-scratch. Results trend "templated" [2025–26 AI logo-generator reviews] |
| **Frontify AI** | Brand *management at scale*: auto-tag assets, scan content for off-brand color/logo/tone, enforce guidelines in workflow | No — explicitly **enforcement**, not authoring. "AI is intelligent automation designed to protect and enforce your brand identity at scale." Assumes the brand already exists [Frontify, *"AI for Brand Management"*] |
| **Jasper / copy tools "Brand Voice"** | Ingest sample copy, then generate on-voice long-form content | Partial: captures voice *from existing samples*; does not derive strategy. Voice/tone execution is the easy half to automate; the upstream strategy is not (the report's own read of the category) |
| **Custom GPTs / ChatGPT prompt packs** | Questionnaire → drafted brand-strategy doc (mission, positioning, voice) | Closest to the target flow — but ad hoc, ungrounded, no framework rigor, no persistence, output reads generic [aiforwork; cxl, *"Build a custom GPT for your brand"*] |

The honest read: **the white space is the strategy layer.** Identity generators own pixels; management platforms own enforcement; copy tools own voice-from-samples. **No mainstream tool runs the founder-elicitation funnel and emits a structured, framework-grounded strategy object** (positioning + archetype + pillars + voice as *data*). Custom GPTs gesture at it but are unstructured and unowned. The recurring observation across 2025–26 commentary on AI and brand names the exact gap Visor could fill: AI is strong at *executing* voice and tone, but founders must still define mission and positioning first — they can *recognize* their brand's personality when they see it yet can't *craft* the strategic framework themselves (they know they want to sound "approachable but expert" but have no idea how to write a mission statement, positioning, or messaging themes) [AVINTIV, *"How AI Is Reshaping Brand Strategy"* (2025), as representative commentary].

#### Build complexity — what's easy vs. hard

**Easy (structured Q&A + LLM drafting).** The intake interview, framework-fitting, and first-draft generation are squarely in current LLM capability. The prompts are public and finite; the output frameworks (Moore slots, twelve archetypes, message-house tiers) are schemas. An LLM is *good* at "given these answers, fill this template" and "given this personality, which of twelve archetypes fits." This is a weekend prototype, a quarter to make it good.

**Hard (taste, coherence, visual identity).** Three ceilings, in rising order of difficulty:
- **Coherence** — ensuring positioning, archetype, pillars, and voice tell *one* story (Sprint exercise #6 is literally a human doing this). An LLM will happily emit a Sage positioning with a Jester voice. Cross-artifact consistency checking is doable but is real engineering, not a prompt.
- **Taste** — the gap between "technically on-framework" and "actually good." Strategy quality is a judgment call a senior strategist makes; LLMs regress to the safe, generic mean, which is fatal in a discipline whose *entire purpose is differentiation*. An onliness statement that isn't actually "only" is worse than none.
- **Visual identity** — turning strategy into a coherent logo/type/color system at pro quality remains the hardest leg (the existing generators prove the ceiling). Visor mostly sidesteps this: its *theme-engine already does strategy→tokens*, so a brand-strategy object feeding theme intent is far more in-reach than asking an LLM to design a logo.

#### Where it could live in the Visor world

Three homes, in order of recommendation:

1. **A Brand Workbench mode (recommend).** "Elicit" sits alongside the cohesion/Showcase surfaces as a guided intake that *outputs the brand-strategy block* this spike is defining. It writes data the rest of the system already consumes — natural fit, and it dogfoods Visor's own brand as the flagship exemplar.
2. **A CLI command** (`visor brand init`) — an agent-first, scriptable intake emitting `.visor.yaml` brand-strategy data, matching Visor's AI-consumability and copy-and-own ethos. Strong as a *companion* to the workbench mode, weaker alone (conversational elicitation wants a richer surface).
3. **A separate product** — the eventual `@loworbitstudio/visor-brand` package could expose this as a standalone "zero-to-brand" tool. Right as a *long-term* extraction target; premature as the first build.

The decisive argument for homes 1–2: whatever the elicitation emits should be the **same structured brand-strategy object** the WS1–WS3 surfaces define. Build the data model first; the elicitation flow is then "just" a friendly front-end that writes it.

**Risks to design against, up front:**
- **Generic output** — mitigate by grounding every draft in the founder's *specific* intake answers and forcing the Neumeier "is this actually *only*?" test before accepting positioning.
- **Hallucinated positioning** — the LLM inventing differentiators the company can't back. Require proof-point capture (message-house foundation) as a gate, not an afterthought.
- **Taste ceiling** — position the tool as a *first-draft accelerator and structurer*, explicitly not a strategist replacement. The honest frame ("get you from blank page to a structured, reviewable v1") is both more credible and more defensible than "AI does your brand."

### WS4 takeaways

**The canonical question-set an AI flow would operationalize** (the union of the methods above, in funnel order):
1. *Horizon* — Where is this in 20 years? (Sprint #1)
2. *Purpose* — What do you make, how is it different, **why** do you exist? (Golden Circle / Sprint #2)
3. *Audience* — Who is it for, ranked; who wins in a conflict? (Sprint #4)
4. *Values* — Which 3 would you hold even at a cost? (Sprint #3 / value-sort)
5. *Personality* — Where do you sit on each trait spectrum? (Sprint #5 sliders)
6. *Archetype* — Which of the twelve, primary + secondary? (Mark & Pearson card-sort)
7. *Positioning* — For [X] who [need], we are the [category] that [benefit], unlike [alt], because [diff]. (Moore)
8. *Onliness* — We are the *only* [category] that [benefit]. (Neumeier)
9. *Message* — One roof line, three pillars, proof under each. (Message house)

**Feasibility verdict.** A zero-to-brand-strategy elicitation tool is genuinely buildable *now* for the structured 80% — intake, framework-fitting, and first-draft generation are well inside current LLM capability because the underlying workshops are finite, public question sets that snap to named templates, and no incumbent owns this strategy layer (generators do pixels, Frontify does enforcement, copy tools do voice-from-samples). The hard 20% is coherence and taste, where LLMs regress to a generic mean that is *actively harmful* in a differentiation discipline — so the tool must be framed and engineered as a *structuring first-draft accelerator that emits Visor's brand-strategy data object*, not an autonomous strategist. Built that way, as a Workbench mode plus a `visor brand init` CLI over a shared, extraction-clean data model, it is a high-leverage, defensible, near-term opportunity — and the cleanest possible proof that Visor's "design intent as data" thesis extends from tokens all the way up to brand.

---

## 5. WS5 — Synthesis, Recommendation & Roadmap

Four workstreams converge on one conclusion: brand strategy is more *structured* than the operator's intuition suggests, the structured part is exactly the white space no competitor occupies as data, and Visor is unfairly suited to own it because it already compiles design intent. This section turns that into a buildable plan — the schema to encode, the phase order, the framework to adopt for Visor's own brand, a primer to level the operator up, a reading list, and the genuine forks left open.

### (a) The recommended brand MODEL — the "Brand Record"

The frameworks disagree on packaging but agree on contents. Strip away the proprietary diagrams (Aaker's 12-cell grid, Kapferer's hexagon, Keller's pyramid) and the same small set of concepts recurs in every credible model — and *those* are the schema. I name the canonical object the **Brand Record**: one serializable file that is the source of truth for what a brand *is and how it speaks*, distinct from the asset block that governs how it *looks*.

The Record has four strata, mirroring WS2's taxonomy (strategy → verbal → visual → application) and ordered so each derives from the one above:

- **Strategy (the generative core).** `positioning` (Neumeier's *onliness* statement — "the only [category] that [benefit]"), `essence` (Aaker's irreducible 2–3-word core), `personality` (brand-as-person traits, each sharpened by an antonym), `pillars` (3–5 themes, each *linked to the tokens/components it governs*), and `archetype` (one of the twelve Pearson/Mark characters — the one-token field that seeds voice).
- **Verbal (derived from personality).** `voice` (a small *fixed* trait set, 3–4, each with do/don't/example) and `tone` (voice *flexed* by context, keyed to real UI states), plus `lexicon` (use/avoid pairs) and `messaging` (a message-house roof → pillars → proof).
- **Visual + application (mostly already shipped, or later).** The existing `brand` asset block and token system cover the visual payload; `governance` and `visibility` (public/private) are thin application-layer fields.

One correction from WS1's framing, folded in here: Aaker's 1996 identity system contributes **brand personality** (one of four perspectives) and the **core/extended identity** split, and connects identity to value proposition and brand-customer relationship — it does *not* itself frame personality as a "bridge to voice" (that is our synthesis), and "brand essence" as a named centerpiece belongs more precisely to Aaker's later brand-vision work. We adopt the *structures* (personality, core/extended) and own the derivation argument as Visor's.

A concrete sketch, extraction-clean for `@loworbitstudio/visor-brand`:

```yaml
# New TOP-LEVEL block in .visor.yaml — sibling to `brand`, NOT nested inside it.
brand-strategy:
  # --- Strategy: the generative core. Everything below derives from these. ---
  positioning:
    onliness: "The only design system that compiles a brand — visual AND verbal —
               from one portable file, for humans and agents alike."   # Neumeier, Zag (2006)
    category: "design system"
    differentiation: "brand strategy as derivable, machine-readable data"
  essence: ["coherent", "inspectable", "yours"]          # 2–3 words; Aaker core
  personality:                                            # brand-as-person; Aaker
    - trait: "precise"   ; not: "fussy"                   # antonym sharpens the trait
    - trait: "candid"    ; not: "blunt"
  archetype:                                              # Pearson & Mark, 12 distinct
    primary: "sage"        # mastery/truth  (Sage and Explorer are SEPARATE archetypes)
    secondary: "creator"
  pillars:
    - id: "coherence"
      statement: "Every layer derives from the one above it."
      governs: { tokens: ["--primary", "--surface-card"], components: ["button", "card"] }
    - id: "ownership"
      statement: "Copy-and-own; no lock-in, ever."
      governs: { components: ["*"] }

  # --- Verbal: voice is FIXED; tone FLEXES (the mode-aware half). ---
  voice:
    traits:
      - name: "plainspoken" ; do: "Say the thing. One clause." ; dont: "Bury it in qualifiers."
      - name: "candid"      ; do: "Name the tradeoff out loud." ; dont: "Hedge."
  tone:                                  # keyed to REAL UI states the Explorer renders
    error:   { feeling: "calm, accountable",   example: "That didn't save. Here's why — and the fix." }
    success: { feeling: "quietly affirming",   example: "Saved. You're set." }
    empty:   { feeling: "inviting",            example: "Nothing here yet. Add your first theme." }
    loading: { feeling: "unhurried",           example: "Composing your tokens…" }
  lexicon:
    - use: "theme"        ; avoid: "skin"
    - use: "copy-and-own" ; avoid: "fork"
  messaging:                              # message-house; deferred to Phase 2
    roof: "Design intent as data — all the way up to brand."
    pillars: ["coherence", "ownership"]   # references pillars[].id

  core: ["positioning", "essence", "pillars"]   # Aaker core/extended: immutable subset
  visibility: public                            # public | private  (client brands: private)
```

The serialized JSON form becomes `brand-strategy` in the agent manifest. An agent reads `voice.traits` and `tone.error` the same way it reads a component's `when_to_use` today (`docs/ai-consumability.md`, confirmed), then writes an error toast in the brand's actual voice without parsing prose. One critical distinction from the token pipeline: strategy is **not expanded into derived values** — there is no "53 tokens from one input." It is validated, normalized, *linked* (pillars → tokens/components), and serialized. The engine's job here is coherence-checking and manifest emission, not generation.

### (b) Prioritized + phased section set — *Is Voice + Pillars enough?*

**Verdict, up front: No.** Voice and Pillars are two of a ~12-section minimum-lovable core, and they are not the two to build first. The reason is structural, confirmed across all four workstreams. Mailchimp's actual engine is *tone* ("you have the same voice all the time, but your tone changes" — verified verbatim at the primary source), so Voice without tone-by-context is a personality with no behavior. Voice without Personality/Essence is unfalsifiable — "plainspoken" is a preference, not a consequence. Pillars without Positioning float, because pillars are derivable *from* the position, not the reverse. And the strongest external signal: the canonical founder-extraction ritual, the GV Brand Sprint, runs a *half-dozen* exercises spanning purpose, values, audience, personality, and competitive position — not two. The generative trio is **Positioning → Essence → Personality**; Voice and Pillars are what those *produce*.

**Phase 1 — Minimum-Lovable Workbench (the generative core, ~12 sections).** New: Positioning (onliness), Essence, Personality, Pillars (token-linked), Voice, Tone-by-context, Lexicon. Already shipped: Logo/wordmark/brandmark slots, Color + Type tokens. Promote to enforced guidelines: Clearspace/min-size (the `clearSpace`/`aspectRatio` fields already exist on `BrandSlot`), and Misuse/don'ts — the first true `[guideline]` surface over the marks. Phase 1 is *lovable* because it closes the derivation chain end to end and shows every field *on the running theme*: voice rendered as live copy inside a real `Button`/`Alert`; `tone.error` rendered in a real error state; each pillar's `governs` highlighting the tokens it claims. That last move makes strategy *self-proving* — a pillar that governs nothing is a visible smell a CI coherence check can fail, exactly the way token drift fails today.

**Phase 2 — Operational depth.** Messaging hierarchy / key messages (the message house), Taglines + boilerplate, Grammar & mechanics, Color-usage + accessibility (note: **WCAG 2.1 AA**, not bare "WCAG-AA"), Audience/personas, holistic Accessibility + Legal/trademark, and Governance/versioning.

**Phase 3 — Fully-loaded long tail (allow, don't build).** Competitive frame, iconography/illustration/photography/motion/data-viz guidelines, co-branding/partner rules, templates, channel-specific guidance, merch/environment. The archetype field lands in Phase 1 (it is one enum that seeds voice); the deeper archetype *application* guidance is long-tail. These appear only in mature programs — the schema must permit them; the v1 surface must not chase them.

### (c) Recommended framework(s) for authoring Visor's OWN brand

Adopt a **composed stack of three**, chosen because they map to *distinct data shapes* rather than overlapping — and apply them in this order:

1. **Neumeier's onliness statement as the spearhead** (*Zag*, 2006). Write Visor's `positioning.onliness` first and apply Neumeier's brutal litmus: if you can't say the difference with the word *only*, fix the company, not the sentence. For Visor the onliness is legitimately ownable: *the only design system that compiles a brand — visual and verbal — from one portable file, for humans and agents.* This is the single most generative field; everything else checks against it. (Convention caveat from verification: the tagline-vs-slogan boundary is a useful *prevailing* convention practitioners often blur — Nike's "Just Do It" is the canonical campaign slogan that *hardened into* a permanent tagline — so do not over-formalize that split in the schema.)
2. **A Brand-Key-style one-pager as the structured spine** (Unilever Brand Key). Fill the finite field set — insight, target, benefits, values/personality, reasons-to-believe, discriminator, essence — to force the substance behind the spearhead. It serializes 1:1 to the Brand Record's strategy stratum; it is a *form*, which is what an extraction-clean schema wants to be.
3. **The 12 Archetypes as the personality/voice key** (Mark & Pearson, *The Hero and the Outlaw*, 2001 — the twelve-archetype model is principally Carol Pearson's earlier work, applied here to branding). Pick Visor's `archetype.primary` decisively — **Sage** (mastery, truth, expertise) with a **Creator** secondary — and let it deterministically seed voice and tone. The full, *distinct* twelve are: Innocent, Explorer, Sage, Hero, Outlaw, Magician, Regular Guy/Gal (Everyman), Lover, Jester, Caregiver, Creator, Ruler. (Sage and Explorer are separate archetypes — do not conflate them.)

Borrow two structural ideas without adopting the heavy frameworks wholesale: **Aaker's core/extended split** (mark `core: [...]` as the immutable subset, the rest overridable — which dovetails with Visor's theme/mode override model), and **Keller's resonance pyramid as a future *diagnostic* overlay** ("how resonant is this brand?"), never an authoring form. Keep `why` (Sinek) as a single seed field for the about-page/manifesto — one idea should not structure the whole model. *(This trio recommendation is our synthesis for Visor's constraints, not a claim from any single source.)*

### (d) Operator primer — leveling up

**The mental model.** A brand is not the logo and not what you say — it is the gut feeling someone has about you (Neumeier). You can't paint the feeling directly, so you work a pipeline: **strategy decides → identity expresses → guidelines enforce.** Strategy is the upstream decisions (who you serve, how you differ, what you stand for); identity is the visible/audible system (marks, tokens, voice-in-practice); guidelines are the rules that keep it consistent so nobody relitigates it per artifact. Visor today has only the *expression* and *enforcement* of the *visual* identity as data; the entire spike is about making *strategy* — and the *verbal* identity — data too.

**The 10 terms that matter** (use them precisely): **Positioning** (how you're perceived *relative to alternatives*) · **Onlyness** (the radical-difference sentence: "the only X that Y") · **Essence** (the 2–3-word timeless core, internal-facing, not a tagline) · **Pillars** (3–5 strategic themes everything hangs on) · **Archetype** (a universal character — Sage, Creator — that makes meaning instantly legible) · **Personality** (the human traits you'd attribute to the brand) · **Voice** (your character in language — it *never changes*) · **Tone** (voice *flexed* for context and the reader's emotional state — it changes constantly) · **Messaging hierarchy** (the ranked ladder of what you say: roof → pillars → proof) · **Promise** (the experience you commit to every time). The one distinction to burn in: **voice is fixed, tone flexes** — and tone-by-context is the verbal twin of Visor's mode switching.

**The 3 mistakes to avoid.** (1) **Starting at voice.** Voice and pillars are visible, so they tempt you first — but they're *outputs*. Author positioning, essence, and personality first or your adjectives are unfalsifiable. (2) **Aspirational values masquerading as authentic ones.** A naïve values exercise yields "integrity, innovation, excellence" — virtues every company claims. The fix (from the value-sort ritual): name only values you'd hold *even at a cost*, interrogating actual behavior, not wishes. (3) **Trusting AI taste in a differentiation discipline.** LLMs regress to a safe, generic mean — fatal where the entire job is to be *only*. An onliness statement that isn't actually "only" is worse than none. Use AI to *structure and draft*, then apply the human "is this actually only?" test as a gate.

### (e) Curated reading list

**Start here**
- **Marty Neumeier — *The Brand Gap*** — the 90-minute foundation: what a brand actually is, and the five-discipline bridge from strategy to design. Read first.
- **Marty Neumeier — *Zag*** — the onliness statement and the "trueline"; the sharpest differentiation tool and the most directly serializable field in the schema.
- **Mailchimp Content Style Guide** (`styleguide.mailchimp.com`) — the canonical *verbal* brand book: four fixed voice traits, tone mapped to the reader's emotional state, a real word list. The model for Visor's verbal surfaces.

**Go deeper**
- **Carol Pearson & Margaret Mark — *The Hero and the Outlaw*** — the twelve archetypes and the empirical case (the Young & Rubicam study) that tightly-defined-archetype brands outperform "confused" ones; the source for the `archetype` field.
- **Simon Sinek — *Start With Why*** — the Golden Circle; use it to seed the `why`/manifesto, not to run the brand.
- **David Aaker — *Building Strong Brands*** — the full identity anatomy, the four perspectives, and the core/extended split we borrow for the override mechanic.
- **Jake Knapp — "The Three-Hour Brand Sprint"** (`library.gv.com`) — the turnkey six-exercise founder-elicitation script (note: exercise six is **Competitive Landscape**, a 2×2 competitor map, not a wrap-up). The blueprint for an "Elicit" mode and `visor brand init`.

**Reference**
- **Geoffrey Moore — *Crossing the Chasm*** — the five-slot positioning mad-lib (target/need/category/benefit/alternative/differentiator); a schema, not prose.
- **Kevin Lane Keller — CBBE / Brand Resonance Pyramid** — the customer-side diagnostic to adopt later as a maturity overlay.
- **Twilio Paste — Content / Voice & Tone** (`paste.twilio.design`) and **Shopify Polaris — Content** (`polaris.shopify.com`) — proof that the leaders ship verbal content *as a Foundation beside live tokens*, the exact co-location shape Visor should match.
- **NASA Brand Guidelines** (`nasa.gov/nasa-brand-center`) and **Spotify Design Guidelines** (`developer.spotify.com/documentation/design`) — the canonical asset-guideline trio (clearspace, min-size, misuse/violations) to promote over Visor's marks.

### (f) Open questions / decisions for operator review

I recommend a position on each fork, then ask for agreement — these should resolve before Phase 1 build, not during it.

1. **Data-model home.** *Recommend:* a **new top-level `brand-strategy` block** in `.visor.yaml`, sibling to `brand`. Extending `brand` is wrong — it is cleanly typed asset resolution (`VisorBrand` → `--brand-*`), a different lifecycle, consumer, and privacy posture. A dedicated package now is premature; build the block extraction-clean and promote it once Phase-1 surfaces are validated, the same path `brand` itself took. *Agree?*
2. **Two schema copies have drifted — fix before adding a block.** Confirmed by diff: the maintained copies are *not* in sync. The fuller theme-engine copy's top-level set is `name, version, group, colors, colors-dark, typography, brand, spacing, radius, shadows, strokeWidths, motion, overrides, migrate` (required: `name, version, colors`); the docs copy is a subset missing `group`, `strokeWidths`, and `migrate`. There is no generator keeping them aligned. *Recommend:* reconcile the two copies (or generate one from the other) *before* `brand-strategy` lands, so the new block doesn't inherit the drift.
3. **Public/private split mechanics.** *Recommend:* reuse the proven private-theme pattern exactly — a `visibility: public|private` field, with private Brand Records synced + gitignored via the `@low-orbit-studio/visor-themes-private` install-or-not generation step (`scripts/generate-private-themes.mjs`). Visor's own Record is the public OSS flagship. *Open sub-question:* do private *strategy* records live in the same private package as private *themes*, or a parallel one?
4. **How far into verbal/visual in Phase 1.** *Recommend:* Phase 1 goes deep on **verbal** (voice + tone + lexicon, rendered live) because tone-by-context is the mode-aware move no competitor can copy — but stays *shallow* on visual guidelines (only promote the existing clearspace/min-size and add misuse). *Fork:* whether messaging-hierarchy is pulled forward into Phase 1 or held at Phase 2 (I hold it at 2 — it needs pillars stable first).
5. **Build-vs-buy vs the competitive set.** The scan is decisive: Frontify/Brandfolder *host*, Brandpad/Standards *publish*, Zeroheight *documents* (correction: zeroheight ships **Free / Starter / Enterprise** — there is no "\$399 Growth" tier — and its AI is a generic editor-facing assistant, not confirmed Claude/Cursor context). None is token-native, copy-and-own, or strategy-as-data. *Recommend:* **build** — Visor *compiles* a brand from typed intent against a live engine; that is structurally impossible for a CMS or DAM to copy, and the portfolio public/private split breaks their per-MAU business model.
6. **The AI-elicitation bet.** *Recommend:* **take it, but framed narrowly** — an "Elicit" Workbench mode plus a `visor brand init` CLI that runs the finite, public elicitation funnel (Sprint → Moore → Neumeier → archetype card-sort → message house) and emits the Brand Record. The structured 80% (intake, framework-fit, first draft) is a near-term build; the hard 20% (coherence, taste) is real engineering, so position it as a *structuring first-draft accelerator*, explicitly not an autonomous strategist. Build the data model first; the elicitation flow is then a friendly front-end that writes it. *(Verification note folded in: the industry observation that AI "stops at tone" and that founders "recognize but can't craft" strategy is a defensible general theme, not a quote attributable to the originally-cited sources — treat it as our paraphrase, not a citation.)*

The through-line: Visor's thesis is *design intent as data*. This spike proves the thesis extends from tokens all the way up to brand — and that the cleanest demonstration is Visor authoring its *own* Brand Record as the public flagship, compiled and gated against the very design system it ships.

---

## 6. Methodology & verification

This report was produced as a deep-research spike, executed by a multi-agent workflow. Nine web-enabled sub-agents fanned out — one per research workstream (WS1, WS2, and WS4 in parallel; WS3 grounded in the WS2 taxonomy and a prior pass over Visor's codebase) — followed by one **adversarial fact-checker per workstream** and a final synthesis agent (WS5). Every agent was instructed to cite primary/authoritative sources — the actual brand books, real public brand guidelines, and official product docs — and to avoid listicles and fabricated citations.

**Adversarial verification.** Before synthesis, each workstream's load-bearing claims were handed to an independent skeptic agent prompted to *refute* them against primary sources. Of **43 key claims** checked, **37 were fully supported as stated** and **6 were partially supported**; **none were refuted**. All six corrections are folded into the sections above — this ledger records what changed:

| Workstream | Claims | Fully supported | Corrections folded in |
|---|---|---|---|
| WS1 Fundamentals | 10 | 10 | Tagline/slogan boundary softened to a *prevailing convention*, not a law (Nike's "Just Do It" is itself a campaign slogan that hardened into a tagline). |
| WS2 Guideline taxonomy | 12 | 11 | The 12 archetypes are distinct (Sage ≠ Explorer); *Zag* dated **2006**; accessibility cited as **WCAG 2.1 AA**. |
| WS3 Product definition | 11 | 8 | *Zag* **2006**; Aaker's "bridge to voice" marked as our synthesis, not his framing; zeroheight tiers corrected to **Free / Starter (~\$59/editor·mo) / Enterprise** (no "\$399 Growth" tier); the two theme-schema copies flagged as **drifted out of sync**. |
| WS4 Elicitation + AI | 10 | 8 | The GV Brand Sprint's **sixth exercise is "Competitive Landscape" (a 2×2 map)**, not a wrap-up; the AI-"stops-at-tone" observation reframed as our paraphrase rather than a sourced quote. |

Verification was itself AI-performed against web sources. Treat the source index (§7) as the audit trail, and spot-check anything load-bearing before betting on it.

---

## 7. Source index

Primary and authoritative sources consulted, grouped by workstream (verbatim from each research agent; lightly de-duplicated). WS5's synthesis draws on all four.

### WS1 — Fundamentals & frameworks

- Marty Neumeier — "The Brand Gap" (https://www.martyneumeier.com/the-brand-gap)
- Marty Neumeier — "The Brand Flip" (https://www.martyneumeier.com/the-brand-flip)
- Valchanova — The Brand Gap & Zag book notes (https://valchanova.me/brand-gap-zag-book-summary/)
- How Brands Are Built — "David Aaker's Brand Vision Model and how it works" (https://howbrandsarebuilt.com/david-aakers-brand-vision-model-and-how-it-works-part-one/)
- Umbrex — "Aaker Brand Identity Model" (https://umbrex.com/resources/frameworks/marketing-frameworks/aaker-brand-identity-model/)
- Umbrex — "Keller Customer-Based Brand Equity (CBBE) Pyramid" (https://umbrex.com/resources/frameworks/marketing-frameworks/keller-customer-based-brand-equity-cbbe-pyramid/)
- Margaret Mark & Carol S. Pearson — The Hero and the Outlaw (2001) (https://www.amazon.com/Hero-Outlaw-Building-Extraordinary-Archetypes/dp/0071364153)
- How Brands Are Built — "The Brand Identity Prism and how it works" (https://howbrandsarebuilt.com/the-brand-identity-prism-and-how-it-works/)
- Mindtools — "Kapferer's Brand Identity Prism" (https://www.mindtools.com/awqj2p3/kapferers-brand-identity-prism/)
- Simon Sinek — "The Golden Circle" (https://simonsinek.com/golden-circle/)
- Umbrex — "Unilever Brand Key" (https://umbrex.com/resources/frameworks/marketing-frameworks/brand-key-unilever/)
- Toolshero — "Brand Key Model explained plus template" (https://www.toolshero.com/marketing/brand-key-model/)
- Mailchimp Content Style Guide — "Voice and Tone" (https://styleguide.mailchimp.com/voice-and-tone/)
- Indeed — "Tagline vs. Slogan: What's the Difference" (https://www.indeed.com/career-advice/career-development/tagline-vs-slogan)
- Selah Creative Co. — "Brand Strategy vs. Brand Identity: What's the Difference?" (https://selahcreativeco.com/blog/brand-strategy-vs-brand-identity-whats-the-difference)
- sitecentre — "Brand Style Guide vs. Brand Identity" (https://www.sitecentre.com.au/blog/brand-style-guide-vs-brand-identity)

### WS2 — Guideline taxonomy

- Mailchimp Content Style Guide — Voice and Tone: https://styleguide.mailchimp.com/voice-and-tone/
- Mailchimp Content Style Guide (TOC): https://styleguide.mailchimp.com/
- Shopify Polaris: https://polaris.shopify.com/ (redirects to https://polaris-react.shopify.com/)
- Twilio Paste: https://paste.twilio.design/
- Atlassian Design System — Foundations: https://atlassian.design/foundations
- IBM Carbon Design System — Spacing: https://carbondesignsystem.com/elements/spacing/overview/
- IBM Carbon Design System — Accessibility/Color: https://carbondesignsystem.com/guidelines/accessibility/color/
- Google Material Design 3 — Content design: https://m3.material.io/foundations/content-design/overview
- NASA Brand Center — Brand Guidelines: https://www.nasa.gov/nasa-brand-center/brand-guidelines/
- NASA Graphics Standards Manual (1976, NHB 1430-2): https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf
- Spotify for Developers — Design & Branding Guidelines: https://developer.spotify.com/documentation/design
- GOV.UK Style Guide: https://www.gov.uk/guidance/style-guide
- Margaret Mark & Carol S. Pearson, The Hero and the Outlaw (McGraw-Hill, 2001): https://carolspearson.com/books-page/the-hero-and-the-outlaw-building-extraordinary-brands-through-the-power-of-archetypes
- Marty Neumeier, The Brand Gap (New Riders, 2003): http://ptgmedia.pearsoncmg.com/images/0321348109/goodies/the_brand_gap.pdf
- Marty Neumeier, Zag (New Riders, 2006) — onliness statement: https://medium.com/workmatters/the-onliness-statement-differentiation-rational-and-formula-da94e2470a3d
- David A. Aaker, Building Strong Brands (Free Press, 1996): https://www.simonandschuster.com/books/Building-Strong-Brands/David-A-Aaker/9780029001516
- Simon Sinek, Start With Why (Portfolio, 2009) — The Golden Circle: https://simonsinek.com/golden-circle

### WS3 — Product definition

- Visor repo: packages/theme-engine/src/brand/types.ts, resolve.ts, pipeline.ts
- Visor repo: packages/docs/components/playgrounds/sections/brand.tsx, showcase.tsx
- Visor repo: docs/interchange-format.md, docs/ai-consumability.md, docs/visor-theme.schema.json, packages/theme-engine/src/visor-theme.schema.json
- Visor repo: packages/docs/lib/private-themes.ts, theme-config.ts
- Mailchimp Content Style Guide — Voice and Tone: https://styleguide.mailchimp.com/voice-and-tone/
- Twilio Paste — Content / Voice and tone: https://paste.twilio.design/foundations/content/voice-and-tone
- Shopify Polaris — Voice and tone: https://polaris.shopify.com/content/voice-and-tone
- Frontify — Brand Guidelines: https://www.frontify.com/en/brand-guidelines ; Pricing: https://www.frontify.com/en/pricing
- Brandpad — Pricing: https://brandpad.io/pricing ; Features: https://brandpad.io/features
- Standards — https://standards.site/
- zeroheight — https://zeroheight.com/ ; Pricing: https://zeroheight.com/pricing/
- Brandfolder — Digital Asset Management: https://brandfolder.com/product/
- David Aaker, Building Strong Brands (1996)
- Marty Neumeier, Zag (2006)
- Margaret Mark & Carol Pearson, The Hero and the Outlaw (2001)
- Simon Sinek, Start With Why (2009)

### WS4 — Elicitation + AI

- Jake Knapp, "The Three-Hour Brand Sprint: GV's Simple Recipe For Getting Started On Your Brand" — https://library.gv.com/the-three-hour-brand-sprint-3ccabf4b768a
- Marty Neumeier, "The Onlyness Test" — https://www.martyneumeier.com/the-onlyness-test
- Marty Neumeier, "The Brand Gap" — https://www.martyneumeier.com/the-brand-gap (book: Zag, 2006; The Brand Gap, 2003)
- Geoffrey Moore, Crossing the Chasm — positioning template — https://geoffreyamoore.com/positioning/ and https://the.gt/geoffrey-moore-positioning-statement/
- Margaret Mark & Carol S. Pearson, The Hero and the Outlaw (2001) — twelve archetypes — https://personality-psychology.com/guide-12-jungian-archetypes/ and https://scottjeffrey.com/12-brand-archetype-wheel/
- Alina Wheeler, Designing Brand Identity (5-phase methodology) — https://www.wiley.com/en-us/Designing+Brand+Identity and https://logogeek.uk/podcast/design-a-brand-identity-with-alina-wheeler/
- Umbrex, "Message House Framework" — https://umbrex.com/resources/frameworks/marketing-frameworks/message-house-framework/
- The Branding Journal, "The Strategic Advantage of a Messaging House for Your Brand" — https://www.thebrandingjournal.com/2025/03/the-strategic-advantage-of-a-messaging-house-for-your-brand/
- Frontify, "AI for Brand Management: Governance, Consistency & Scale" — https://www.frontify.com/en/guide/ai-for-brand-management
- DesignLab, "Top Best AI Logo Generators (2026 review)" — https://designlab.com/blog/top-best-ai-logo-generators-a-review
- ALM Corp, "12 Best AI Logo Generators in 2026" — https://almcorp.com/blog/best-ai-logo-generators/
- ebaqdesign, "Using ChatGPT For Brand Strategy & Marketing in 2026" — https://www.ebaqdesign.com/blog/chatgpt-brand-strategy
- AI for Work, "Create a Brand Strategy Document with ChatGPT" — https://www.aiforwork.co/prompt-articles/chatgpt-prompt-brand-manager-marketing-create-a-brand-strategy-document-f
- SessionLab, "Core Values" workshop library — https://www.sessionlab.com/library/core-values
- Learning Loop, "Workshop exercise: Top Brand Values" — https://learningloop.io/plays/workshop-exercise/top-brand-values
- Vision One / Branding5 / archetypes.com brand-archetype quizzes — https://visionone.co.uk/brand-archetype-quiz/ , https://www.branding5.com/archetypes , https://www.archetypesc.com/12-brand-archetypes-quiz/

