import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/adapters/index.ts", "src/fowt.ts"],
  format: ["esm"],
  target: "es2022",
  dts: true,
  clean: true,
})
