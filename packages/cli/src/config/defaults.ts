export interface VisorConfig {
  paths: {
    components: string
    hooks: string
    lib: string
  }
}

export const DEFAULT_CONFIG: VisorConfig = {
  paths: {
    components: "components/ui",
    hooks: "hooks",
    lib: "lib",
  },
}

export const CONFIG_FILE = "visor.json"
