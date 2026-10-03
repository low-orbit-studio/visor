/**
 * Dates are calendar dates, not instants (VI-669).
 *
 * A process cannot change its own time zone reliably at runtime (vitest workers
 * keep the zone they were started with), so each zone runs in a child vitest
 * started with TZ set. The child re-runs this file with MC_TZ set and asserts
 * the zone really took effect before checking the component.
 */
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { render } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import { MonthCalendar } from "../month-calendar"

// [zone, span start, span end, weekday column of the 1st of that month]
const ZONES: Array<[string, string, string, number]> = [
  ["Pacific/Auckland", "2026-04-04", "2026-04-06", 3], // NZ DST ends 5 Apr; 1 Apr is a Wednesday
  ["America/Los_Angeles", "2026-03-07", "2026-03-09", 0], // US DST starts 8 Mar; 1 Mar is a Sunday
]

const child = process.env.MC_TZ

if (!child) {
  describe("MonthCalendar under a non-UTC time zone (child run)", () => {
    for (const [zone] of ZONES) {
      it(`${zone}: a stay keeps its days`, () => {
        const pkgPath = createRequire(join(process.cwd(), "package.json")).resolve("vitest/package.json")
        const vitest = join(dirname(pkgPath), JSON.parse(readFileSync(pkgPath, "utf-8")).bin.vitest)
        const run = spawnSync(process.execPath, [vitest, "run", join(process.cwd(), "blocks/month-calendar/__tests__/month-calendar-tz.test.tsx")], {
          env: { ...process.env, TZ: zone, MC_TZ: zone },
          encoding: "utf-8",
        })
        expect(run.stdout + run.stderr).toContain("passed")
        expect(run.status).toBe(0)
      }, 120_000)
    }
  })
} else {
  const [, start, end, firstColumn] = ZONES.find(([z]) => z === child)!

  describe(`MonthCalendar in ${child}`, () => {
    it("really runs in that zone", () => {
      expect(new Date(2026, 5, 1).getTimezoneOffset()).not.toBe(0)
    })

    it("a stay keeps its days", () => {
      const month = start.slice(0, 7) + "-01"
      const { container } = render(
        <MonthCalendar
          month={month}
          onSelectDate={vi.fn()}
          events={[{ id: "s", start, end, title: "Stay" }]}
        />
      )
      const covered = Array.from(
        container.querySelectorAll<HTMLElement>('[data-slot="month-calendar-day"]')
      )
        .filter((c) => /Stay, day/.test(c.querySelector("button")!.getAttribute("aria-label")!))
        .map((c) => c.getAttribute("data-date"))
      const middle = `${start.slice(0, 8)}${String(Number(start.slice(8)) + 1).padStart(2, "0")}`
      expect(covered).toEqual([start, middle, end])
      const first = container.querySelector('[data-slot="month-calendar-day"]:not([data-outside])')!
      expect(first.getAttribute("data-date")).toBe(month)
      expect(
        Array.from(first.parentElement!.querySelectorAll('[role="gridcell"]')).indexOf(first as HTMLElement)
      ).toBe(firstColumn)
    })

    it("a Date prop reads local calendar fields; a date string never goes through Date", () => {
      const { getByText, container } = render(
        <MonthCalendar
          month={new Date(2026, 6, 15)}
          today={new Date(2026, 6, 1)}
          selectedDate="2026-07-31"
          onSelectDate={vi.fn()}
        />
      )
      expect(getByText("July 2026")).toBeInTheDocument()
      expect(container.querySelector('[data-today="true"]')!.getAttribute("data-date")).toBe("2026-07-01")
      expect(container.querySelector('[data-selected="true"]')!.getAttribute("data-date")).toBe("2026-07-31")
    })
  })
}
