// Hand-authored. The companion file `private-themes.generated.ts` is rewritten
// on every `predev`/`prebuild` by `scripts/generate-private-themes.mjs` based
// on whether `@low-orbit-studio/visor-themes-private` is installed.

export interface PrivateThemeEntry {
  slug: string;
  label: string;
  group: string;
}

export { PRIVATE_THEMES } from "./private-themes.generated";
