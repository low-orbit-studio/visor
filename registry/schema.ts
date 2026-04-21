export type RegistryItemType =
  | "registry:ui"
  | "registry:hook"
  | "registry:lib"
  | "registry:block"
  | "registry:page"
  | "registry:theme"
  | "registry:style"

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
