import React from "react"

// Every one of these was silently skipped before VI-631: the case-sensitive
// substring pre-filter matched none of `fontSize`, `lineHeight`, `borderRadius`,
// `minWidth` or `maxHeight`.
export function CamelCasePx() {
  const label = { fontSize: "13px", lineHeight: "20px" }
  const box = { borderRadius: "6px", minWidth: "120px", maxHeight: "480px" }
  // These two DID match, by substring accident — they must keep firing.
  const legacy = { marginTop: "24px", paddingLeft: "18px" }
  return <div data-a={label} data-b={box} data-c={legacy} />
}
