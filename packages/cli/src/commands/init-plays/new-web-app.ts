import type { PlayDefinition } from "./registry.js"

/**
 * new-web-app — a fresh NextJS app entering the Playbook lifecycle.
 * State lives under `.lo/new-web-apps/{name}/`. Typically combined with
 * `--template nextjs` to scaffold the app in the same command.
 */
export const newWebAppPlay: PlayDefinition = {
  id: "new-web-app",
  loSubdir: "new-web-apps",
  label: "New web app",
  description: "A fresh NextJS app entering the Playbook lifecycle.",
}
