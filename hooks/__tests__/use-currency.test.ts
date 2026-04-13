import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useCurrency } from "../use-currency"

describe("useCurrency", () => {
  const originalLanguage = navigator.language

  afterEach(() => {
    Object.defineProperty(navigator, "language", {
      value: originalLanguage,
      configurable: true,
    })
  })

  function setLocale(lang: string) {
    Object.defineProperty(navigator, "language", {
      value: lang,
      configurable: true,
    })
  }

  it("defaults to USD for en-US locale", () => {
    setLocale("en-US")
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe("usd")
    expect(result.current.symbol).toBe("$")
  })

  it("detects GBP for en-GB locale", () => {
    setLocale("en-GB")
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe("gbp")
    expect(result.current.symbol).toBe("£")
  })

  it("detects EUR for de-DE locale", () => {
    setLocale("de-DE")
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe("eur")
    expect(result.current.symbol).toBe("€")
  })

  it("detects EUR for fr-FR locale", () => {
    setLocale("fr-FR")
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe("eur")
    expect(result.current.symbol).toBe("€")
  })

  it("formatPrice returns the correct price for the detected currency", () => {
    setLocale("en-US")
    const { result } = renderHook(() => useCurrency())
    const price = result.current.formatPrice({ usd: 99, eur: 89, gbp: 79 })
    expect(price).toBe("$99")
  })

  it("formatPrice returns symbol+0 when price is zero", () => {
    setLocale("en-US")
    const { result } = renderHook(() => useCurrency())
    const price = result.current.formatPrice({ usd: 0, eur: 0, gbp: 0 })
    expect(price).toBe("$0")
  })

  it("formatPrice handles non-zero prices for EUR", () => {
    setLocale("de-DE")
    const { result } = renderHook(() => useCurrency())
    const price = result.current.formatPrice({ usd: 99, eur: 89, gbp: 79 })
    expect(price).toBe("€89")
  })

  it("formatPrice handles non-zero prices for GBP", () => {
    setLocale("en-GB")
    const { result } = renderHook(() => useCurrency())
    const price = result.current.formatPrice({ usd: 99, eur: 89, gbp: 79 })
    expect(price).toBe("£79")
  })

  it("formatPrice handles large numbers", () => {
    setLocale("en-US")
    const { result } = renderHook(() => useCurrency())
    const price = result.current.formatPrice({ usd: 1999, eur: 1799, gbp: 1599 })
    expect(price).toBe("$1999")
  })
})
