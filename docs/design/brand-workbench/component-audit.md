# Brand Workbench — Component Audit & Reuse-vs-Create Gap List

> First artifact of the build epic (VI-548), per `BUILD-HANDOFF.md`. Maps every UI element in the
> approved HiFi prototypes (`elicit-core.html`, `journey.html`) against the existing component
> library (`packages/docs/components/ui/`, source at `components/ui/`) and assigns each a verdict:
> **reuse** (compose from what exists), **extend** (CVA/state addition to an existing primitive),
> or **create** (net-new component, its own VI ticket).

## Method

Two passes, cross-referenced:

1. **Library inventory** — every component in `packages/docs/components/ui/` (all are thin proxies
   re-exporting `components/ui/<name>/`), with API/variant surfaces read from source.
2. **Prototype extraction** — region-by-region element inventory of both prototypes, classifying
   each element as a plain composition of generic primitives vs. genuinely novel structure.

The library is substantially richer than the handoff's expected list (~90 components vs. the 37
named). Notable existing components that change the gap math: `Timeline`, `Stepper` (vertical,
`complete`/`active`/`upcoming`), `ScoreIndicator` (SVG ring with tones + denominator modes),
`StatusBadge` (20 mapped statuses, pulse dot), `ToggleGroup`, `TagInput`, `CodeBlock`,
`SectionHeader`, `Skeleton`, `Sparkline`, `FileUpload`, and the layout primitives
(`Box`/`Stack`/`Inline`/`Grid`/`Container`).

## Verdict summary

| Handoff candidate | Verdict | Resolution | Ticket |
|---|---|---|---|
| DerivationSpine | **extend + compose** | `Stepper` gains a `locked` status; spine = per-section vertical Steppers + eyebrow counts (`Badge`) + progress card (`Card`+`Progress`) | VI-550 |
| ProgressMeter (segmented) | **create** | `Progress` is a single continuous Radix indicator — a discrete per-segment meter is structurally different | VI-551 |
| — (discovered) Spinner | **create** | No spinner primitive exists; prototypes hand-roll CSS spinners in 3+ places (`.tw`, `.spin`) | VI-552 |
| StructuredPrompt / SlotInput | **create** | Inline mad-lib slots in flowing prose — no primitive composes to this | VI-553 |
| ChallengeCard | **create** | First-class adversarial message + human-gate affordance; assess sharing internals with `Alert` during build | VI-554 |
| Composer | **create** | No composer-like input exists (`Input`/`Textarea` have no action slots; `TagInput` is the closest structural precedent) | VI-555 |
| TonePreview + Speaking wrapper | **create (one component)** | `SpecimenCard`: context label + feel + live component children + optional voice-key footer covers both `.tonecard` and `.speak` framing | VI-556 |
| CoherenceCheck | **create** | `CheckGroup` + `CheckRow` (pass/warn/fail + fix action) | VI-557 |
| ScoreRing | **reuse** | `ScoreIndicator` already is a tokenized SVG ring (sizes sm/md/lg, tones, denominator modes) | — |
| CanvasBoard / BrandBlock | **create (block only)** | `EditableBlock` tile; the board itself is a `Grid` composition | VI-558 |
| ConversationThread / ChatMessage | **reuse (composition)** | Assistant turn = `Avatar` + `Text`; user bubble = styled module class; thread = `ScrollArea` + `Stack`. App-level; promote to a component only if reused beyond the Workbench | — |
| KeyStateChip (BYOK/model status) | **reuse (composition)** | `Chip` + `StatusDot` (or `StatusBadge` where a mapped status fits), passed into the Composer's chip slot | — |

**Net result: 1 extension + 8 net-new components.** Everything else on both prototypes composes
from existing primitives.

## Reuse map (prototype element → existing component)

### Shell & spine

| Prototype element | Covered by |
|---|---|
| Top bar (`.bar`, `.brand`, `.pill`, `.btn`) | `Navbar` (+ `NavbarBrand`/`NavbarContent`), `Badge`, `Button` |
| Global progress line (`.gprog`) | `Progress` (`size="thin"`) |
| Spine progress card (`.sprog`) | `Card` + `Progress` (thin) + `Text` + `Badge` |
| Section eyebrows + counts (`.eyebrow`, `.cnt`) | `Text` + `Badge` (count pill flips to success treatment when done) |
| Node chain (`.chain`, `.node`, `.rail`, `.bullet`) | `Stepper` (vertical) — **after VI-550 adds `locked`** |
| Guided/Canvas mode toggle (`.modecard`, `.seg`) | `Card` + `ToggleGroup` + `Text` |

### Conversation

| Prototype element | Covered by |
|---|---|
| Breadcrumb + step counter (`.crumb`, `.stepn`) | `Breadcrumb` + `Text` |
| Segmented step meter (`.pseg`) | **VI-551 `SegmentedProgress`** |
| ETA row (`.eta`) | `Text` + Phosphor icon |
| Assistant turn (`.turn`, `.av`, `.txt`) | `Avatar` + `Text` composition |
| User bubble (`.uturn`, `.ub`) | Styled composition (asymmetric-radius module class on tokens) |
| Mad-lib tool (`.tool`, `.slot`) | **VI-553 `StructuredPrompt`** |
| Challenge card (`.challenge`, `.gate`) | **VI-554 `ChallengeCard`** |
| Set-confirmation row (`.setrow`, `.setchip`) | `Separator` ×2 + `Badge` (success) |
| Suggestion chips (`.schip`, `.schip.spark`) | `Chip` (spark = accent treatment; verify `ChoiceChip`/`FilterChip` variants suffice during build) |
| Composer box (`.cbox`) | **VI-555 `Composer`** |
| Model/key chip (`.modelchip`, `.kdot`) | `Chip` + `StatusDot` |
| Privacy meta line | `Text` + icon |

### Canvas (live brand system)

| Prototype element | Covered by |
|---|---|
| Canvas header + theme chip + mode toggle (`.khead`, `.tchip`, `.modetoggle`) | `Text`, `Chip`, `ToggleGroup` |
| Section dividers w/ status (`.sect`, `.st`) | `SectionHeader` or `Text` + `Separator` + `StatusDot` composition |
| Brand record card (`.recCard`, `.tag`) | `Card` + `Text` + `Chip` |
| Essence chips (`.echip`, `.echip.ghost`) | `Chip`/`Badge` + **VI-552 `Spinner`** for the deriving ghost |
| Personality trait grid (`.traits`) | `Grid` of small `Card`s |
| Pillar cards incl. deriving state (`.pill-card`) | `Card` + `Badge` (mono token chips) + `Spinner` |
| Speaking block (`.speak`) | **VI-556 `SpecimenCard`** wrapping real `Button`/`Alert`/`EmptyState`/`Skeleton`+`Spinner` |

### Journey stages

| Prototype element | Covered by |
|---|---|
| Start: path cards w/ recommended ring (`.pathcard.reco`) | `Card` + `Badge` + focus-ring-token treatment |
| Start: URL input, visibility toggle, drop zone, CTA | `Input` (leading icon), `ToggleGroup`, `FileUpload`, `Button` (`size="lg"`) |
| Verbal: tone-by-context specimens (`.tonecard`, `.tlab`) | **VI-556 `SpecimenCard`** |
| Verbal: loading specimen (`.cmp-load`, `.sk`) | `Skeleton` + **VI-552 `Spinner`** |
| Visual: ramps, swatches, type specimen, marks, don'ts | `ColorSwatch`/`ColorSwatchGrid`, `ColorBar`, `Card`/`Grid` compositions |
| Prove: score bar (`.scorebar`, `.ring`, `.counts`) | `ScoreIndicator` (lg) + `Text` + `StatusDot` counts |
| Prove: check rows (`.checkgrp`, `.check`, `.fix`) | **VI-557 `CoherenceCheck`** |
| Export: code card (`.codecard`) | `CodeBlock` (`title` = filename bar, copy button) |
| Export: output cards, publish pills | `Card` compositions; `ChoiceChip`-style selection |
| Canvas: board + blocks (`.board`, `.block`) | `Grid` + **VI-558 `EditableBlock`** |
| Canvas banner (`.canvas-banner`) | `Badge`/`Chip` |

## Extension detail — VI-550 Stepper `locked`

`components/ui/stepper/stepper.tsx` supports `horizontal`/`vertical` orientation and
`complete`/`active`/`upcoming` statuses (derived from `activeStep`, overridable per item). Missing
for the spine: a `locked` status — lock glyph in the bullet, muted label, non-interactive trigger
(`aria-disabled`). Grouping is deliberately **not** added to Stepper: the prototype's per-section
chains map to one vertical Stepper per section group under an eyebrow header, which the rail's
last-child termination already supports.

## Creation details (see each ticket for full scope)

- **VI-551 `SegmentedProgress`** — N segments, per-segment `done`/`current`/`pending`. A fork of
  `Progress`'s single Radix indicator doesn't map to discrete segments; separate component is cleaner.
- **VI-552 `Spinner`** — sizes `xs|sm|md`, motion tokens, `prefers-reduced-motion`. Smallest ticket;
  unblocks ghost chips, deriving cards, and loading specimens.
- **VI-553 `StructuredPrompt`** — header (icon + eyebrow), tall-line-height prose body, inline
  `Slot` chips (filled/empty), hint footer. Static display states first; editing wired in the AI phase.
- **VI-554 `ChallengeCard`** — amber message framing, two-action row, gate affordance. Build-time
  decision: share `Alert` internals vs. standalone (document in component README).
- **VI-555 `Composer`** — container with field row + tools row (icon buttons, status-chip slot,
  circular send). Suggestion chips and meta line stay app-level.
- **VI-556 `SpecimenCard`** — context label + feel descriptor + arbitrary live children + optional
  footer slot. One component covers both the tone grid and the Speaking block.
- **VI-557 `CoherenceCheck`** — `CheckGroup` + `CheckRow` (3-state icon, body w/ inline `code`,
  right-aligned ghost fix action). Prove-stage; not on the core-screen critical path.
- **VI-558 `EditableBlock`** — uppercase header + done check, value body, hover edit icon, editing
  state with inline input/save and AI-action slot. Canvas-stage; not on the core-screen critical path.

## Where the Workbench lives

**`packages/docs/app/brand-workbench/`** — a new route in the docs app, decided per
`/lo-architect-nextjs`. The `app/create` theme-creation tool is the direct precedent: a client-heavy
authoring surface as a feature-based route (own `components/`, `hooks/`, `__tests__/`, CSS module).
The docs app already provides theme-engine wiring, theme switching, private-theme overlay stubs,
component proxies, fonts, and CI gates; a dedicated package would duplicate all of it. Local-first
BYOK means no server/data layer, so there is no deployment reason to split. Not
`playgrounds/sections/*` — those are the output/preview layer; the Workbench is the authoring
front-end.

## Core-screen critical path (VI-559)

Static core Elicit screen needs, in rough build order: VI-552 Spinner → VI-550 Stepper `locked` →
VI-551 SegmentedProgress → VI-556 SpecimenCard → VI-553 StructuredPrompt → VI-554 ChallengeCard →
VI-555 Composer. VI-557 and VI-558 land with the journey/canvas stages.
