"use client"

import * as React from "react"
import { DownloadSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react"
import { cn } from "../../lib/utils"
import { Button, type ButtonProps } from "../../components/ui/button/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover/popover"
import {
  RadioGroup,
  RadioGroupItem,
} from "../../components/ui/radio-group/radio-group"
import { Checkbox } from "../../components/ui/checkbox/checkbox"
import { Label } from "../../components/ui/label/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip/tooltip"
import styles from "./export-menu.module.css"

export interface ExportFormat {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  disabledReason?: string
}

export interface ExportScope {
  key: string
  label: React.ReactNode
  defaultChecked?: boolean
  description?: React.ReactNode
}

export interface ExportMenuProps {
  /** Trigger label. @default "Export" */
  label?: React.ReactNode
  /** Trigger icon. @default <DownloadSimple /> */
  icon?: React.ReactNode
  /** Available export formats. */
  formats: ExportFormat[]
  /** Optional scope toggles (e.g., "Include archived", "Include suspended"). */
  scopes?: ExportScope[]
  /** Submit handler — receives selected format + scope state. */
  onExport: (
    format: string,
    scopes: Record<string, boolean>
  ) => void | Promise<void>
  /** Trigger variant. @default "secondary" */
  triggerVariant?: "primary" | "secondary" | "ghost"
  /** Override the popover header text. Defaults to the trigger `label`. */
  heading?: React.ReactNode
  /** Forwarded to the trigger button. */
  className?: string
}

const TRIGGER_VARIANT_MAP: Record<
  NonNullable<ExportMenuProps["triggerVariant"]>,
  NonNullable<ButtonProps["variant"]>
> = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
}

export function ExportMenu({
  label = "Export",
  icon = <DownloadSimpleIcon size={16} weight="regular" />,
  formats,
  scopes,
  onExport,
  triggerVariant = "secondary",
  heading,
  className,
}: ExportMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const initialFormat = React.useMemo(() => {
    const firstEnabled = formats.find((f) => !f.disabled)
    return firstEnabled?.value ?? formats[0]?.value ?? ""
  }, [formats])

  const initialScopeState = React.useMemo(() => {
    const init: Record<string, boolean> = {}
    for (const s of scopes ?? []) {
      init[s.key] = s.defaultChecked ?? false
    }
    return init
  }, [scopes])

  const [selectedFormat, setSelectedFormat] = React.useState(initialFormat)
  const [scopeState, setScopeState] =
    React.useState<Record<string, boolean>>(initialScopeState)

  // Reset state each time the popover opens fresh.
  React.useEffect(() => {
    if (open) {
      setSelectedFormat(initialFormat)
      setScopeState(initialScopeState)
    }
  }, [open, initialFormat, initialScopeState])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (submitting && !next) return
      setOpen(next)
    },
    [submitting]
  )

  const handleExport = React.useCallback(async () => {
    if (!selectedFormat) return
    const result = onExport(selectedFormat, scopeState)
    if (result && typeof (result as Promise<void>).then === "function") {
      setSubmitting(true)
      try {
        await result
        setSubmitting(false)
        setOpen(false)
      } catch (err) {
        // Keep the popover open so the user can retry; clear pending state
        // and re-throw so consumer error handling (toast, etc.) can surface
        // the failure.
        setSubmitting(false)
        throw err
      }
    } else {
      setOpen(false)
    }
  }, [onExport, selectedFormat, scopeState])

  const handleContentKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter") return
      if (submitting) return
      const target = event.target as HTMLElement | null
      // Footer buttons handle Enter natively — let the browser fire them.
      if (target?.closest('[data-slot="export-menu-cancel"]')) return
      if (target?.closest('[data-slot="export-menu-submit"]')) return
      event.preventDefault()
      handleExport()
    },
    [submitting, handleExport]
  )

  const buttonVariant = TRIGGER_VARIANT_MAP[triggerVariant]
  const headerText = heading ?? label

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          aria-haspopup="dialog"
          className={cn(styles.trigger, className)}
          data-slot="export-menu-trigger"
        >
          {icon ? (
            <span className={styles.triggerIcon} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className={styles.triggerLabel}>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        role="dialog"
        aria-label={typeof headerText === "string" ? headerText : "Export"}
        className={styles.content}
        data-slot="export-menu-content"
        onKeyDown={handleContentKeyDown}
      >
        <TooltipProvider delayDuration={200}>
          <div className={styles.header} data-slot="export-menu-header">
            {headerText}
          </div>

          <RadioGroup
            value={selectedFormat}
            onValueChange={setSelectedFormat}
            className={styles.formatList}
          >
            {formats.map((fmt) => {
              const itemId = `export-fmt-${fmt.value}`
              const row = (
                <div
                  className={styles.formatRow}
                  data-disabled={fmt.disabled || undefined}
                  data-slot="export-menu-format"
                  data-value={fmt.value}
                >
                  <RadioGroupItem
                    id={itemId}
                    value={fmt.value}
                    disabled={fmt.disabled}
                  />
                  <Label htmlFor={itemId} className={styles.formatLabel}>
                    {fmt.icon ? (
                      <span className={styles.formatIcon} aria-hidden="true">
                        {fmt.icon}
                      </span>
                    ) : null}
                    <span className={styles.formatLabelText}>
                      <span className={styles.formatLabelMain}>
                        {fmt.label}
                      </span>
                      {fmt.description ? (
                        <span className={styles.formatDescription}>
                          {fmt.description}
                        </span>
                      ) : null}
                    </span>
                  </Label>
                </div>
              )

              if (fmt.disabled && fmt.disabledReason) {
                return (
                  <Tooltip key={fmt.value}>
                    <TooltipTrigger asChild>{row}</TooltipTrigger>
                    <TooltipContent side="left">
                      {fmt.disabledReason}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return <React.Fragment key={fmt.value}>{row}</React.Fragment>
            })}
          </RadioGroup>

          {scopes && scopes.length > 0 ? (
            <div
              className={styles.scopeSection}
              data-slot="export-menu-scopes"
            >
              {scopes.map((scope) => {
                const scopeId = `export-scope-${scope.key}`
                const checked = scopeState[scope.key] ?? false
                return (
                  <div key={scope.key} className={styles.scopeRow}>
                    <Checkbox
                      id={scopeId}
                      checked={checked}
                      onCheckedChange={(next) =>
                        setScopeState((s) => ({
                          ...s,
                          [scope.key]: next === true,
                        }))
                      }
                      data-slot="export-menu-scope"
                    />
                    <Label htmlFor={scopeId} className={styles.scopeLabel}>
                      <span className={styles.scopeLabelMain}>
                        {scope.label}
                      </span>
                      {scope.description ? (
                        <span className={styles.scopeDescription}>
                          {scope.description}
                        </span>
                      ) : null}
                    </Label>
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className={styles.footer} data-slot="export-menu-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              data-slot="export-menu-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleExport}
              disabled={submitting || !selectedFormat}
              aria-busy={submitting || undefined}
              data-slot="export-menu-submit"
              className={styles.submitButton}
            >
              {submitting ? (
                <SpinnerGapIcon
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                  className={styles.spinner}
                  data-slot="export-menu-spinner"
                />
              ) : null}
              <span>Export</span>
            </Button>
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  )
}

export function defaultExportFormats(): ExportFormat[] {
  return [
    {
      value: "csv",
      label: "CSV",
      description: "Comma-separated values, opens in Excel",
    },
    {
      value: "json",
      label: "JSON",
      description: "Structured data for developers",
    },
    {
      value: "pdf",
      label: "PDF",
      description: "Printable document",
    },
  ]
}
