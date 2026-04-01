"use client"

import { useState } from "react"

export type Currency = "usd" | "eur" | "gbp"

export interface UseCurrencyReturn {
  currency: Currency
  symbol: string
  formatPrice: (prices: Record<Currency, number>) => string
}

const euroCountries = [
  "de", "fr", "it", "es", "nl", "be", "at", "pt", "fi", "ie",
  "gr", "sk", "si", "ee", "lv", "lt", "cy", "mt", "lu",
]

const currencySymbols: Record<Currency, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
}

function detectCurrency(): Currency {
  if (typeof navigator === "undefined") return "usd"

  const lang = navigator.language.toLowerCase()
  const country = lang.split("-")[1] || lang

  if (country === "gb" || country === "uk") {
    return "gbp"
  } else if (
    euroCountries.includes(country) ||
    lang.startsWith("de") ||
    lang.startsWith("fr")
  ) {
    return "eur"
  }
  return "usd"
}

/**
 * Detects the user's locale and returns the appropriate currency, symbol,
 * and a price formatter for USD, EUR, and GBP. SSR-safe — defaults to USD
 * when navigator is unavailable.
 */
export function useCurrency(): UseCurrencyReturn {
  const [currency] = useState<Currency>(() => detectCurrency())

  const symbol = currencySymbols[currency]

  const formatPrice = (prices: Record<Currency, number>): string => {
    const amount = prices[currency]
    return amount === 0 ? `${symbol}0` : `${symbol}${amount}`
  }

  return { currency, symbol, formatPrice }
}
