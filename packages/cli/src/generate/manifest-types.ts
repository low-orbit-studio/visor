/**
 * Types for the Visor component metadata manifest system.
 *
 * ComponentMetadata: matches the per-component .visor.yaml schema
 * PatternMetadata: matches the .visor-pattern.yaml schema
 * VisorManifest: the aggregated manifest output (visor-manifest.json)
 */

export interface ComponentProp {
  name: string
  type: string
  default?: string
  description?: string
}

export interface ComponentSlot {
  name: string
  description: string
}

export interface SubComponent {
  name: string
  description: string
}

export interface ComponentMetadata {
  name: string
  description: string
  category:
    | "form"
    | "navigation"
    | "data-display"
    | "feedback"
    | "overlay"
    | "layout"
  when_to_use: string[]
  when_not_to_use: string[]
  why: string
  variants?: Record<string, string[]>
  props?: ComponentProp[]
  slots?: ComponentSlot[]
  sub_components?: SubComponent[]
  dependencies: string[]
  example: string
}

export interface BlockMetadata {
  name: string
  description: string
  category: string
  components_used: string[]
  when_to_use: string[]
  when_not_to_use: string[]
}

export interface PatternMetadata {
  name: string
  description: string
  components_used: string[]
  when_to_use: string[]
  structure: string
  notes: string
}

export interface ManifestComponent {
  category: string
  description: string
  when_to_use: string[]
  when_not_to_use: string[]
  variants?: Record<string, string[]>
  props?: ComponentProp[]
  slots?: ComponentSlot[]
  sub_components?: SubComponent[]
  dependencies: string[]
  tokens_used: string[]
  example: string
}

export interface ManifestHook {
  description: string
}

export interface ManifestBlock {
  category: string
  description: string
  components_used: string[]
  when_to_use: string[]
  when_not_to_use: string[]
}

export interface ManifestPattern {
  description: string
  components_used: string[]
  when_to_use: string[]
}

export interface VisorManifest {
  version: string
  generated_at: string
  components: Record<string, ManifestComponent>
  blocks: Record<string, ManifestBlock>
  hooks: Record<string, ManifestHook>
  patterns: Record<string, ManifestPattern>
  categories: Record<string, string[]>
}
