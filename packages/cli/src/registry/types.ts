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

export interface BundledFile {
  path: string
  type: RegistryItemType
  content: string
  target?: string
}

export interface BundledRegistryItem {
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
   * render itself. Resolved only when `visor add --block --with-suggested` is
   * used; excluded from the default install graph. See `RegistryItem` in
   * registry/schema.ts.
   */
  suggestedDependencies?: string[]
  files: BundledFile[]
}

export interface BundledRegistry {
  items: BundledRegistryItem[]
}
