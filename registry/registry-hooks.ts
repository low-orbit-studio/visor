import type { Registry } from "./schema"

export const hooks: Registry = [
  {
    name: "use-media-query",
    type: "registry:hook",
    description: "SSR-safe hook that returns whether a CSS media query matches.",
    files: [
      {
        path: "hooks/use-media-query.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-debounce",
    type: "registry:hook",
    description:
      "Debounces a value by delaying updates until after a specified delay. Useful for search inputs and high-frequency events.",
    files: [
      {
        path: "hooks/use-debounce.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-click-outside",
    type: "registry:hook",
    description:
      "Fires a callback when a click or touch event occurs outside the referenced element. Useful for closing dropdowns and popovers.",
    files: [
      {
        path: "hooks/use-click-outside.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-local-storage",
    type: "registry:hook",
    description:
      "Persists state to localStorage with SSR safety, functional updates, and cross-tab synchronisation.",
    files: [
      {
        path: "hooks/use-local-storage.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-intersection-observer",
    type: "registry:hook",
    description:
      "Tracks whether an element is visible within the viewport using IntersectionObserver. Supports one-shot mode for lazy loading.",
    files: [
      {
        path: "hooks/use-intersection-observer.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-keyboard-shortcut",
    type: "registry:hook",
    description:
      "Fires a callback when a specific keyboard shortcut is pressed, with support for modifier keys (Meta, Ctrl, Shift, Alt).",
    files: [
      {
        path: "hooks/use-keyboard-shortcut.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-focus-trap",
    type: "registry:hook",
    description:
      "Traps keyboard focus within a container element. Used for accessible modals, drawers, and dialogs.",
    files: [
      {
        path: "hooks/use-focus-trap.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-previous",
    type: "registry:hook",
    description:
      "Returns the previous value of a variable from the last render. Useful for comparing values across renders.",
    files: [
      {
        path: "hooks/use-previous.ts",
        type: "registry:hook",
      },
    ],
  },
  {
    name: "use-boolean",
    type: "registry:hook",
    description:
      "Manages a boolean state with stable toggle, setTrue, and setFalse helpers. Useful for open/close and show/hide patterns.",
    files: [
      {
        path: "hooks/use-boolean.ts",
        type: "registry:hook",
      },
    ],
  },
]
