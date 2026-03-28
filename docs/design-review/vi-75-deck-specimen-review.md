# VI-75: Design System Deck Visual Review

## Diagnosis

The Design System Specimen and Design System Deck serve fundamentally different purposes, but the current Deck implementation treats them as the same thing — a compressed specimen. This is the root of the layout tension.

**Specimen = Reference Document.** Scrollable, exhaustive, full-width. Shows every token, every state, every variant. The audience is a developer looking up a specific value. It works well because it has no height constraint.

**Deck = Curated Presentation.** Slide-based, editorial, viewport-constrained. Shows representative examples with narrative context. The audience is a stakeholder, new team member, or design review participant. It fails when it tries to show everything.

The reference decks (Low Orbit Playbook, Veronica) never attempt to compress the full token inventory into slides. They use **slide-specific curated data** with editorial descriptions, and purpose-built layout patterns designed for the viewport constraint.

### Evidence

| Slide | Visor (Current) | Reference Deck Approach |
|-------|-----------------|------------------------|
| Color | 6 primitive scales (65+ swatches) + 3 semantic categories on 1 slide | 2 slides: primary scale (~10 swatches) + accents/neutrals (~12 swatches) |
| Typography | All 8 type steps on 1 slide | 2 slides: display scale (4 steps) + body scale (4 steps) |
| Forms | 8 component types × 3 states = 24 specimens on 1 slide | Not included — components shown as curated showcase, not exhaustive catalog |
| Motion | Duration + easing on 1 slide | Full slide with animated demo, easing curve visualization, stagger systems |

The current deck tries to be a "specimen but smaller." The reference decks are a different artifact entirely — a **design narrative** that selectively reveals the system.

---

## Answers to Ticket Questions

### 1. Should the Deck slides show condensed/summary specimens (not the full specimen block)?

**Yes, absolutely.** But "condensed" is the wrong framing — the slides should show **curated** content, not compressed content. The difference:

- **Compressed:** Same 65 color swatches but smaller → illegible, overwhelming
- **Curated:** 10-12 representative swatches that tell the color story → clear, impactful

Each slide should answer one question: "What is the design intent behind this token category?" The specimen answers a different question: "What are all the available values?"

### 2. Should each slide focus on one token category with carefully sized content?

**Yes.** One concept per slide. Where the current deck has 1 color slide, it should have 2-3. Where it has 1 typography slide, it should have 2. The reference decks follow this rule consistently:

**Recommended slide count by category:**

| Category | Current | Recommended | Why |
|----------|---------|-------------|-----|
| Color | 1 | 2-3 | Primary scale + accent/semantic split |
| Typography | 1 | 2 | Display scale + body/utility scale |
| Spacing | 1 | 1 | Scale visualization fits one slide |
| Elevation | 1 | 1 | 4-5 shadow levels + surfaces fits |
| Radius | 1 | 1 | Simple scale, fits easily |
| Motion | 1 | 1 | Duration + easing with animated demo |
| Opacity | 1 | 1 | Light/dark layers fit one slide |
| Icons | 1 | 1 | Grid + size scale fits |
| Accessibility | 1 | 1 | Contrast pairs fit |
| Buttons | 1 | 1 | Variants + sizes (drop exhaustive states) |
| Forms | 1 | 0 | Remove — showcase a few in Components slide |
| Components | 1 | 1 | Curated showcase of 3-4 components |
| Title | 0 | 1 | Opening slide with deck identity |
| Closing | 0 | 1 | Closing slide |

**Total: 12 slides → 15-17 slides.** More slides, less content per slide = better presentation.

### 3. Is the current slide component height/aspect ratio wrong for this use case?

**No — the slide dimensions are fine.** The `min-height: 100%; padding: 5vh 8vw` approach matches both reference decks. The problem is not the container; it's the content volume being pushed into it.

The slide component should stay as-is. The fix is on the content side.

### 4. Should the Specimen block and Deck slides use different specimen components (summary vs detailed)?

**Yes — the Deck needs its own presentation components.** The current approach of importing `ColorSwatchGrid`, `TypeSpecimen`, `SpacingScale`, etc. from the specimen block creates a tight coupling that prevents slides from being properly curated.

**Recommended component architecture:**

| Layer | Purpose | Example |
|-------|---------|---------|
| **Shared UI primitives** | Low-level display components | `ColorSwatch`, `TypeRow`, `ElevationCard` — these are fine to share |
| **Specimen compositions** | Full exhaustive sections | `ColorPaletteSection`, `TypographySection` — specimen-only |
| **Slide compositions** | Curated slide layouts | New: `ColorStorySlide`, `TypeDisplaySlide` — deck-only |

The key change: **slides define their own data inline or in slide-specific data files**, not by importing from `specimen-data.ts`. The slide for "Primary Color Scale" would define its own curated array of 10 swatches with editorial descriptions, not import `COLOR_SCALES` with 65+ entries.

### 5. What does a world-class design system presentation deck look like?

Based on analysis of the Low Orbit and Veronica reference decks, a world-class design system deck:

1. **Tells a story, not a catalog.** Each slide has a subtitle (category), title (concept), and description (editorial context). The description explains *why* this matters, not just *what* it is.

2. **Shows one idea per slide.** "Tide Scale" is a slide. "Accents & Neutrals" is a separate slide. Never "All Colors."

3. **Uses curated, representative data.** Show 10 colors that demonstrate the full range, not 65 that demonstrate completeness.

4. **Includes title and closing slides.** Frames the presentation with identity and next steps.

5. **Adds stagger animations.** Elements reveal sequentially with `fade-in delay-{n}` classes, creating a cohesive narrative flow.

6. **Includes narrative-only slides.** Theme Map, Voice & Tone, Responsive — conceptual slides that have no specimens at all, just explanation.

7. **Prioritizes legibility over density.** Large type samples at actual size. Color swatches large enough to evaluate. Spacing bars with clear labels.

---

## Recommended Slide Structure

### New Registry (17 slides)

```
_title (1 slide):
  Title — "Visor Design System"

Foundation (7 slides):
  Color — Primary Scale (Gray palette + semantic mapping)
  Color — Accent Palette (Blue, Green, Amber, Red, Sky highlights)
  Color — Semantic Tokens (Text, Surface, Border categories)
  Typography — Display Scale (4xl → lg, 4 steps)
  Typography — Body & Utility (md → xs, 4 steps)
  Opacity — Text opacity layers (light + dark)
  Theme Architecture — How tokens adapt across themes

Visual Language (4 slides):
  Elevation & Surfaces (shadows + surface tokens)
  Border Radius (scale visualization)
  Motion (duration + easing with animated demos)
  Icons (grid + size scale)

Utility (1 slide):
  Accessibility (contrast pairs, WCAG badges)

Components (3 slides):
  Buttons (variants + sizes, no exhaustive state grid)
  Form Controls (representative selection: Input, Select, Switch, Checkbox)
  Component Showcase (Card, Badge, Alert, Tabs — curated)

_closing (1 slide):
  Closing — Next steps, links
```

### Data Strategy

Each slide defines its own curated data, either inline or in a `slides/data.ts` file. Examples:

**Color — Primary Scale** shows ~10 gray swatches (50, 100, 200, 300, 400, 500, 600, 700, 800, 900) plus a "Semantic Mapping" callout showing how primitives map to `--text-primary`, `--surface-card`, etc.

**Typography — Display Scale** shows 4 type specimens at large size with sample text that demonstrates the typeface character, plus metadata (weight, tracking, line-height).

**Form Controls** shows one instance each of Input, Select, Switch, and Checkbox in default state only — not the full state matrix.

---

## Wireframes

### Color — Primary Scale Slide

```
┌─────────────────────────────────────────────────────┐
│  FOUNDATION                                          │
│                                                      │
│  Gray Scale                                          │
│  The neutral backbone of the system. Every            │
│  surface, text color, and border derives from         │
│  this scale.                                         │
│                                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 50  │ │ 100 │ │ 200 │ │ 300 │ │ 400 │           │
│  │     │ │     │ │     │ │     │ │     │           │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 500 │ │ 600 │ │ 700 │ │ 800 │ │ 900 │           │
│  │     │ │     │ │     │ │     │ │     │           │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                      │
│  Semantic Mapping                                    │
│  ┌──────────────┬──────────────┬──────────────┐      │
│  │ --text-primary│ --surface-bg │ --border-def │     │
│  │ Gray 900      │ Gray 50      │ Gray 200     │     │
│  └──────────────┴──────────────┴──────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Content budget:** ~10 swatches (90px tall, auto-fill grid) + 3-4 semantic mapping callouts. Fits viewport with room to breathe.

### Typography — Display Scale Slide

```
┌─────────────────────────────────────────────────────┐
│  FOUNDATION                                          │
│                                                      │
│  Display Scale                                       │
│  Large-format type for headings and hero text.       │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │ Heading 4xl                                  │     │
│  │ The quick brown fox                          │     │
│  │ 36px · 700 · 1.1                             │     │
│  ├─────────────────────────────────────────────┤     │
│  │ Heading 3xl                                  │     │
│  │ The quick brown fox jumps                    │     │
│  │ 30px · 700 · 1.15                            │     │
│  ├─────────────────────────────────────────────┤     │
│  │ Heading 2xl                                  │     │
│  │ The quick brown fox jumps over               │     │
│  │ 24px · 600 · 1.2                             │     │
│  ├─────────────────────────────────────────────┤     │
│  │ Heading xl                                   │     │
│  │ The quick brown fox jumps over the lazy dog  │     │
│  │ 20px · 600 · 1.25                            │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Content budget:** 4 type specimens, each showing label + sample at actual rendered size + metadata. Generous vertical spacing between rows.

### Form Controls Slide (Curated)

```
┌─────────────────────────────────────────────────────┐
│  COMPONENTS                                          │
│                                                      │
│  Form Controls                                       │
│  Core input components in their default state.       │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ Text Input            │  │ Select               │  │
│  │ ┌──────────────────┐  │  │ ┌──────────────────┐ │  │
│  │ │ Enter text...     │  │  │ │ Choose...      ▾ │ │  │
│  │ └──────────────────┘  │  │ └──────────────────┘ │  │
│  └──────────────────────┘  └──────────────────────┘  │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ Checkbox              │  │ Switch               │  │
│  │ ☐ Unchecked           │  │ ○─── Off             │  │
│  │ ☑ Checked             │  │ ───● On              │  │
│  └──────────────────────┘  └──────────────────────┘  │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ Radio Group           │  │ Toggle Group         │  │
│  │ ◉ Option A            │  │ [Left][Center][Right]│  │
│  │ ○ Option B            │  │                      │  │
│  └──────────────────────┘  └──────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Content budget:** 6 form components, default state only. 2-column grid with generous padding. No state matrix — states belong in the specimen reference.

---

## Implementation Guidance

When this recommendation is approved, the implementation work would involve:

1. **Create slide-specific data file** (`blocks/design-system-deck/slides/slide-data.ts`) with curated subsets
2. **Split color into 2-3 slides** with editorial descriptions
3. **Split typography into 2 slides** (display + body)
4. **Add Title and Closing slides** to frame the presentation
5. **Add Theme Architecture slide** (narrative-only, no specimens)
6. **Simplify Form Controls slide** to curated defaults only
7. **Update registry** to reflect the new 17-slide structure
8. **Keep shared UI primitives** (`ColorSwatch`, `TypeRow`, etc.) — only decouple the data and composition layers

The Specimen block requires no changes. It works correctly for its purpose.

---

## Decision Summary

| Question | Decision |
|----------|----------|
| Are Specimen and Deck different things? | **Yes.** Reference doc vs. curated presentation. |
| Should slides show condensed specimens? | **No — curated, not condensed.** Different data, not smaller UI. |
| Is the slide height wrong? | **No.** Container is fine; content volume is the problem. |
| Need different components? | **Partially.** Share primitives, but slides need their own compositions and data. |
| What does world-class look like? | One concept per slide, editorial voice, stagger animations, narrative flow. |
