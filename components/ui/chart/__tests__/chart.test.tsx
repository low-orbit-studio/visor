import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import * as React from "react"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartStyle,
  useChart,
  type ChartConfig,
} from "../chart"

// Mock recharts to avoid ResizeObserver issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
  Legend: () => null,
}))

const baseConfig: ChartConfig = {
  sales: { label: "Sales", color: "#4f46e5" },
  revenue: { label: "Revenue", color: "#06b6d4" },
}

describe("ChartContainer", () => {
  it("renders with required props", () => {
    render(
      <ChartContainer config={baseConfig}>
        <div>Chart content</div>
      </ChartContainer>
    )
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
  })

  it("renders the chart wrapper div with data-slot attribute", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <div>Chart content</div>
      </ChartContainer>
    )
    const chartDiv = container.querySelector("[data-slot='chart']")
    expect(chartDiv).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <ChartContainer config={baseConfig} className="custom-chart">
        <div>Chart content</div>
      </ChartContainer>
    )
    const chartDiv = container.querySelector("[data-slot='chart']")
    expect(chartDiv).toHaveClass("custom-chart")
  })

  it("uses provided id for data-chart attribute", () => {
    const { container } = render(
      <ChartContainer config={baseConfig} id="my-chart">
        <div>Chart content</div>
      </ChartContainer>
    )
    const chartDiv = container.querySelector("[data-chart='chart-my-chart']")
    expect(chartDiv).toBeInTheDocument()
  })

  it("renders children inside ResponsiveContainer", () => {
    render(
      <ChartContainer config={baseConfig}>
        <div data-testid="chart-child">Inner chart</div>
      </ChartContainer>
    )
    expect(screen.getByTestId("chart-child")).toBeInTheDocument()
  })
})

describe("ChartStyle", () => {
  it("renders null when config has no colors", () => {
    const emptyConfig: ChartConfig = { sales: { label: "Sales" } }
    const { container } = render(
      <ChartStyle id="test-chart" config={emptyConfig} />
    )
    expect(container.querySelector("style")).toBeNull()
  })

  it("renders a style element when config has colors", () => {
    const { container } = render(
      <ChartStyle id="test-chart" config={baseConfig} />
    )
    const styleEl = container.querySelector("style")
    expect(styleEl).toBeInTheDocument()
    expect(styleEl?.textContent).toContain("--color-sales")
    expect(styleEl?.textContent).toContain("--color-revenue")
  })

  it("includes color values in generated CSS", () => {
    const { container } = render(
      <ChartStyle id="test-chart" config={baseConfig} />
    )
    const styleEl = container.querySelector("style")
    expect(styleEl?.textContent).toContain("#4f46e5")
    expect(styleEl?.textContent).toContain("#06b6d4")
  })

  it("scopes CSS to the chart id", () => {
    const { container } = render(
      <ChartStyle id="test-chart" config={baseConfig} />
    )
    const styleEl = container.querySelector("style")
    expect(styleEl?.textContent).toContain("[data-chart=test-chart]")
  })

  it("includes both light and dark theme rules", () => {
    const themeConfig: ChartConfig = {
      sales: {
        label: "Sales",
        theme: { light: "#4f46e5", dark: "#818cf8" },
      },
    }
    const { container } = render(
      <ChartStyle id="test-chart" config={themeConfig} />
    )
    const styleEl = container.querySelector("style")
    expect(styleEl?.textContent).toContain("#4f46e5")
    expect(styleEl?.textContent).toContain("#818cf8")
    expect(styleEl?.textContent).toContain(".dark")
  })
})

describe("ChartTooltipContent", () => {
  const payloadItem = {
    name: "sales",
    dataKey: "sales",
    value: 1234,
    color: "#4f46e5",
    type: "bar" as const,
    payload: { sales: 1234 },
  }

  it("returns null when not active", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent active={false} payload={[payloadItem]} />
      </ChartContainer>
    )
    // ChartTooltipContent renders nothing when active=false
    expect(container.querySelector("[class*='tooltipContent']")).toBeNull()
  })

  it("returns null when payload is empty", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent active={true} payload={[]} />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='tooltipContent']")).toBeNull()
  })

  it("renders tooltip content when active with payload", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent active={true} payload={[payloadItem]} />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='tooltipContent']")).toBeInTheDocument()
  })

  it("renders the item label from config", () => {
    render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent active={true} payload={[payloadItem]} />
      </ChartContainer>
    )
    const salesElements = screen.getAllByText("Sales")
    expect(salesElements.length).toBeGreaterThan(0)
  })

  it("renders the formatted value", () => {
    render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent active={true} payload={[payloadItem]} />
      </ChartContainer>
    )
    expect(screen.getByText("1,234")).toBeInTheDocument()
  })

  it("renders label when provided and hideLabel is false", () => {
    render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent
          active={true}
          payload={[payloadItem]}
          label="January"
        />
      </ChartContainer>
    )
    expect(screen.getByText("January")).toBeInTheDocument()
  })

  it("hides label when hideLabel is true", () => {
    render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent
          active={true}
          payload={[payloadItem]}
          label="January"
          hideLabel={true}
        />
      </ChartContainer>
    )
    expect(screen.queryByText("January")).toBeNull()
  })

  it("renders indicator dot by default", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent active={true} payload={[payloadItem]} />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='indicatorDot']")).toBeInTheDocument()
  })

  it("renders line indicator when indicator='line'", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent
          active={true}
          payload={[payloadItem]}
          indicator="line"
        />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='indicatorLine']")).toBeInTheDocument()
  })

  it("renders dashed indicator when indicator='dashed'", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent
          active={true}
          payload={[payloadItem]}
          indicator="dashed"
        />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='indicatorDashed']")).toBeInTheDocument()
  })

  it("hides indicator when hideIndicator is true", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartTooltipContent
          active={true}
          payload={[payloadItem]}
          hideIndicator={true}
        />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='indicator']")).toBeNull()
  })

  it("throws when used outside ChartContainer", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => {
      render(<ChartTooltipContent active={true} payload={[payloadItem]} />)
    }).toThrow("useChart must be used within a <ChartContainer />")
    consoleSpy.mockRestore()
  })
})

describe("ChartLegendContent", () => {
  const legendPayload = [
    {
      value: "sales",
      dataKey: "sales",
      color: "#4f46e5",
      type: "rect" as const,
    },
    {
      value: "revenue",
      dataKey: "revenue",
      color: "#06b6d4",
      type: "rect" as const,
    },
  ]

  it("returns null when payload is empty", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>
    )
    expect(container.querySelector("[class*='legendContent']")).toBeNull()
  })

  it("renders legend items from payload", () => {
    render(
      <ChartContainer config={baseConfig}>
        <ChartLegendContent payload={legendPayload} />
      </ChartContainer>
    )
    expect(screen.getByText("Sales")).toBeInTheDocument()
    expect(screen.getByText("Revenue")).toBeInTheDocument()
  })

  it("renders color swatches for each item", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartLegendContent payload={legendPayload} />
      </ChartContainer>
    )
    expect(
      container.querySelectorAll("[class*='legendSwatch']").length
    ).toBe(2)
  })

  it("applies top padding class when verticalAlign='top'", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartLegendContent payload={legendPayload} verticalAlign="top" />
      </ChartContainer>
    )
    expect(
      container.querySelector("[class*='legendContentTop']")
    ).toBeInTheDocument()
  })

  it("applies bottom padding class when verticalAlign='bottom'", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartLegendContent payload={legendPayload} verticalAlign="bottom" />
      </ChartContainer>
    )
    expect(
      container.querySelector("[class*='legendContentBottom']")
    ).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <ChartContainer config={baseConfig}>
        <ChartLegendContent
          payload={legendPayload}
          className="custom-legend"
        />
      </ChartContainer>
    )
    expect(container.querySelector(".custom-legend")).toBeInTheDocument()
  })

  it("throws when used outside ChartContainer", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => {
      render(<ChartLegendContent payload={legendPayload} />)
    }).toThrow("useChart must be used within a <ChartContainer />")
    consoleSpy.mockRestore()
  })
})

describe("useChart", () => {
  it("throws when used outside ChartContainer", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    function TestComponent() {
      useChart()
      return null
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useChart must be used within a <ChartContainer />")

    consoleSpy.mockRestore()
  })

  it("returns config when used inside ChartContainer", () => {
    let capturedConfig: ChartConfig | undefined

    function TestComponent() {
      const { config } = useChart()
      capturedConfig = config
      return null
    }

    render(
      <ChartContainer config={baseConfig}>
        <TestComponent />
      </ChartContainer>
    )

    expect(capturedConfig).toEqual(baseConfig)
  })
})
