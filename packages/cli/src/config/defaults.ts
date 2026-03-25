export interface VisorConfig {
  paths: {
    components: string
    deckComponents: string
    blocks: string
    hooks: string
    lib: string
  }
}

export const DEFAULT_CONFIG: VisorConfig = {
  paths: {
    components: "components/ui",
    deckComponents: "components/deck",
    blocks: "blocks",
    hooks: "hooks",
    lib: "lib",
  },
}

export const CONFIG_FILE = "visor.json"
