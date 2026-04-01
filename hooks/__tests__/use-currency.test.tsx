import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useCurrency, type Currency } from "../use-currency"

function TestComponent({ prices }: { prices?: Record<Currency, number> }) {
  const { currency, symbol, formatPrice } = useCurrency()
  const testPrices = prices ?? { usd: 19, eur: 17, gbp: 15 }

  return (
    <div>
      <span data-testid="currency">{currency}</span>
      <span data-testid="symbol">{symbol}</span>
      <span data-testid="formatted">{formatPrice(testPrices)}</span>
    </div>
  )
}

describe("useCurrency", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("defaults to USD when navigator is undefined (SSR)", () => {
    vi.stubGlobal("navigator", undefined)
    render(<TestComponent />)
    expect(screen.getByTestId("currency").textContent).toBe("usd")
    expect(screen.getByTestId("symbol").textContent).toBe("$")
  })

  it("detects GBP for en-GB locale", () => {
    vi.stubGlobal("navigator", { language: "en-GB" })
    render(<TestComponent />)
    expect(screen.getByTestId("currency").textContent).toBe("gbp")
    expect(screen.getByTestId("symbol").textContent).toBe("£")
  })

  it("detects EUR for de-DE locale", () => {
    vi.stubGlobal("navigator", { language: "de-DE" })
    render(<TestComponent />)
    expect(screen.getByTestId("currency").textContent).toBe("eur")
    expect(screen.getByTestId("symbol").textContent).toBe("€")
  })

  it("detects EUR for 'fr' language prefix with no country code", () => {
    vi.stubGlobal("navigator", { language: "fr" })
    render(<TestComponent />)
    expect(screen.getByTestId("currency").textContent).toBe("eur")
    expect(screen.getByTestId("symbol").textContent).toBe("€")
  })

  it("detects USD for en-US locale", () => {
    vi.stubGlobal("navigator", { language: "en-US" })
    render(<TestComponent />)
    expect(screen.getByTestId("currency").textContent).toBe("usd")
    expect(screen.getByTestId("symbol").textContent).toBe("$")
  })

  it("detects USD for unknown locale ja-JP", () => {
    vi.stubGlobal("navigator", { language: "ja-JP" })
    render(<TestComponent />)
    expect(screen.getByTestId("currency").textContent).toBe("usd")
    expect(screen.getByTestId("symbol").textContent).toBe("$")
  })

  it("formatPrice returns correct symbol and amount for USD", () => {
    vi.stubGlobal("navigator", { language: "en-US" })
    render(<TestComponent prices={{ usd: 19, eur: 17, gbp: 15 }} />)
    expect(screen.getByTestId("formatted").textContent).toBe("$19")
  })

  it("formatPrice returns correct symbol and amount for EUR", () => {
    vi.stubGlobal("navigator", { language: "de-DE" })
    render(<TestComponent prices={{ usd: 19, eur: 17, gbp: 15 }} />)
    expect(screen.getByTestId("formatted").textContent).toBe("€17")
  })

  it("formatPrice handles zero amount", () => {
    vi.stubGlobal("navigator", { language: "en-US" })
    render(<TestComponent prices={{ usd: 0, eur: 0, gbp: 0 }} />)
    expect(screen.getByTestId("formatted").textContent).toBe("$0")
  })
})
