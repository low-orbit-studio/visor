import { describe, it, expect } from "vitest";
// @ts-expect-error -- plain .mjs helper, no .d.ts emitted
import { extractTypographySlots } from "../extract-typography-slots.mjs";

/**
 * VI-356: the docs site's PRIVATE_THEMES manifest carries a `typography` field
 * per theme so the Design System Specimen can render the exact weight rows a
 * theme loads instead of a hardcoded 4+3 grid. The extractor is the bridge
 * between a resolved theme config (from @loworbitstudio/visor-theme-engine)
 * and the manifest shape — its contract is tested here.
 */
describe("extractTypographySlots (VI-356)", () => {
  it("returns undefined when no typography slot declares weights", () => {
    const config = {
      typography: {
        heading: { family: "system-ui", weight: 700 },
        body: { family: "system-ui", weight: 400 },
        mono: { family: "ui-monospace" },
      },
    };
    expect(extractTypographySlots(config)).toBeUndefined();
  });

  it("returns undefined when typography is absent entirely", () => {
    expect(extractTypographySlots({})).toBeUndefined();
    expect(extractTypographySlots(null)).toBeUndefined();
    expect(extractTypographySlots(undefined)).toBeUndefined();
  });

  it("emits the Blacklight shape — display + body, five weights each", () => {
    const config = {
      typography: {
        display: { family: "PP Model Plastic", weight: 500, weights: [300, 400, 500, 700, 800] },
        body: { family: "PP Model Mono", weight: 300, weights: [300, 400, 500, 700, 800] },
        mono: { family: "PP Model Mono" },
      },
    };
    expect(extractTypographySlots(config)).toEqual({
      display: { family: "PP Model Plastic", weights: [300, 400, 500, 700, 800] },
      body: { family: "PP Model Mono", weights: [300, 400, 500, 700, 800] },
    });
  });

  it("emits the Blacklight Underground shape — heading/display/body, two weights for the loaded slots", () => {
    const config = {
      typography: {
        display: { family: "PP Model Plastic", weight: 500, weights: [500] },
        heading: { family: "PP Model Mono", weight: 500, weights: [300, 500] },
        body: { family: "PP Model Sans", weight: 300, weights: [300, 500] },
      },
    };
    expect(extractTypographySlots(config)).toEqual({
      heading: { family: "PP Model Mono", weights: [300, 500] },
      display: { family: "PP Model Plastic", weights: [500] },
      body: { family: "PP Model Sans", weights: [300, 500] },
    });
  });

  it("de-duplicates and sorts weights ascending", () => {
    const config = {
      typography: {
        body: { family: "X", weights: [700, 400, 700, 500, 400] },
      },
    };
    expect(extractTypographySlots(config)).toEqual({
      body: { family: "X", weights: [400, 500, 700] },
    });
  });

  it("drops slots whose weights array is empty", () => {
    const config = {
      typography: {
        heading: { family: "A", weights: [] },
        body: { family: "B", weights: [400] },
      },
    };
    expect(extractTypographySlots(config)).toEqual({
      body: { family: "B", weights: [400] },
    });
  });

  it("filters non-numeric / non-finite weight entries defensively", () => {
    const config = {
      typography: {
        body: { family: "X", weights: [400, "500", null, NaN, Infinity, 700] },
      },
    };
    expect(extractTypographySlots(config)).toEqual({
      body: { family: "X", weights: [400, 700] },
    });
  });

  it("coerces a missing family to an empty string but still emits the slot", () => {
    const config = { typography: { body: { weights: [400, 700] } } };
    expect(extractTypographySlots(config)).toEqual({
      body: { family: "", weights: [400, 700] },
    });
  });
});
