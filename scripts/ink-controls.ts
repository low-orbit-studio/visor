/** The centring label: flat-topped and descender-free, so the cap-to-baseline band is the whole ink. */
const L = "HEHTI"
/** The no-clip label (VI-684 regression): descenders (g j p q y) and accents above the cap height (É Å Ñ). */
export const CLIP_LABEL = "Typography jpq \u00C9\u00C5\u00D1"
const e = (c: string, props: string, kids = "") => `React.createElement(${c}, ${props}${kids ? ", " + kids : ""})`

/** Every trimmed control, at every size, carrying `label`. `button` adds Button (it is measured by its own test in the centring suite). */
export const buildControls = (label: string, button = false) => ({
  modules: {
    ...(button ? { button: ["Button"] } : {}),
    "toggle-group": ["ToggleGroup", "ToggleGroupItem"],
    tabs: ["Tabs", "TabsList", "TabsTrigger"],
    chip: ["Chip", "ChoiceChip"],
    badge: ["Badge"],
    select: ["Select", "SelectTrigger", "SelectValue"],
    input: ["Input"],
  } as Record<string, string[]>,
  cases: [
    ...(button ? ["sm", "md", "lg"].map((s) => ({ id: `button ${s}`, jsx: e("C.Button", `{ size: "${s}" }`, `"${label}"`) })) : []),
    ...["sm", "md", "lg"].map((s) => ({
      id: `toggle-group item ${s}`,
      selector: "[data-slot=toggle-group-item]",
      jsx: e("C.ToggleGroup", `{ type: "single", size: "${s}", defaultValue: "a" }`, e("C.ToggleGroupItem", `{ value: "a" }`, `"${label}"`)),
    })),
    { id: "tabs trigger", selector: "[role=tab]", jsx: e("C.Tabs", `{ defaultValue: "a" }`, e("C.TabsList", "null", e("C.TabsTrigger", `{ value: "a" }`, `"${label}"`))) },
    ...["sm", "md", "lg"].map((s) => ({ id: `chip ${s}`, jsx: e("C.Chip", `{ size: "${s}", label: "${label}" }`) })),
    ...["sm", "md", "lg"].map((s) => ({ id: `badge ${s}`, jsx: e("C.Badge", `{ size: "${s}" }`, `"${label}"`) })),
    ...["sm", "md", "lg"].map((s) => ({
      id: `select trigger ${s}`,
      selector: "[role=combobox]",
      inkSelector: "[data-slot=select-trigger] > span",
      jsx: e("C.Select", "null", e("C.SelectTrigger", `{ size: "${s}" }`, e("C.SelectValue", `{ placeholder: "${label}" }`))),
    })),
    ...["sm", "md", "lg"].map((s) => ({ id: `input ${s}`, selector: "input", jsx: e("C.Input", `{ size: "${s}", defaultValue: "${label}" }`) })),
  ],
})

/** Fixed-height single-line controls measured (not fixed) by VI-682. */
export const CONTROLS = buildControls(L)
