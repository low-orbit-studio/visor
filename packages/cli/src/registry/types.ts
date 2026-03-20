export type RegistryItemType =
  | "registry:ui"
  | "registry:hook"
  | "registry:lib"
  | "registry:block"
  | "registry:page"
  | "registry:theme"
  | "registry:style"

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
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files: BundledFile[]
}

export interface BundledRegistry {
  items: BundledRegistryItem[]
}
