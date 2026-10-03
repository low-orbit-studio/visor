// @vitest-environment node
/**
 * VI-677 - with pencil={false}, the focus ring is drawn around the text button's
 * box, and the capitals sit in the middle of it (|offset| <= 0.25 CSS px), on the
 * real blacklight-app, blackout and neutral themes, at 14px, 14px muted and 21px.
 * Measured on pixels with the VI-682 helper. Skips where Chromium or esbuild is missing.
 */
import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { run } from "../../../../scripts/measure-inline-edit-ink"

async function chromiumAvailable(): Promise<boolean> {
  try {
    const pw = (await import("playwright")) as unknown as Record<string, { executablePath(): string }>
    await import("esbuild")
    return existsSync(pw.chromium.executablePath())
  } catch {
    return false
  }
}
const CHROMIUM = await chromiumAvailable()

describe.skipIf(!CHROMIUM)("InlineEdit pencil={false} ring centring (VI-677)", () => {
  it("centres the capitals in the ring on every theme and size", async () => {
    const { out } = await run()
    expect(out).toHaveLength(9)
    for (const r of out) expect(Math.abs(r.offset), `${r.theme} ${r.id}`).toBeLessThanOrEqual(0.25 + 1e-3)
  }, 120_000)
})
