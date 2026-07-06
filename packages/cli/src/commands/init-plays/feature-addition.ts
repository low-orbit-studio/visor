import type { PlayDefinition } from "./registry.js"

/**
 * feature-addition — an existing project onboarding into the Playbook
 * mid-stream. Safe to run against a populated directory: the play flow writes
 * only `.lo/feature-additions/{name}/` and never scaffolds over existing files
 * (idempotent per D7). State lives under `.lo/feature-additions/{name}/`.
 */
export const featureAdditionPlay: PlayDefinition = {
  id: "feature-addition",
  loSubdir: "feature-additions",
  label: "Feature addition",
  description:
    "An existing project onboarding into the Playbook mid-stream (safe, idempotent).",
}
