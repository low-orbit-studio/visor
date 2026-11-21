import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { OfflineBanner } from "../offline-banner"
import styles from "../offline-banner.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

// VI-801: the pill variant, the compact status Honcho's top bar carries.
const css = readFileSync(join(process.cwd(), "components/ui/offline-banner/offline-banner.module.css"), "utf-8")

describe("OfflineBanner pill", () => {
  it("renders the pill with its detail, read out as one status", () => {
    render(<OfflineBanner networkState="offline" variant="pill" detail="saved 9PM" />)
    const root = screen.getByRole("status")
    expect(root).toHaveAttribute("data-variant", "pill")
    expect(root).toHaveClass(styles.pill)
    expect(root).not.toHaveClass(styles.banner)
    expect(root).toHaveTextContent("Offline · saved 9PM")
    expect(root).not.toHaveAttribute("aria-label")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("keeps the aria-label when there is no detail", () => {
    render(<OfflineBanner networkState="offline" variant="pill" />)
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Offline")
  })

  it("shows Retry only when onRetry is passed", () => {
    render(<OfflineBanner networkState="offline" variant="pill" detail="saved 9PM" onRetry={() => {}} />)
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
  })

  it("keeps the reconnecting and restored labels", () => {
    const { rerender } = render(<OfflineBanner networkState="reconnecting" variant="pill" />)
    expect(screen.getByRole("status")).toHaveTextContent("Reconnecting…")
    rerender(<OfflineBanner networkState="restored" variant="pill" />)
    expect(screen.getByRole("status")).toHaveTextContent("Back online")
  })

  it("renders nothing when online", () => {
    const { container } = render(<OfflineBanner networkState="online" variant="pill" detail="saved 9PM" />)
    expect(container.firstChild).toBeNull()
  })

  it("has no accessibility violations", async () => {
    const { container } = render(<OfflineBanner networkState="offline" variant="pill" detail="saved 9PM" />)
    await checkA11y(container)
  })

  it("is solid unless the glass switch is on", () => {
    const pill = css.match(/\.pill \{[^}]*\}/)![0]
    expect(pill).toContain("var(--glass-on-control-fill, var(--offline-banner-pill-bg, var(--surface-muted, #f3f4f6)))")
    expect(pill).toContain("var(--glass-on-control-ring, var(--offline-banner-pill-border, var(--border-default, #e5e7eb)))")
    expect(pill).toContain("var(--glass-on-control-ink, var(--offline-banner-pill-text-color, var(--text-primary, #111827)))")
    // Prefixed line first, so Lightning CSS keeps both (VI-788).
    expect(pill.indexOf("-webkit-backdrop-filter: var(--glass-on-control-blur, none)")).toBeLessThan(
      pill.indexOf("\n  backdrop-filter: var(--glass-on-control-blur, none)"),
    )
  })
})

describe("OfflineBanner default variant", () => {
  it("renders the banner exactly as before", () => {
    const { container } = render(<OfflineBanner networkState="offline" onRetry={() => {}} />)
    expect(container.innerHTML).toMatchSnapshot()
  })

  it("adds no data-variant to the banner", () => {
    render(<OfflineBanner networkState="offline" />)
    expect(screen.getByRole("status")).not.toHaveAttribute("data-variant")
  })
})
