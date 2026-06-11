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
*Proof points:*
- Switch theme or mode and the entire surface re-resolves — nothing is pinned to a hard-coded value.
- Every component reads tokens, never literals: `--primary` flows to semantic, then adaptive, then the rendered pixel.
- Change one `.visor.yaml` file and the whole system follows — the file is the single source the cascade derives from.

### openness — *The whole system is open: readable by humans and agents, and free to take.*
*Governs:* the agent manifest, component metadata (`when_to_use`), and the agent-first CLI.
*Proof points:*
- An agent can discover, select, and compose a component from structured data alone — the manifest, `when_to_use` metadata, and an agent-first CLI.
- The source is open and free to take; the same file an engineer reads is the one an agent queries.
- Even brand strategy ships as readable data — this record — not a locked PDF.

### ownership — *Copy-and-own. You hold the source; there's no lock-in, ever.*
*Governs:* every component in the registry (`components: ["*"]`).
*Proof points:*
- `npx visor add button` copies real source into your project — yours to edit, with nothing to eject from.
- Tokens still update via `npm update`, so you keep design consistency without surrendering control.
- Copy-and-own is the starting state, not an escape hatch — there's no wrapper to fight.

> **Schema note for VI-505:** `coherence` and `ownership` govern tokens/components; `openness` governs meta-surfaces — the manifest and CLI — which aren't tokens or components. The `governs` field will need to accept targets beyond token/component refs. Captured here as input to the schema design.

## Messaging house

The message house organizes *what Visor says*: one **roof** (the umbrella message), the three **pillars** beneath it, and a **foundation** of proof points under each pillar — the reasons-to-believe (RTBs) that turn a claim into evidence.

> **Roof — *Design intent as data — all the way up to brand.***

The roof is Visor's existing thesis carried one layer higher. Visor already treats *design intent as data* at the token level — a color, a spacing step, a motion curve are typed values, not hand-tuned CSS. The roof says that idea doesn't stop at tokens: it runs all the way up to the brand itself — positioning, voice, and tone, compiled from the same kind of file. The three pillars hold the roof up: **coherence** (it all derives), **openness** (it's all readable), **ownership** (it's all yours). The proof points are listed under each pillar above; together they are the message-house foundation.

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

## Taglines & boilerplate

The **tagline** is the permanent, brand-level signature line — *who Visor is*, not what it's selling this quarter (the tagline-vs-slogan line; a slogan is tactical and rotates, a tagline endures). Essence stays internal; the tagline is the essence made sayable out loud.

> **Your entire brand system, created and encoded in one file.**

It names the thing only Visor does: your brand isn't *described* in a file — it's **created and encoded** in one. The portable `.visor.yaml` doesn't carry a theme or a token set; it carries the entire brand system, visual and verbal, in a single file you own.

**Boilerplate** is the reusable "about us" copy — the same description, written once, used everywhere (a footer, a README, a press line).

- **Short.** Visor is an open design system that compiles a complete brand — visual and verbal — from one portable file, legible to humans and agents alike. Components are yours to copy and own; shared tokens keep every layer coherent.
- **Long.** Visor is Low Orbit Studio's open design system, built on one idea: design intent should live as data — typed, portable, and machine-readable — from a single color token all the way up to a brand's voice. Components are copy-and-own, so `npx visor add` drops real source into your project for you to edit, while shared tokens keep design consistent across every app through `npm update`. A theme is a complete design system carried in one `.visor.yaml` file; change the file and the whole surface re-resolves, light to dark, one brand to another. And because that same file reads cleanly to people and agents alike, Visor is as legible to the engineer editing it as to the agent composing against it — coherent, open, and yours.

## Color usage & accessibility

This is brand *intent*, not computed output: the rules for how Visor's colors pair, and the contrast bar every theme is held to. The live, per-theme contrast numbers are computed against the running tokens elsewhere; here we state the targets the brand commits to.

**Color usage** — the allowed pairings, expressed as rules over the semantic tokens rather than fixed hex:

| Use | With | Rule |
|---|---|---|
| `--primary` | `--surface-card` / `--surface-base` | Primary is the one emphatic action per view — reserve it for the single most important action and let everything else recede to surfaces and text tokens. |
| `--accent` | `--primary` | Accent is a supporting highlight, never a second primary. Keep accent and primary visibly distinct — Visor flags them when they're near-twins, because a theme reads flat when they sit too close. |
| `--text-primary` / `--text-secondary` | `--surface-card` / `--surface-base` | Text always uses the semantic text tokens against a surface token, never raw hex, so contrast tracks the active theme instead of being pinned. |
| `--destructive` | `--surface-card` | Destructive is reserved for irreversible or error states; it is never a decorative or emphasis color. |
| fallback neutral (Gray) | any un-themed surface | Fallbacks use Gray, not Slate, so an un-themed component lands on a neutral that fits the palette instead of clashing. |

**Accessibility** — the standard is **WCAG 2.1 AA** (the specific version, not a bare "WCAG-AA"). The contrast targets:

| Context | Minimum ratio |
|---|---|
| Body text and other normal-size text | 4.5:1 |
| Large text (≥ 24px, or ≥ 18.66px bold) | 3:1 |
| Non-text UI — icons, focus rings, control boundaries | 3:1 |

Every stock Visor theme is meant to clear these targets. The theme validator surfaces pairings that fall short as a candid, non-blocking warning — *"this theme fails AA on small text"* — so the author can bump the contrast or keep the warning if it's intentional. That's the **candid** voice and the **validation-warning** tone doing real work: accessibility is enforced as a friendly nudge, not a silent failure.

## The Brand Record (structured form)

This document is canonical for humans. Its machine form is [`visor-brand-record.yaml`](./visor-brand-record.yaml) — the structured `brand-strategy` block an agent reads, and (soon) the Workbench surfaces render. Today it's a docs fixture. **VI-505** formalizes `brand-strategy` as a validated top-level block in `.visor.yaml` (sibling to `brand`), at which point this content becomes that block — checked by the schema and gated against the live system the way token drift is gated today.
