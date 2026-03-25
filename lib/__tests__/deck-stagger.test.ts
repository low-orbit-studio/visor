import { describe, it, expect } from "vitest"
import { staggerDelay } from "../deck-stagger"

describe("staggerDelay", () => {
  it("returns transitionDelay style for text system", () => {
    const style = staggerDelay(0, "text")
    expect(style).toEqual({ transitionDelay: "0ms" })
  })

  it("increments delay by step for each index", () => {
    const style = staggerDelay(3, "text")
    // text: base 0 + step 80 * 3 = 240
    expect(style).toEqual({ transitionDelay: "240ms" })
  })

  it("applies base offset for card system", () => {
    const style = staggerDelay(0, "card")
    // card: base 200 + step 100 * 0 = 200
    expect(style).toEqual({ transitionDelay: "200ms" })
  })

  it("caps card index at 9", () => {
    const style9 = staggerDelay(9, "card")
    const style15 = staggerDelay(15, "card")
    expect(style9).toEqual(style15)
  })

  it("uses hero timing", () => {
    const style = staggerDelay(2, "hero")
    // hero: base 100 + step 120 * 2 = 340
    expect(style).toEqual({ transitionDelay: "340ms" })
  })

  it("uses footer timing", () => {
    const style = staggerDelay(1, "footer")
    // footer: base 300 + step 100 * 1 = 400
    expect(style).toEqual({ transitionDelay: "400ms" })
  })

  it("defaults to text system when no system specified", () => {
    const style = staggerDelay(2)
    // text: base 0 + step 80 * 2 = 160
    expect(style).toEqual({ transitionDelay: "160ms" })
  })
})
