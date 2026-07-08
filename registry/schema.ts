export type RegistryItemType =
  | "registry:ui"
  | "registry:hook"
  | "registry:lib"
  | "registry:block"
  | "registry:page"
  | "registry:theme"
  | "registry:style"
  | "registry:devtool"

export type RegistryTarget = "react" | "flutter"

export interface PubDependency {
  pub: string
  version: string
}

export interface RegistryFile {
  path: string
  type: RegistryItemType
  content?: string
  target?: string
}

export interface RegistryItem {
  name: string
  type: RegistryItemType
  description?: string
  category?: string
  target?: RegistryTarget
  dependencies?: string[]
  devDependencies?: string[]
  pubDependencies?: PubDependency[]
  registryDependencies?: string[]
  /**
   * Slot-fill components a block can be composed with but does NOT import to
   * render itself. Not installed by `visor add <block> --block` by default —
   * opt in with `--with-suggested`. Distinct from `registryDependencies`
   * (hard deps needed to render). Mirrors the block's `.visor.yaml`
   * `components_used` list, which documents the same slots for humans/agents.
   */
  suggestedDependencies?: string[]
  files: RegistryFile[]
  tailwind?: {
    config?: Record<string, unknown>
  }
  cssVars?: {
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  meta?: Record<string, unknown>
}

export type Registry = RegistryItem[]
