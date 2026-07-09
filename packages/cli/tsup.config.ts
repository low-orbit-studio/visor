import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  // Optional/lazy deps for `visor render` — kept external so they are NOT bundled
  // into the published CLI (no install-size hit for consumers who never render).
  // Resolved at runtime via dynamic import; a clear prompt fires if absent.
  external: ["playwright", "esbuild"],
  banner: {
    js: "#!/usr/bin/env node",
  },
})
