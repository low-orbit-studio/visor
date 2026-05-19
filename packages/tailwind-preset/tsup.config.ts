import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/v3.ts", "src/v4.ts", "src/tokens.ts"],
  format: ["esm", "cjs"],
  target: "es2022",
  dts: true,
  clean: true,
})
