"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import type {
  ValueType,
  NameType,
  Formatter,
} from "recharts/types/component/DefaultTooltipContent"
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent"
import type { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent"
import { cn } from "../../../lib/utils"
import styles from "./chart.module.css"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(styles.container, className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme || itemConfig.color
  )

  if (!colorConfig.length) {
    return null
  }

  // NOTE: dangerouslySetInnerHTML injects scoped CSS custom property overrides
  // (e.g. --color-sales: #4f46e5) from the consumer-supplied ChartConfig.
  // Values come from developer-controlled config, not from user-generated input.
  const cssText = Object.entries(THEMES)
    .map(
      ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join("\n")}
}
`
    )
    .join("\n")

  return <style dangerouslySetInnerHTML={{ __html: cssText }} />
}

const ChartTooltip = RechartsPrimitive.Tooltip

export type TooltipPayloadItem = {
  name?: NameType
  dataKey?: string | number
  value?: ValueType
  color?: string
  fill?: string
  type?: string
  payload?: Record<string, unknown>
}

export interface ChartTooltipContentProps
  extends React.ComponentProps<"div"> {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: React.ReactNode
  labelFormatter?: (
    label: React.ReactNode,
    payload: TooltipPayloadItem[]
  ) => React.ReactNode
  formatter?: Formatter<ValueType, NameType>
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  labelClassName?: string
  color?: string
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn(styles.tooltipLabel, labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return (
      <div className={cn(styles.tooltipLabel, labelClassName)}>{value}</div>
    )
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div className={cn(styles.tooltipContent, className)}>
      {!nestLabel ? tooltipLabel : null}
      <div className={styles.tooltipItems}>
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill as string | undefined || item.color

            const indicatorClass = cn(
              styles.indicator,
              indicator === "dot" && styles.indicatorDot,
              indicator === "line" && styles.indicatorLine,
              indicator === "dashed" && styles.indicatorDashed
            )

            return (
              <div key={item.dataKey as string} className={styles.tooltipItem}>
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item as Parameters<Formatter>[2], index, [])
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={indicatorClass}
                          style={
                            {
                              "--color-indicator-bg": indicatorColor,
                              "--color-border-bg": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div className={styles.tooltipItemContent}>
                      <div className={styles.tooltipItemLabels}>
                        {nestLabel ? (
                          <div className={styles.tooltipNestLabel}>
                            {tooltipLabel}
                          </div>
                        ) : null}
                        <span className={styles.tooltipName}>
                          {itemConfig?.label || (item.name as string)}
                        </span>
                      </div>
                      {item.value !== undefined && (
                        <span className={styles.tooltipValue}>
                          {typeof item.value === "number"
                            ? item.value.toLocaleString()
                            : item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

export interface ChartLegendContentProps
  extends React.ComponentProps<"div"> {
  hideIcon?: boolean
  payload?: LegendPayload[]
  verticalAlign?: VerticalAlignmentType
  nameKey?: string
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: ChartLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        styles.legendContent,
        verticalAlign === "top"
          ? styles.legendContentTop
          : styles.legendContentBottom,
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div key={item.value} className={styles.legendItem}>
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className={styles.legendSwatch}
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

ChartLegendContent.displayName = "ChartLegendContent"

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  useChart,
}
