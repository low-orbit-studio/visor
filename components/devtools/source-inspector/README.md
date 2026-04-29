# SourceInspector

Borealis pre-flight x-ray overlay for Visor consumers.

## Mental model

Borealis substrate adherence — "did I use Visor primitives?" — used to be policed by manual code reads. SourceInspector flips it into an instrument: turn it on, see at a glance which regions of the running app come from Visor and which come from the host's local components. Any red region is either a deliberate exception or a candidate for a `VI-` ticket.

## Mount

`SourceInspector` walks the React Fiber tree post-render, reads `_debugSource.fileName` from each fiber, and stamps the corresponding DOM element with `data-source="visor" | "local" | "third-party" | "dom"`. CSS rules paint outlines and tinted backgrounds for the active mode.

```tsx
import { SourceInspector } from "@/components/devtools/source-inspector/source-inspector"

export function App({ children }) {
  return (
    <>
      <SourceInspector />
      {children}
    </>
  )
}
```

`SourceInspector` is a no-op in production builds (`NODE_ENV === 'production'`). Tree-shaking is guaranteed by the copy-and-own model — apps that do not run `npx visor add source-inspector` never include it.

## Toggle

`SourceInspectorToggle` is a Phosphor `Scan` icon button that cycles the overlay through `off → highlight-visor → highlight-non-visor → off`. Mount it anywhere in development chrome — the toggle creates a default provider lazily if none is in scope.

```tsx
import { SourceInspectorToggle } from "@/components/devtools/source-inspector/source-inspector-toggle"
import { ThemeSwitcher } from "@/components/ui/theme-switcher/theme-switcher"

<ThemeSwitcher extras={<SourceInspectorToggle />} />
```

The default keyboard shortcut is `Ctrl+Shift+X`. Override via the `hotkey` prop on `SourceInspector` (e.g., `hotkey="ctrl+shift+i"`), or pass `null` to disable.

## Classifiers

A classifier is a predicate over the source file path. The default classifiers cover Visor's package layout:

```tsx
const DEFAULT_CLASSIFIERS = {
  visor: (path) => path.includes("node_modules/@loworbitstudio/visor"),
  local: (path) => !path.includes("node_modules"),
  thirdParty: (path) => path.includes("node_modules") && !path.includes("@loworbitstudio/visor"),
}
```

Override them when the host has a non-standard layout (monorepo with workspace packages, custom registry path, etc.):

```tsx
<SourceInspector
  classifiers={{
    visor: (path) =>
      path.includes("packages/visor-components") ||
      path.includes("node_modules/@loworbitstudio/visor"),
    local: (path) => path.startsWith("/Users/me/work/my-app/src/"),
  }}
/>
```

The classifier order is fixed: `visor` wins, then `local`, then `thirdParty`, then `dom` for any DOM node whose owning Fiber has no debug source (host elements created by Visor primitives count as visor; bare divs created in the app's own JSX count as local).

## Modes

| Mode | What it paints |
|------|----------------|
| `off` | No overlay, zero render impact, `data-source` attrs cleared. |
| `highlight-visor` | Mint outline + 30% mint background on every `[data-source="visor"]` element. Borealis coverage proof. |
| `highlight-non-visor` | Coral outline + 30% coral background on every `[data-source="local"]` element. Borealis gap-finder; this is the workhorse mode. |

## Why per-element, not per-tree

Detection runs on every DOM element, not on whole component subtrees. A local component that composes Visor primitives renders with mixed regions: the wrapper (local) shows red, but its Button children (visor) show mint. That is the desired behavior — it surfaces exactly the seams where bespoke markup wraps shared primitives.

## React 19 caveat

`_debugSource` is populated by the React JSX dev runtime. If a host build configuration disables the dev runtime (rare), the inspector falls back to labeling all DOM nodes as `dom`. The component itself never throws.
