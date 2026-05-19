# Pattern: Test Pattern

## Required Visor components

| Component | Type | Min version | Status | Install command |
|---|---|---|---|---|
| button | primitive | ≥0.10 | ✓ shipped | `npx visor add button` |

## Inputs from generation skill

| Field | Type | Description |
|---|---|---|
| `items` | `{ id: string, label: string }[]` | List rows |
| `currentUser` | `{ id: string, role: string }` | Role gating |
| `pageTitle` | `string` | Defaults to "Test" |

## Screens (composition surface)

### Screen 1: List view (`/test/list`)

Sample.

### Screen 2: Detail view (`/test/:id`)

Sample.
