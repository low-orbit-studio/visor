# Contributing to Visor

Thank you for your interest in contributing to Visor — Low Orbit Studio's shared design system. Whether you're fixing a bug, improving a component, or proposing a new token — contributions are welcome.

## Getting Started

### Prerequisites

- Node.js 20+
- npm (not bun, not pnpm)

### Set Up the Dev Environment

```bash
# Clone the repo
git clone https://github.com/loworbit/visor.git
cd visor

# Install dependencies (root + all workspaces)
npm install

# Start the docs site locally
npm run docs:dev

# Run tests
npm test

# Type-check
npm run typecheck
```

## Project Structure

```
visor/
├── components/         # Source component implementations
│   └── ui/             # Individual component directories
├── registry/           # shadcn-style registry manifest files
│   ├── registry-ui.ts  # UI component registry entries
│   ├── registry-hooks.ts
│   └── registry-lib.ts
├── packages/
│   ├── tokens/         # @loworbitstudio/visor-core npm package
│   │   └── src/        # CSS custom property definitions
│   └── docs/           # fumadocs documentation site (Next.js)
│       ├── app/        # Next.js app directory
│       └── content/    # MDX documentation pages
├── hooks/              # Shared React hooks
└── lib/                # Shared utility functions
```

**Distribution model:** Components are copy-and-own via the registry — consumers run `npx visor add <component>` and own the source. Tokens are distributed as the `@loworbitstudio/visor-core` npm package.

## Adding or Modifying Components

1. **Implement the component** in `components/ui/<component-name>/`.
2. **Register it** in `registry/registry-ui.ts` following the existing pattern.
3. **Write tests** in `components/__tests__/` using Vitest + React Testing Library.
4. **Document it** by adding an MDX page under `packages/docs/content/docs/components/`.
5. Run `npm test` and `npm run typecheck` before opening a PR.

### Component conventions

- Use **CSS Modules** for all styles — no Tailwind, no CSS-in-JS.
- Reference **CSS custom properties** exclusively — never hard-code color, spacing, or typography values. All tokens live in `@loworbitstudio/visor-core`.
- Use **CVA (class-variance-authority)** for component variants.
- Use **Radix UI primitives** only for components that require complex accessibility behavior (dialogs, dropdowns, etc.). Prefer plain HTML elements otherwise.
- Use **Phosphor Icons** (`@phosphor-icons/react`) for any icon needs.
- Components must be fully **theme-agnostic** — they should look correct under any theme class without modification.

## Flutter Components

Flutter widgets live in `components/flutter/<widget>/` and follow the same copy-and-own model as the React components.

### Prerequisites

- Flutter 3.32+ (the CI lane pins `3.35.5`). Either install via [FVM](https://fvm.app/) (recommended — `fvm install 3.35.5`) or have `flutter` on your `PATH`.
- The token package `visor_core` resolves via a relative `path:` dependency in `components/flutter/pubspec.yaml`. No extra setup needed beyond `flutter pub get`.

### Running the Flutter test suite

Tests live next to source (e.g., `components/flutter/visor_button/visor_button_test.dart`). Run them per-directory:

```bash
cd components/flutter
flutter pub get
flutter test visor_button/
```

To run all widget tests at once:

```bash
cd components/flutter
flutter test $(find . -maxdepth 1 -mindepth 1 -type d -name 'visor_*' | sort)
```

`flutter analyze` should be clean before opening a PR.

### Golden tests (alchemist)

Visor uses [`alchemist`](https://pub.dev/packages/alchemist) for golden image tests. CI goldens use the Ahem font for cross-OS determinism — every glyph renders as a solid square — so they produce byte-identical output on macOS, Linux, and Windows. The configuration lives in `components/flutter/flutter_test_config.dart`. Platform goldens (real fonts, host-dependent) are disabled; Widgetbook is the canonical place for human-eyes visual review.

To **regenerate** golden baselines after intentional visual changes:

```bash
cd components/flutter
flutter test --update-goldens visor_button/
```

This works on macOS or Linux because CI goldens render the Ahem font identically. After regenerating, commit the updated PNGs in `<widget>/goldens/ci/`. **Always inspect the diff** before committing — golden churn from unrelated changes is a smell.

To **verify** without regenerating (the CI behavior):

```bash
cd components/flutter
flutter test visor_button/
```

A failed golden produces a `*_testImage.png` and a `*_masterImage.png` next to the failing test for visual diffing. See [`docs/flutter-widget-quality-contract.md`](./docs/flutter-widget-quality-contract.md) (Rec1, S16) and [W018](./docs/wisdom/W018-flutter-widget-contract-baseline.md) for the rationale.

## Adding or Modifying Tokens

Tokens live in `packages/tokens/src/` and follow a 3-tier architecture:

1. **Primitives** — Raw values (e.g., a specific hex color or a spacing step).
2. **Semantic** — Purpose-named tokens (e.g., `--text-primary`, `--surface-card`, `--border-default`).
3. **Adaptive** — Theme-aware tokens that resolve differently based on the active theme class.

When adding tokens:

- Add primitives first, then reference them in semantic tokens.
- Keep names purpose-driven, not value-driven (`--text-muted`, not `--gray-400`).
- If a token is theme-specific, add it to the relevant theme file rather than the base layer.
- Run `npm run build -w packages/tokens` to verify the package builds cleanly.

## Testing Expectations

- All components must have test coverage using **Vitest** and **React Testing Library**.
- Tests live alongside source in `components/__tests__/`.
- Run the full test suite with `npm test` before submitting a PR.
- Tests should cover rendering, key interactions, and any meaningful variant combinations.
- Aim for meaningful coverage — don't write tests just to check a box.

## Code Style

- **CSS Modules** for styles. No Tailwind, no inline styles, no CSS-in-JS.
- **TypeScript** throughout — no `any` unless truly unavoidable.
- **CVA** for variant management in components.
- **Named exports** preferred over default exports.
- Follow the patterns already established in existing components — consistency matters more than personal preference.

ESLint is configured at the root. Run `npm run lint` to check and `npm run lint:fix` to auto-fix.

## PR Process

1. Fork the repo and create a branch with a descriptive name (e.g., `feat/button-loading-state` or `fix/input-focus-ring`).
2. Make your changes — one concern per PR is strongly preferred.
3. Run `npm test`, `npm run typecheck`, and `npm run lint` before pushing.
4. Open a pull request against `main` with a clear title and description of what changed and why.
5. A maintainer will review and may request changes. We aim to respond within a few business days.

For significant changes — new components, breaking token changes, architecture decisions — please open an issue first to discuss the approach before investing time in implementation.

## Contributor Ladder

The contributor ladder describes how involvement can grow over time. See [GOVERNANCE.md](./GOVERNANCE.md) for the full governance model and decision-making process.

**Contributor** — Anyone who opens a quality issue, discussion, or PR. No requirements beyond good faith engagement.

**Regular Contributor** — Someone who has had 3+ PRs merged across different areas of the codebase. Gets faster review turnaround and is consulted on relevant design decisions.

**Maintainer** — Invited by the lead maintainer after sustained, high-quality contribution and demonstrated judgment on API and architecture decisions. Has merge rights and participates in release decisions.

## Code of Conduct

Be respectful. This is a collaborative space and everyone is expected to engage constructively and with good faith. Harassment, dismissiveness, or bad-faith behavior will not be tolerated.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
