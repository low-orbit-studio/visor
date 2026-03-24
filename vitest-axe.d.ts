import type { AxeResults, RunOptions } from "axe-core"

declare module "vitest-axe" {
  export function axe(
    html: Element | string,
    additionalOptions?: RunOptions
  ): Promise<AxeResults>
  export function configureAxe(
    options?: RunOptions & { globalOptions?: import("axe-core").Spec }
  ): typeof axe
}

declare module "vitest" {
  interface Assertion<T> {
    toHaveNoViolations(): T extends AxeResults ? void : never
  }
}
