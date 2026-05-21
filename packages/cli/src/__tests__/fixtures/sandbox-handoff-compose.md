# Design handoff — compose-pattern

**Pattern build:** compose-pattern (admin-ui shape)
**Theme:** space
**Brief source:** Test fixture for VI-444 compose-recipe reclassification

## Recipe

- Path: [`test-recipe.md`](./test-recipe.md)
- Two screens

## Mockups

- Path: `.lo/prototypes/admin-ui/compose-pattern/`

## Component inventory

| Component | Type | Min version | Status | Install command |
|---|---|---|---|---|
| button | primitive | ≥0.10 | ✓ shipped | `npx visor add button` |
| badge | primitive | ≥0.10 | ✓ shipped | `npx visor add badge` |
| role-cell | primitive | ≥0.10 | ✓ shipped | `npx visor add role-cell` |
| invite-status-chip | primitive | ≥0.10 | ✓ shipped | `npx visor add invite-status-chip` |
| widget-stack | primitive | TBD | ⚠ NEW gap | (pending) |
| status-pill | primitive | TBD | ⚠ blocked-by VI-999 | (pending) |

## Visor gaps

- **VI-999** `feat: status-pill primitive` — fixture-only
