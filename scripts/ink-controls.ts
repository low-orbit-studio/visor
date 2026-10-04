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
    "segmented-control": ["SegmentedControl"],
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
    ...["xs", "sm", "md", "lg"].map((s) => ({
      id: `segmented-control item ${s}`,
      selector: "[data-slot=toggle-group-item]",
      // The pill's state edge would be the "ink" the scan finds (symmetric, so the offset would read 0): turn it off to measure the label.
      jsx: e("C.SegmentedControl", `{ size: "${s}", defaultValue: "a", style: { "--segmented-control-indicator-edge": "transparent" }, options: [{ value: "a", label: "${label}" }] }`),
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

/**
 * VI-662: Input and NumberInput with a prefix and suffix, at every size. The value and each affix are measured
 * separately (the affix cases scan the affix's own extent inside the well), so "value and affix share a baseline"
 * is a measured fact. Kept apart from `buildControls`: the harness page is a single column and these would push
 * it past the 16k-device-pixel screenshot limit at 4x. NumberInput holds only a number, so its value is measured
 * with the flat-topped centring label only; its typed-text coverage is input-no-clip.test.ts.
 */
export const buildAffixControls = (label: string) => ({
  modules: { input: ["Input"], "number-input": ["NumberInput"] } as Record<string, string[]>,
  cases: [
    ...["sm", "md", "lg"].flatMap((s) => [
      { id: `input affix ${s} value`, selector: "input", jsx: e("C.Input", `{ size: "${s}", defaultValue: "${label}", prefix: "${label === L ? label : "\u20ac"}", suffix: "${label === L ? label : "jpy"}", "aria-label": "x" }`) },
      { id: `input affix ${s} prefix`, selector: "[data-slot=input-wrapper]", inkSelector: "[data-slot=input-prefix]", jsx: e("C.Input", `{ size: "${s}", defaultValue: "1", prefix: "${label}", "aria-label": "x" }`) },
      { id: `input affix ${s} suffix`, selector: "[data-slot=input-wrapper]", inkSelector: "[data-slot=input-suffix]", jsx: e("C.Input", `{ size: "${s}", defaultValue: "1", suffix: "${label}", "aria-label": "x" }`) },
    ]),
    ...(label === L ? [{ id: "number-input affix value", selector: "input", jsx: e("C.NumberInput", `{ defaultValue: 1, prefix: "${label}", "aria-label": "x" }`) }] : []),
    { id: "number-input affix prefix", selector: "[data-slot=number-input]", inkSelector: "[data-slot=number-input-prefix]", jsx: e("C.NumberInput", `{ defaultValue: 1, prefix: "${label}", "aria-label": "x" }`) },
    { id: "number-input affix suffix", selector: "[data-slot=number-input]", inkSelector: "[data-slot=number-input-suffix]", jsx: e("C.NumberInput", `{ defaultValue: 1, suffix: "${label}", "aria-label": "x" }`) },
  ],
})
export const AFFIX_CONTROLS = buildAffixControls(L)

/**
 * Measurement only: the affix is drawn in the secondary ink, whose antialiased edge rows fall under the harness's
 * 50% contrast threshold sooner than the primary-ink value's do, which reads as a sub-pixel offset that is not
 * positional. Measuring the affix in the value's ink makes the two comparable; position is unchanged.
 */
export const AFFIX_MEASURE_CSS =
  "\n[data-slot=input-prefix],[data-slot=input-suffix],[data-slot=number-input-prefix],[data-slot=number-input-suffix]{color:var(--text-primary)!important}"
