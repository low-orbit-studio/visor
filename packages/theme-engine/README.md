# @loworbitstudio/visor-theme-engine

Theme engine for the [Visor](https://visor.loworbit.studio) design system — shade generation, token mapping, font resolution, and import/export for `.visor.yaml` themes.

## Installation

```bash
npm install @loworbitstudio/visor-theme-engine
```

## What It Does

- Generates dark and light color scales from a brand anchor color using OKLCH
- Maps theme configuration (`.visor.yaml`) to CSS custom properties
- Resolves font declarations against the Visor fonts CDN
- Exports theme bundles for use in any project
- Provides a `docsAdapter` for registering themes in fumadocs sites

## Usage

Themes are typically managed via the Visor CLI (`visor theme sync`). Direct API usage is for advanced cases — building custom theme tooling or integrating with non-CLI workflows.

```ts
import { generateTheme } from '@loworbitstudio/visor-theme-engine'
```

## Migration

### Themes pinned to `^0.4.x` with a custom mono font

Engine 0.5 expanded `typography.mono` to accept `weight | weights | source | org` (previously only `family`). Engine 0.6 added `validate-coverage`, which errors when any `--font-*` declaration names a family with no matching `@font-face`. The combination created a trap: themes pinned to `^0.4.x` could only write `mono: { family: X }` (the only thing 0.4 allowed) and could not express the source/org fix the 0.6 error message points to.

To migrate:

1. **Bump both** `@loworbitstudio/visor` (the CLI) to `≥ 0.10` and `@loworbitstudio/visor-theme-engine` to `≥ 0.6` together. The CLI transitively pins its own engine copy (CLI 0.10 → engine `^0.6.0`), so `visor theme sync` runs against the CLI-bundled engine, not the hoisted one — bumping the engine alone is silently insufficient.

2. **Decide between inheritance and explicit declaration:**

   - **Inheritance (preferred when applicable).** If your mono slot's family matches another slot (heading, display, or body) with `source`/`org` set, leave `typography.mono.source` and `typography.mono.org` unset. The engine will inherit `source`/`org` from the matching slot. Match precedence: heading → display → body, case-insensitive.

     ```yaml
     typography:
       body:
         family: PP Model Mono
         weight: 400
         source: visor-fonts
         org: low-orbit-studio
       mono:
         family: PP Model Mono
         weight: 400
         # source/org inherited from body
     ```

   - **Explicit declaration.** Otherwise, add `source` (and `org` for `visor-fonts`) directly:

     ```yaml
     typography:
       mono:
         family: PP Model Mono
         weight: 400
         source: visor-fonts        # or google-fonts, fontshare, local
         org: low-orbit-studio      # required for visor-fonts only
     ```

System mono fonts (`SF Mono`, `JetBrains Mono`, `Source Code Pro`, `Menlo`, etc.) are already on the validator's `SYSTEM_FONTS` list and never need `source`/`org`.

## Documentation

Full docs at [visor.loworbit.studio](https://visor.loworbit.studio).
