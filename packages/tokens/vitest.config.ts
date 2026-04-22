import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Resolve repo root here (Node.js context) so tests don't need to walk paths.
// vitest.config.ts is at packages/tokens/ → repo root is two levels up.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  test: {
    environment: "jsdom",
    env: {
      VISOR_REPO_ROOT: REPO_ROOT,
    },
  },
});
