# Design handoff — test-pattern

**Pattern build:** test-pattern (admin-ui shape)
**Theme:** space
**Brief source:** Test fixture

## Recipe

- Path: [`test-recipe.md`](./test-recipe.md)
- Four screens

## Mockups

- Path: `.lo/prototypes/admin-ui/test-pattern/`

## Component inventory

| Component | Type | Min version | Status | Install command |
|---|---|---|---|---|
| button | primitive | ≥0.10 | ✓ shipped | `npx visor add button` |
| widget-stack | primitive | TBD | ⚠ NEW gap | (pending) |
| status-pill | primitive | TBD | ⚠ blocked-by VI-999 | (pending) |
| badge | primitive | ≥0.10 | ⚠ in flight | (pending) |

## Visor gaps

- **VI-999** `feat: status-pill primitive` — fixture-only
