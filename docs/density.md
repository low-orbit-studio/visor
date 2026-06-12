# Density

> Visor components carry a **density axis**: `compact | default | editorial`. Density is *treatment* — sizing, type ramp, and tonal weight — baked into each component's own CSS. Features (props, variants, slots) are orthogonal and never move onto the density axis.

## Switching density

Set `data-density` once on any ancestor — typically the app root:

```tsx
<html lang="en" data-density="editorial">
```

Component CSS keys off the global ancestor with a local class (the CSS Modules pure-selector rule requires the pairing):

```css
/* canonical default — what every consumer gets with no attribute */
.sizeSm {
  height: 2.25rem;
}

/* editorial treatment — opt-in via any ancestor's data-density */
:global([data-density="editorial"]) .sizeSm {
  height: 33.5px;
}
```

`default` is the absence of the attribute. The substrate stays neutral: editorial is always opt-in, never the default.

## Per-instance density

Components whose density is genuinely per-instance (e.g. `DataTable`) expose a `density` prop, which stamps `data-density` on the component's own root. `DataTable`'s density rules are anchored to that root attribute, so its density is chosen per instance — pass `density="editorial"` explicitly. Ancestor-keyed editorial rules in other components (including the plain `Table` that `DataTable` composes) respond to either the app-root attribute or an enclosing `DataTable`'s attribute, so the two mechanisms compose.

## What belongs on the density axis

| Density (treatment) | Feature (props/variants) |
|---|---|
| Control heights, type sizes, letter-spacing, tonal fills, cell padding, modal metrics | `variant="borderless"`, `iconOnly`, `trailingIcon`, `DialogFooter`, `tabs` line variant, slots |

If a value changes *how big / how dense / how tonal* a component renders, it is density. If it changes *what the component is or shows*, it is a feature.

## Theme-role interplay

Editorial rules keep reading consumer-scoped roles (`--field-control-bg`, `--dt-*`, `--hairline*`, `--surface-elev`) so palettes and scoped consumer overrides keep working — the editorial value is the *fallback*, not a hard override:

```css
:global([data-density="editorial"]) .trigger {
  background-color: var(--field-control-bg, var(--surface-card));
}
```

A theme (or a scoped wrapper like an in-dialog form) that sets the role still wins; with nothing set, the editorial default applies.

The exception is the theme's interactive control tokens (`--interactive-secondary-bg`, `--interactive-ghost-bg`): under editorial, control surfaces belong to the design language (secondary on the card tier, ghost transparent), so the editorial rules write those values directly and deliberately bypass the theme tokens — exactly as the retired overlay out-cascaded the palette. Default density keeps reading the theme tokens unchanged.

## History

The editorial values originated in the admin-ui design prototype's external token overlay (`design-prototypes/admin-ui/tokens.css` in the playbook). That overlay proved the values against blessed pixel baselines, then was retired in favor of this axis — see `docs/admin-editorial-reconcile-plan.md`.
