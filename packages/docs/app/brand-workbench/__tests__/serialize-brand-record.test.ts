// VI-563 — serialize-brand-record: the `.visor.yaml` `brand-strategy:` block emitter.
// Round-trip identity + the engine brand-strategy validator accepts the output (Verification Plan).

import { describe, it, expect } from "vitest"
import { parse } from "yaml"
import { validateBrandStrategy } from "@loworbitstudio/visor-theme-engine"
import { serializeBrandRecord } from "../lib/serialize-brand-record"
import { VISOR_BRAND_RECORD } from "../lib/brand-record-fixture"

describe("serialize-brand-record — .visor.yaml brand-strategy block (VI-563)", () => {
  it("round-trips: record → YAML → parse → identical record", () => {
    const yaml = serializeBrandRecord(VISOR_BRAND_RECORD)
    const parsed = parse(yaml)["brand-strategy"]
    expect(parsed).toEqual(VISOR_BRAND_RECORD)
  })

  it("is deterministic — re-serializing the same record is byte-identical (idempotent)", () => {
    expect(serializeBrandRecord(VISOR_BRAND_RECORD)).toBe(serializeBrandRecord(VISOR_BRAND_RECORD))
  })

  it("emits the block under the top-level `brand-strategy:` key", () => {
    const doc = parse(serializeBrandRecord(VISOR_BRAND_RECORD))
    expect(Object.keys(doc)).toEqual(["brand-strategy"])
  })

  it("the engine brand-strategy validator accepts the serialized block", () => {
    const block = parse(serializeBrandRecord(VISOR_BRAND_RECORD))["brand-strategy"]
    const result = validateBrandStrategy(block)
    expect(result.valid).toBe(true)
  })

  it("a private record still serializes (the user's own .visor.yaml is not visibility-gated)", () => {
    const yaml = serializeBrandRecord({ ...VISOR_BRAND_RECORD, visibility: "private" })
    expect(parse(yaml)["brand-strategy"].visibility).toBe("private")
  })
})
