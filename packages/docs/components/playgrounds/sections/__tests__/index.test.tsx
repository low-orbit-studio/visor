import { describe, it, expect } from "vitest";
import { DEFAULT_SECTION_ID, SECTIONS, findSection } from "../index";

describe("findSection", () => {
  it("returns the default section when id is null or undefined", () => {
    expect(findSection(null).id).toBe(DEFAULT_SECTION_ID);
    expect(findSection(undefined).id).toBe(DEFAULT_SECTION_ID);
    expect(findSection("").id).toBe(DEFAULT_SECTION_ID);
  });

  it("falls back to the default section for stale ids (e.g. pre-VI-482 'overlay' / 'overlays' from localStorage)", () => {
    expect(findSection("overlay").id).toBe(DEFAULT_SECTION_ID);
    expect(findSection("overlays").id).toBe(DEFAULT_SECTION_ID);
  });

  it("falls back to the default section for any unknown id", () => {
    expect(findSection("not-a-real-section").id).toBe(DEFAULT_SECTION_ID);
  });

  it("returns the registered section when given a known id", () => {
    for (const s of SECTIONS) {
      expect(findSection(s.id).id).toBe(s.id);
    }
  });
});
