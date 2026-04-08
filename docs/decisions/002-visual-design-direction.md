# ADR-002: Visual Design Direction

**Status:** Proposed
**Date:** 2026-04-07
**Ticket:** [VI-128](https://linear.app/low-orbit-studio/issue/VI-128/visual-design-overhaul-research-spike)

## Context

Visor's component library has a healthy 3-tier token architecture (87 semantic tokens, OKLCH-ready, 793 semantic refs across 114 files) but the visual design reads as engineering scaffolding. Before the `@loworbitstudio/visor-core` npm publish (VI-124), we need to establish a distinctive visual identity.

Six design systems were studied: Radix Themes, Mantine, Park UI, shadcn/ui v4, Primer (GitHub), and Diana Malewicz's Modern Minimal philosophy. Full research at [`docs/research/visual-design-overhaul.md`](../research/visual-design-overhaul.md).

This ADR resolves the 5 major visual direction decisions that inform all implementation work.

---

## Decision 1: Shadow vs Border for Component Definition

### Candidates

**A. Border-first (current approach)**
- Components defined by `1px solid var(--border-default)`
- Pros: Simple, predictable, no dark-mode shadow complications
- Cons: Flat, lacks depth hierarchy, every component looks the same level
- Used by: Park UI, Primer (mostly)

**B. Shadow-first with border fallback**
- Cards, alerts, toasts use `var(--shadow-*)` tokens. Borders reserved for input fields and dividers only.
- Pros: Creates elevation hierarchy, more premium feel, matches Modern Minimal philosophy
- Cons: Requires shadow tokens to be well-tuned per theme, slightly more complexity
- Used by: Radix Themes, Mantine

**C. Hybrid — shadow + subtle border**
- Combine `var(--shadow-sm)` with `1px solid var(--border-subtle)` (lighter than current `--border-default`)
- Pros: Maximum definition in both light and dark mode, graceful degradation
- Cons: More verbose CSS, subtle border may be redundant

### Decision: **B — Shadow-first with border fallback**

**Rationale:** Shadow-based depth is the single highest-impact change for perceived quality. Cards, alerts, toasts, and table surfaces should be defined by shadows, not borders. Input fields retain borders because their inline nature requires a clear boundary. This aligns with Modern Minimal's "roundness + shadow over outlines" principle.

**Implementation:** Replace `border: 1px solid var(--border-default)` with `box-shadow: var(--shadow-sm)` on card, alert, banner, toast, table. Keep borders on input, textarea, select, checkbox, radio, switch.

---

## Decision 2: Animation Intensity

### Candidates

**A. Minimal (current approach / shadcn)**
- Only structural animations (accordion expand, overlay fade)
- Pros: Fast perceived performance, no distraction, accessible by default
- Cons: Components feel static, no tactile feedback, "empty" feel

**B. Subtle and systematic**
- Hover transitions (150ms), active press feedback (translateY), entrance animations on overlays/dropdowns (200ms), skeleton shimmer
- Pros: Components feel alive without being distracting, matches Modern Minimal
- Cons: More CSS to maintain, potential performance concerns on low-end devices
- Used by: Radix Themes, Park UI

**C. Expressive**
- All of B plus: scale pop on checkbox, spring animations, staggered list entrance, gradient shifts on hover
- Pros: Premium, delightful feel, differentiating
- Cons: Risk of feeling heavy, higher performance cost, harder to maintain consistency
- Used by: Mantine

### Decision: **B — Subtle and systematic**

**Rationale:** Visor is a design system, not an app — consumers need a baseline that feels professional without being opinionated about animation personality. Subtle transitions (150–200ms) and entrance animations are table stakes. Expressive animations (springs, staggers) are better left to consumer applications.

**Implementation:**
- P0: `:hover` transitions (150ms ease), `:active` translateY(1px) on buttons
- P1: Entrance animations (fade + slide/scale) on dialog, sheet, dropdown, toast
- P2: Skeleton shimmer, progress indeterminate, checkbox/switch micro-animation
- Global: `prefers-reduced-motion` rule in tokens package

**Motion tokens already exist** (`--motion-duration-fast/normal/slow`, `--motion-easing-*`). No new tokens needed.

---

## Decision 3: Color Treatment Approach

### Candidates

**A. Color as accent (current approach)**
- Color used at 10% opacity backgrounds, border tinting only
- Pros: Safe, never overwhelming
- Cons: Destructive badges invisible, status colors don't communicate urgency, "decorative not semantic"

**B. Color as signal (Radix approach)**
- Full 12-step scale: step 2–3 for subtle backgrounds, step 9 for solid fills, step 11 for text. Each intent (destructive, success, warning, info) renders at appropriate intensity per component type.
- Pros: Colors communicate meaning clearly, accessible contrast, systematic
- Cons: Requires careful tuning per theme to avoid harshness
- Used by: Radix Themes, Park UI

**C. Color as personality (Mantine approach)**
- 8 variant system (filled, light, outline, subtle, transparent, white, default, gradient). Every component can render in any variant.
- Pros: Maximum flexibility, consumers choose intensity per instance
- Cons: Complexity explosion (8 variants × N colors × light/dark), harder to maintain

### Decision: **B — Color as signal**

**Rationale:** Visor's current 10% opacity treatment makes status colors invisible — destructive badges look like default badges. Colors should communicate meaning at a glance. The Radix-style stepped approach (subtle bg at step 2–3, solid fill at step 9, text at step 11) gives systematic control without the complexity of Mantine's 8-variant system.

**Implementation:**
- Badge: minimum step 3 bg (20–30% opacity), not step 1 (10%)
- Toast: subtle bg fill + left accent border (2–3px solid at step 9) + matching icon
- Alert: subtle bg fill at step 2 + border at step 6 + icon at step 9
- Button destructive/success variants: solid fill at step 9, not outline-only

---

## Decision 4: Density Options

### Candidates

**A. Single density (current approach / shadcn)**
- One size per component, consumers override via CSS
- Pros: Simple, less API surface, less testing
- Cons: No built-in way to make compact UIs (data tables, admin panels)

**B. Size prop (xs/sm/md/lg/xl) (Mantine approach)**
- Every component accepts a size prop with 5 options
- Pros: Flexible, covers all use cases
- Cons: 5× CSS per component, significant testing burden, API complexity

**C. Density modes via CSS custom properties (Primer approach)**
- Three density modes (spacious/normal/compact) set via data attribute on a container. All descendant components adapt automatically.
- Pros: Single API decision affects all children, no per-component size props, cleanest DX
- Cons: Requires a density token layer, less granular control

### Decision: **A — Single density, defer density modes to a future phase**

**Rationale:** Visor is pre-1.0 with zero consumers. Adding density now is premature complexity. The Primer approach (density via CSS custom properties) is the right eventual solution, but it should ship after the base visual quality is established. The token architecture already supports it — density tokens can be layered on top without breaking changes.

**Future work:** Track as a separate roadmap item for post-1.0. When implemented, follow Primer's `data-density` pattern with CSS custom properties.

---

## Decision 5: Focus Ring Implementation

### Candidates

**A. Outline only (current approach / Radix)**
- `outline: 2px solid var(--focus-ring-color); outline-offset: 2px`
- Pros: Works with `forced-colors` mode, simple, accessible
- Cons: Can be invisible against matching backgrounds

**B. Dual-ring (Primer approach)**
- `outline: 2px solid var(--focus-ring-color); outline-offset: -2px; box-shadow: 0 0 0 4px var(--focus-ring-bg)`
- Pros: Visible against any background, excellent accessibility
- Cons: More complex CSS, box-shadow may conflict with component shadows

**C. Box-shadow only**
- `box-shadow: 0 0 0 2px var(--focus-ring-color)`
- Pros: Doesn't affect layout, animatable
- Cons: **Does not work with `forced-colors` mode** — hard accessibility fail

### Decision: **A — Outline only, with improved contrast**

**Rationale:** Outline-based focus rings are the most accessible approach and align with both Radix and the W3C recommendation. The dual-ring technique (B) is superior for contrast but conflicts with Visor's elevation shadows on floating components. Option C is ruled out entirely for `forced-colors` failure.

**Implementation:** Standardize on `outline: 2px solid var(--focus-ring-color); outline-offset: 2px` for all focusable elements. Ensure `--focus-ring-color` has sufficient contrast in all themes (currently `var(--interactive-accent)`).

---

## Decision 6: Backdrop Blur on Overlays

### Candidates

**A. No backdrop blur (current approach)**
- Overlays use `var(--overlay-bg)` (semi-transparent dark)
- Pros: Simple, no performance concern
- Cons: Overlays feel disconnected from content, no depth cue

**B. Subtle blur on all overlays**
- `backdrop-filter: blur(4px)` on dialog, sheet, fullscreen-overlay, lightbox
- Pros: Creates layering effect, matches Modern Minimal's "selective depth" principle
- Cons: Performance cost on low-end devices, requires `-webkit-` prefix in some browsers

**C. Blur only on full-screen overlays, not dropdowns**
- Dialog, sheet, lightbox get blur. Dropdowns, popovers, context menus don't.
- Pros: Blur where it matters most (full-screen takeover), no performance cost on frequent open/close
- Cons: Inconsistent treatment

### Decision: **C — Blur on full-screen overlays only**

**Rationale:** Backdrop blur is most impactful on full-screen overlays where it creates genuine depth between the overlay and the page. Dropdowns and popovers open/close frequently — adding blur would create distracting flashing and unnecessary GPU compositing. The `backdrop-filter` property is well-supported (97%+ browser coverage) but still has performance implications on mobile.

**Implementation:** Add `backdrop-filter: blur(4px)` to dialog overlay, sheet overlay, fullscreen-overlay, and lightbox overlay. Use `-webkit-backdrop-filter` fallback. Do not add to dropdown, popover, context-menu, combobox, select, command, hover-card, or tooltip.

---

## Risks

1. **Shadow tuning per theme** — Shadow tokens must look good in both light and dark mode, and across all themes. Testing burden increases.
2. **Animation performance** — Even subtle animations can jank on low-end devices. The `prefers-reduced-motion` global rule is essential.
3. **Breaking changes** — Border → shadow on cards will change visual appearance for any hypothetical current consumers. Acceptable because Visor is pre-1.0 with zero external consumers.
4. **Scope creep** — The overhaul touches ~41 of 53 components. Must be batched into shippable increments (see implementation plan in research doc).

## References

- [Visual Design Overhaul Research](../research/visual-design-overhaul.md) — full research document with system analyses, comparison matrix, and implementation plan
- [Token Architecture Research (VI-122)](../research/token-architecture-spike.md) — prior research focused on token systems
- [Token Rules](../token-rules.md) — current component authoring rules
- [Component Inventory](../component-inventory.md) — current component list and categories
- [Diana Malewicz: A Guide to Modern Minimal UI](https://hype4.academy/articles/design/a-guide-to-the-modern-minimal-ui-style)
- [Radix Themes Documentation](https://www.radix-ui.com/themes/docs)
- [Mantine Documentation](https://mantine.dev/)
- [Primer Design System](https://primer.style/)
- [Park UI](https://park-ui.com/)
- [shadcn/ui v4 Changelog](https://ui.shadcn.com/docs/changelog)
