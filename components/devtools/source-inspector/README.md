# SourceInspector

Borealis pre-flight x-ray overlay for Visor consumers.

## Mental model

Borealis substrate adherence — "did I use Visor primitives?" — used to be policed by manual code reads. SourceInspector flips it into an instrument: turn it on, see at a glance which regions of the running app come from Visor and which come from the host's local components. Any red region is either a deliberate exception or a candidate for a `VI-` ticket.

## Mount

`SourceInspector` walks the React Fiber tree post-render, resolves the source URL of each element's owning component (via `_debugOwner._debugStack` on React 19+, falling back to `_debugSource.fileName` on older runtimes), and stamps the corresponding DOM element with `data-source="visor" | "local" | "third-party" | "dom"`. CSS rules paint outlines and tinted backgrounds for the active mode.

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

`SourceInspectorToggle` is a Phosphor `Scan` icon button that cycles the overlay through `off → highlight-visor → highlight-non-visor → off`. Mount it anywhere in development chrome — the toggle lazily mounts a full `<SourceInspector>` (provider + runner) if none is in scope, so the overlay applies whether the toggle is used standalone or nested inside an existing `<SourceInspector>`.

```tsx
import { SourceInspectorToggle } from "@/components/devtools/source-inspector/source-inspector-toggle"
import { ThemeSwitcher } from "@/components/ui/theme-switcher/theme-switcher"

<ThemeSwitcher extras={<SourceInspectorToggle />} />
```

The default keyboard shortcut is `Ctrl+Shift+X`. Override via the `hotkey` prop on `SourceInspector` (e.g., `hotkey="ctrl+shift+i"`), or pass `null` to disable.

## Classifiers

A classifier is a predicate over the source identifier — a file path on older React runtimes, a bundler chunk URL on React 19+ (Webpack or Turbopack). The default classifiers cover Visor's package layout in both forms:

```tsx
const DEFAULT_CLASSIFIERS = {
  // Matches `@loworbitstudio/visor` (file paths, Webpack chunks) and
  // `loworbitstudio_visor` (Turbopack underscore-mangled chunk names).
  visor: (source) =>
    source.includes("@loworbitstudio/visor") ||
    source.includes("loworbitstudio_visor"),
  local: (source) => !source.includes("node_modules"),
  thirdParty: (source) =>
    source.includes("node_modules") &&
    !source.includes("@loworbitstudio/visor") &&
    !source.includes("loworbitstudio_visor"),
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

## React 19 / Next 16 notes

The classifier reads `fiber._debugOwner._debugStack` (an `Error` captured by React's JSX dev runtime), parses its first user-source frame, and feeds that URL to the classifier. Production builds strip `_debugStack`, so the inspector renders no overlay there — same null-safe behavior the production no-op already guarantees. The component never throws on missing fields.
