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
  files: BundledFile[]
}

export interface BundledRegistry {
  items: BundledRegistryItem[]
}
