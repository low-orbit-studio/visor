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

## Documentation

Full docs at [visor.loworbit.studio](https://visor.loworbit.studio).
