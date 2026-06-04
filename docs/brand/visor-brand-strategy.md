# Visor Brand Strategy

> Visor's own Brand Record — the public, flagship example of what the Brand Workbench compiles. This document is canonical for humans; [`visor-brand-record.yaml`](./visor-brand-record.yaml) is its structured projection, the form the engine and Workbench surfaces read. They must stay in sync; when they disagree, this document is the source of truth and the data is corrected to match.

## How to read this

A brand works as a pipeline: **strategy decides → identity expresses → guidelines enforce.** Strategy is the upstream decisions — who Visor is for, how it differs, what it stands for. Identity is the visible, audible system — the marks, the tokens, the voice in practice. Guidelines are the rules that keep it consistent so nobody re-litigates it per artifact.

Visor already ships its *visual identity* as data (the `brand` block → `--brand-*` tokens) and its *guidelines* as a live docs surface. This document fills the one layer that was missing: **strategy as data**, plus the **verbal identity**.

Everything derives downward. Positioning generates the pillars; personality generates the voice; voice flexes into tone. If a downstream choice can't be traced to something above it, that's a smell — fix the upstream, not the symptom.

## Positioning — the onliness

> **Visor is the only design system that compiles a complete brand — visual *and* verbal — from one portable file, for humans and agents alike.**

This is the spearhead (Neumeier's *onliness* test: if you can't say the difference with the word *only*, fix the company, not the sentence). Visor passes it on a specific wedge — the verb **compile**:

- Frontify and Brandpad *host* a brand; Zeroheight *documents* one. None *compiles* it from typed intent against a live engine — so their guideline and the consumer's product are different systems that drift.
- The brand Visor compiles is **visual and verbal** — not just tokens and marks, but voice and tone too. The verbal half is what this document begins; authoring it is how the claim becomes true.
- One **portable file** (`.visor.yaml`) carries it, legible to **humans and agents** alike — the same file an engineer reads and an agent queries.

The candid part: today Visor compiles the visual half cleanly, and the verbal half is being built (the Brand Workbench). The onliness states where Visor is going, and the work of getting there is visible in this repo.

## Essence

> **coherent · open · yours**

The irreducible core, internal-facing — not a tagline. Each word is also a pillar, and each traces to a stated principle in [`vision.md`](../vision.md):

| Essence | Principle | Means |
|---|---|---|
| **coherent** | "Theming is the core differentiator; one file, total transformation" | Every layer derives from the one above. Change the file, the whole system re-resolves. |
| **open** | "AI-native by design; structured, machine-readable" + "Open source & community" | The whole system is out in the open — readable by people and agents, and free to take. |
| **yours** | "Own your components; copy-and-own, no lock-in" | You hold the source. Edit anything. Nothing to eject from. |

That the essence, the pillars, and Visor's own principles are the same three ideas isn't a redundancy to paper over — it's the point. A coherent system describes itself coherently.

## Personality

Brand-as-person — the traits you'd attribute to Visor if it were someone in the room. Each is sharpened by what it is *not*, because the antonym is where a trait earns its keep.

- **precise**, not *fussy* — exact about the things that matter (a token value, a contrast ratio), relaxed about the things that don't. Precision in service of the work, never ceremony.
- **candid**, not *cold* — names tradeoffs, limits, and costs out loud, but always in service of the reader and never chilly about it. Honest *and* kind.
- **generous**, not *indulgent* — gives the reasoning, the worked example, the why; open-source by default. Generous with knowledge and access, disciplined about scope and bloat.
- **warm**, not *saccharine* — talks to you like a peer it's glad to help, with room for a little delight. Warm because it means it, not because a style guide says to smile.

Personality is the bridge to voice: precise and candid become *plainspoken*; candid stays *candid*; generous and warm become the welcoming, why-first register that runs through the docs — the Everyman warmth made audible.

## Archetype

> **Sage** (primary) · **Creator** (secondary) · **Everyman** (warmth)

From the twelve brand archetypes (Pearson & Mark). **Sage** is the seeker of truth and mastery — it values getting it *right* and helping others understand. **Creator** is the maker — it values craft, building, and giving people the tools to build for themselves. A design system is, almost literally, a Creator's tool grounded in Sage authority; that's why the pair fits without strain.

**Everyman** is the third, and it's where the warmth comes from: the archetype of belonging and *for-everyone* — unpretentious, on your side, a peer rather than a professor. It's the most honest fit for an open-source project you copy and own, and it ties straight to the essence: *open* and *yours*. Sage and Creator make Visor credible and capable; Everyman makes it *welcoming*.

The archetype isn't decoration — it's the personality key that *seeds the voice*. Sage gives Visor its plainspoken precision and its candor; Creator gives it the here's-how-it-works enthusiasm; Everyman gives it the warmth — so the voice is expert, generous, *and* glad you're here.

## Pillars

Three strategic themes — the same three as the essence, made operational. Each pillar links to the tokens, components, or surfaces it **governs**, which turns a slogan into a claim the system can check. A pillar that governs nothing is a smell a coherence check can fail, the same way token drift fails today.

### coherence — *Every layer derives from the one above it.*
*Governs:* the derivation cascade (`--primary` → semantic → adaptive tokens) and every component (they reference tokens, never hard-coded values).
*Proof:* switch theme or mode and the entire surface re-resolves. Nothing is pinned.

### openness — *The whole system is open: readable by humans and agents, and free to take.*
*Governs:* the agent manifest, component metadata (`when_to_use`), and the agent-first CLI.
*Proof:* an agent can discover, select, and compose a component from structured data alone — and the source it reads is open to anyone.

### ownership — *Copy-and-own. You hold the source; there's no lock-in, ever.*
*Governs:* every component in the registry (`components: ["*"]`).
*Proof:* `npx visor add button` copies real source into your project. You edit it freely, and tokens still update via `npm update`.

> **Schema note for VI-505:** `coherence` and `ownership` govern tokens/components; `openness` governs meta-surfaces — the manifest and CLI — which aren't tokens or components. The `governs` field will need to accept targets beyond token/component refs. Captured here as input to the schema design.

## Voice

Voice is fixed — Visor sounds the same everywhere. Four traits, each with a worked example, because a rule without an example doesn't change behavior.

| Trait | Do | Don't | Example |
|---|---|---|---|
| **plainspoken** | Say it in one clause. Lead with the answer. | Bury the point under qualifiers and throat-clearing. | "Copy-and-own is just that — the source is yours. Edit anything; there's no wrapper to fight." |
| **candid** | Name the tradeoff and the cost before the reader hits it. | Oversell, hide the sharp edges, or hedge to sound safe. | "Heads up — this theme fails WCAG AA on small text. Bump the contrast a notch, or keep the warning if that's intentional." |
| **generous** | Give the why. Show the worked example. Assume the reader will go further than you did. | Gatekeep, wave at "best practices," or make them read the source to understand. | "Fallbacks use Gray, not Slate — so an un-themed component lands on a neutral that fits your palette instead of clashing. Small thing, but it's what keeps a theme feeling whole." |
| **warm** | Greet the reader like a peer you're glad to help. A little delight is welcome. | Go cold and transactional — or paper over it with forced cheer. | "Welcome — let's get your first theme on the screen. It takes about a minute." |

## Tone by context

Tone is voice *flexed* for the reader's situation — the verbal analog of Visor's light/dark mode switching. It's keyed to real UI states the design system actually renders, so tone is the product's *actual* error message, not a table in a PDF.

| Context | Feeling | Example |
|---|---|---|
| **error** | warm, accountable, already holding the fix | "That didn't save — looks like the theme name's taken. Pick another and we'll keep everything else just as you left it." |
| **success** | a real, small celebration — a little confetti is fine | "Saved! Your theme's live across every component — go take a look." |
| **empty** | inviting, a friendly nudge to start | "Nothing here yet — let's change that. Start from a blank file, or clone one and make it yours." |
| **loading** | unhurried and friendly, honest about the wait | "Compiling your tokens — just a moment…" |
| **validation-warning** | a friend flagging a smell, never a scold | "Quick one — your primary and accent are nearly twins. Themes can read a little flat this close, so nudge one if it's not on purpose." |

The last one is Visor's own: theme validation surfaces non-blocking warnings (e.g. overly-similar primary/accent), and the tone there is a friend's nudge, never a scold.

## Lexicon

The words Visor uses, and the ones it avoids. Small choices, but they're where voice becomes habit.

| Use | Avoid | Why |
|---|---|---|
| theme | skin, template | A theme is a complete design system, not a surface coat. |
| copy-and-own | fork, eject | You own the source from the start; there's nothing to break away from. |
| compose | drag-and-drop | Visor is composed in code, not assembled on a canvas. |
| token | variable | A token is design intent; "variable" is only its mechanism. |
| adapter | plugin | Adapters translate one format for many consumers; they don't bolt on. |
| transform | restyle, reskin | One file changes the whole system, not just its surface. |
| portable | exportable | The file *is* the format; it moves as-is, nothing to export. |

## The Brand Record (structured form)

This document is canonical for humans. Its machine form is [`visor-brand-record.yaml`](./visor-brand-record.yaml) — the structured `brand-strategy` block an agent reads, and (soon) the Workbench surfaces render. Today it's a docs fixture. **VI-505** formalizes `brand-strategy` as a validated top-level block in `.visor.yaml` (sibling to `brand`), at which point this content becomes that block — checked by the schema and gated against the live system the way token drift is gated today.
