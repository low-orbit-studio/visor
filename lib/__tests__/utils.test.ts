import { describe, it, expect } from "vitest"
import { cn } from "../utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    const condition = false
    expect(cn("foo", condition && "bar", "baz")).toBe("foo baz")
  })

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar")
  })

  it("concatenates multiple class names without deduplication", () => {
    expect(cn("p-4", "p-2")).toBe("p-4 p-2")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })

  it("handles arrays", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
  })
})
