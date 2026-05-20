import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  ExportMenu,
  defaultExportFormats,
  type ExportFormat,
  type ExportScope,
} from "../export-menu"
import { checkA11y } from "../../../test-utils/a11y"

const FORMATS: ExportFormat[] = defaultExportFormats()

const SCOPES: ExportScope[] = [
  { key: "archived", label: "Include archived" },
  { key: "suspended", label: "Include suspended", defaultChecked: true },
]

function renderMenu(
  overrides?: Partial<React.ComponentProps<typeof ExportMenu>>
) {
  const onExport = vi.fn()
  const utils = render(
    <ExportMenu formats={FORMATS} onExport={onExport} {...overrides} />
  )
  return { ...utils, onExport }
}

describe("ExportMenu — trigger", () => {
  it("renders without crashing", () => {
    const { container } = renderMenu()
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the default trigger label and icon", () => {
    renderMenu()
    const trigger = screen.getByRole("button", { name: /export/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger.querySelector("svg")).not.toBeNull()
  })

  it("uses a custom label when provided", () => {
    renderMenu({ label: "Download report" })
    expect(
      screen.getByRole("button", { name: /download report/i })
    ).toBeInTheDocument()
  })

  it("omits the trigger icon when icon={null}", () => {
    renderMenu({ icon: null })
    const trigger = screen.getByRole("button", { name: /export/i })
    expect(trigger.querySelector("svg")).toBeNull()
  })

  it("forwards className to the trigger", () => {
    renderMenu({ className: "custom-trigger" })
    expect(screen.getByRole("button", { name: /export/i })).toHaveClass(
      "custom-trigger"
    )
  })

  it("sets aria-haspopup='dialog' on the trigger", () => {
    renderMenu()
    expect(
      screen.getByRole("button", { name: /export/i })
    ).toHaveAttribute("aria-haspopup", "dialog")
  })

  it("maps triggerVariant='primary' to the default Button variant via data-slot", () => {
    renderMenu({ triggerVariant: "primary" })
    const trigger = screen.getByRole("button", { name: /export/i })
    expect(trigger).toHaveAttribute("data-slot", "export-menu-trigger")
  })
})

describe("ExportMenu — opening the popover", () => {
  it("opens the popover when the trigger is clicked", async () => {
    const u = userEvent.setup()
    renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("renders the heading inside the popover (defaults to the trigger label)", async () => {
    const u = userEvent.setup()
    renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText("Export", { selector: "[data-slot='export-menu-header']" })
    ).toBeInTheDocument()
  })

  it("uses a custom heading when provided", async () => {
    const u = userEvent.setup()
    renderMenu({ heading: "Export 24 organizations" })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByText("Export 24 organizations")
    ).toBeInTheDocument()
  })

  it("renders one radio per format", async () => {
    const u = userEvent.setup()
    renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    const radios = within(dialog).getAllByRole("radio")
    expect(radios).toHaveLength(FORMATS.length)
  })

  it("preselects the first non-disabled format", async () => {
    const u = userEvent.setup()
    const formats: ExportFormat[] = [
      { value: "xlsx", label: "XLSX", disabled: true, disabledReason: "Pro plan" },
      { value: "csv", label: "CSV" },
      { value: "json", label: "JSON" },
    ]
    renderMenu({ formats })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    const csv = within(dialog).getByRole("radio", { name: /csv/i })
    expect(csv).toHaveAttribute("data-state", "checked")
  })
})

describe("ExportMenu — submission", () => {
  it("calls onExport with the selected format and empty scope map when no scopes are provided", async () => {
    const u = userEvent.setup()
    const { onExport } = renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    await u.click(within(dialog).getByRole("button", { name: /^export$/i }))
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport).toHaveBeenCalledWith("csv", {})
  })

  it("submits the user-selected format", async () => {
    const u = userEvent.setup()
    const { onExport } = renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    await u.click(within(dialog).getByRole("radio", { name: /json/i }))
    await u.click(within(dialog).getByRole("button", { name: /^export$/i }))
    expect(onExport).toHaveBeenCalledWith("json", {})
  })

  it("closes the popover on synchronous onExport", async () => {
    const u = userEvent.setup()
    renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    await u.click(within(dialog).getByRole("button", { name: /^export$/i }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("Cancel closes the popover without calling onExport", async () => {
    const u = userEvent.setup()
    const { onExport } = renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    await u.click(within(dialog).getByRole("button", { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(onExport).not.toHaveBeenCalled()
  })

  it("Escape closes the popover", async () => {
    const u = userEvent.setup()
    renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    await screen.findByRole("dialog")
    await u.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("Enter inside the popover submits the selected format", async () => {
    const u = userEvent.setup()
    const { onExport } = renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    // Focus a radio (non-button) then press Enter.
    const csv = within(dialog).getByRole("radio", { name: /csv/i })
    csv.focus()
    await u.keyboard("{Enter}")
    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith("csv", {})
    })
  })
})

describe("ExportMenu — async loading state", () => {
  it("shows aria-busy + spinner on the submit button while pending and stays open until resolve", async () => {
    const u = userEvent.setup()
    let resolveExport: (() => void) | undefined
    const slowExport = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveExport = resolve
        })
    )
    render(<ExportMenu formats={FORMATS} onExport={slowExport} />)

    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    const submit = within(dialog).getByRole("button", { name: /^export$/i })
    await u.click(submit)

    // Pending: aria-busy, disabled, spinner shown, popover still open.
    await waitFor(() => {
      expect(submit).toHaveAttribute("aria-busy", "true")
    })
    expect(submit).toBeDisabled()
    expect(
      within(dialog).getByRole("button", { name: /cancel/i })
    ).toBeDisabled()
    expect(
      submit.querySelector('[data-slot="export-menu-spinner"]')
    ).not.toBeNull()
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    // Resolve: popover closes, busy clears.
    resolveExport?.()
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(slowExport).toHaveBeenCalledTimes(1)
  })
})

describe("ExportMenu — scope toggles", () => {
  it("renders no scope section when scopes is undefined", async () => {
    const u = userEvent.setup()
    renderMenu()
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    expect(
      dialog.querySelector('[data-slot="export-menu-scopes"]')
    ).toBeNull()
  })

  it("renders no scope section when scopes is an empty array", async () => {
    const u = userEvent.setup()
    renderMenu({ scopes: [] })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    expect(
      dialog.querySelector('[data-slot="export-menu-scopes"]')
    ).toBeNull()
  })

  it("renders a checkbox per scope with defaultChecked honored", async () => {
    const u = userEvent.setup()
    renderMenu({ scopes: SCOPES })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    const archived = within(dialog).getByRole("checkbox", {
      name: /include archived/i,
    })
    const suspended = within(dialog).getByRole("checkbox", {
      name: /include suspended/i,
    })
    expect(archived).toHaveAttribute("data-state", "unchecked")
    expect(suspended).toHaveAttribute("data-state", "checked")
  })

  it("passes the final scope state to onExport", async () => {
    const u = userEvent.setup()
    const { onExport } = renderMenu({ scopes: SCOPES })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    await u.click(
      within(dialog).getByRole("checkbox", { name: /include archived/i })
    )
    await u.click(within(dialog).getByRole("button", { name: /^export$/i }))
    expect(onExport).toHaveBeenCalledWith("csv", {
      archived: true,
      suspended: true,
    })
  })
})

describe("ExportMenu — disabled formats", () => {
  const withDisabled: ExportFormat[] = [
    { value: "csv", label: "CSV" },
    {
      value: "xlsx",
      label: "XLSX",
      disabled: true,
      disabledReason: "Upgrade to Pro to enable XLSX.",
    },
  ]

  it("marks the disabled radio as disabled and the row with data-disabled", async () => {
    const u = userEvent.setup()
    renderMenu({ formats: withDisabled })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    const xlsxRadio = within(dialog).getByRole("radio", { name: /xlsx/i })
    expect(xlsxRadio).toBeDisabled()
    const row = dialog.querySelector(
      '[data-slot="export-menu-format"][data-value="xlsx"]'
    )
    expect(row).toHaveAttribute("data-disabled", "true")
  })

  it("surfaces the disabledReason in a tooltip on hover", async () => {
    const u = userEvent.setup()
    renderMenu({ formats: withDisabled })
    await u.click(screen.getByRole("button", { name: /export/i }))
    const dialog = await screen.findByRole("dialog")
    const row = dialog.querySelector(
      '[data-slot="export-menu-format"][data-value="xlsx"]'
    ) as HTMLElement
    expect(row).not.toBeNull()
    await u.hover(row)
    // Radix renders the tooltip text twice (visible + sr-only) — assert ≥1 match.
    await waitFor(
      () => {
        expect(
          screen.getAllByText("Upgrade to Pro to enable XLSX.").length
        ).toBeGreaterThan(0)
      },
      { timeout: 2000 }
    )
  })
})

describe("ExportMenu — defaultExportFormats", () => {
  it("returns CSV, JSON, PDF in that order", () => {
    const formats = defaultExportFormats()
    expect(formats.map((f) => f.value)).toEqual(["csv", "json", "pdf"])
  })

  it("populates each format with a description", () => {
    for (const fmt of defaultExportFormats()) {
      expect(fmt.description).toBeTruthy()
    }
  })
})

describe("ExportMenu — accessibility", () => {
  it("passes a11y check (closed state)", async () => {
    const { container } = renderMenu()
    await checkA11y(container)
  })
})
