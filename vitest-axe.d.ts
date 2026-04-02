import type { AxeResults } from "axe-core"

declare module "vitest" {
  interface Assertion<T> {
    toHaveNoViolations(): T extends AxeResults ? void : never
  }
}
