/** Fixed-height single-line controls measured (not fixed) by VI-682. Label is flat-topped, descender-free. */
const L = "HEHTI"
const e = (c: string, props: string, kids = "") => `React.createElement(${c}, ${props}${kids ? ", " + kids : ""})`

export const CONTROLS = {
  modules: {
    "toggle-group": ["ToggleGroup", "ToggleGroupItem"],
    tabs: ["Tabs", "TabsList", "TabsTrigger"],
    chip: ["Chip", "ChoiceChip"],
    badge: ["Badge"],
    select: ["Select", "SelectTrigger", "SelectValue"],
    input: ["Input"],
  } as Record<string, string[]>,
  cases: [
    ...["sm", "md", "lg"].map((s) => ({
      id: `toggle-group item ${s}`,
      selector: "[data-slot=toggle-group-item]",
      jsx: e("C.ToggleGroup", `{ type: "single", size: "${s}", defaultValue: "a" }`, e("C.ToggleGroupItem", `{ value: "a" }`, `"${L}"`)),
    })),
    { id: "tabs trigger", selector: "[role=tab]", jsx: e("C.Tabs", `{ defaultValue: "a" }`, e("C.TabsList", "null", e("C.TabsTrigger", `{ value: "a" }`, `"${L}"`))) },
    ...["sm", "md", "lg"].map((s) => ({ id: `chip ${s}`, jsx: e("C.Chip", `{ size: "${s}", label: "${L}" }`) })),
    ...["sm", "md", "lg"].map((s) => ({ id: `badge ${s}`, jsx: e("C.Badge", `{ size: "${s}" }`, `"${L}"`) })),
    { id: "select trigger", selector: "[role=combobox]", jsx: e("C.Select", `{ defaultValue: "a" }`, e("C.SelectTrigger", "null", e("C.SelectValue", `{ placeholder: "${L}" }`))) },
    { id: "input", selector: "input", jsx: e("C.Input", `{ defaultValue: "${L}" }`) },
  ],
}
