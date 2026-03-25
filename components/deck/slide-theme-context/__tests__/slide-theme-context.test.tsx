import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SlideThemeProvider, useSlideTheme } from "../slide-theme-context"

function TestConsumer() {
  const theme = useSlideTheme()
  return <span data-testid="theme">{theme}</span>
}

describe("SlideThemeContext", () => {
  it("defaults to light theme", () => {
    render(<TestConsumer />)
    expect(screen.getByTestId("theme")).toHaveTextContent("light")
  })

  it("provides dark theme when set", () => {
    render(
      <SlideThemeProvider theme="dark">
        <TestConsumer />
      </SlideThemeProvider>
    )
    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
  })

  it("provides light theme when set", () => {
    render(
      <SlideThemeProvider theme="light">
        <TestConsumer />
      </SlideThemeProvider>
    )
    expect(screen.getByTestId("theme")).toHaveTextContent("light")
  })
})
