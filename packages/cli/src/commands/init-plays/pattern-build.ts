import type { PlayDefinition } from "./registry.js"

/**
 * pattern-build — designs and converges a reusable Borealis pattern.
 * State lives under `.lo/pattern-builds/{name}/`.
 */
export const patternBuildPlay: PlayDefinition = {
  id: "pattern-build",
  loSubdir: "pattern-builds",
  label: "Pattern build",
  description:
    "Design + converge a reusable Borealis pattern (admin-ui, forms, ...).",
}
