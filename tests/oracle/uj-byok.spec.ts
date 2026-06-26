// VI-562 — BYOK + AI seam CUJ. The keyless manual-tool path AND the key-active turbo path.
//
// Frozen golden-path testids (spec/INTERFACE.d.ts): bw-begin, bw-key-pill, bw-composer-input,
// bw-composer-send. The `bw-seam-*` / `bw-byok-*` testids are VI-562's OWN seam surface — the ticket
// the spec's R-KEYLESS NOTE explicitly tracks the keyless/AI seam to — namespaced so they never
// collide with the frozen static-thread ids above. The key-active provider call is mocked at the
// network layer (no real Anthropic call, no key leaves the test).

import { test, expect, type Page } from "@playwright/test"

const ROUTE = "/brand-workbench"

/** Land on Start and begin the interview → the strategy split-screen (where the Elicit seam lives). */
async function begin(page: Page) {
  await page.goto(ROUTE)
  await page.getByTestId("bw-begin").click()
}

/** Intercept the Anthropic Messages API with one canned challenge reply (no real network). */
async function mockChallenge(page: Page) {
  await page.route("**/api.anthropic.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              kind: "challenge",
              framing: "Is it actually only?",
              body: "Frontify hosts; Brandpad publishes — name a sharper wedge.",
              keepLabel: 'Use "compile"',
              rewriteLabel: "I'll rewrite it",
            }),
          },
        ],
        stop_reason: "end_turn",
      }),
    }),
  )
}

test.describe("UJ-BYOK — keyless manual path AND key-active turbo path (VI-562)", () => {
  test("keyless: full manual tool — lock a section with no key, no AI", async ({ page }) => {
    await begin(page)

    await expect(page.getByTestId("bw-key-pill")).toHaveAttribute("data-key-status", "keyless")
    const seam = page.getByTestId("bw-seam")
    await expect(seam).toHaveAttribute("data-key-status", "keyless")
    await expect(page.getByTestId("bw-seam-status")).toContainText("Manual")
    await expect(page.getByTestId("bw-seam-locked")).toHaveCount(0)

    await page.getByTestId("bw-seam-lock").click()
    await expect(page.getByTestId("bw-seam-locked")).toBeVisible()
  })

  test("BYOK panel: enter + store a key, see the cost estimate, flip to key-active", async ({
    page,
  }) => {
    await begin(page)
    await page.getByTestId("bw-key-pill").click()

    const panel = page.getByTestId("bw-byok")
    await expect(panel).toBeVisible()
    await expect(panel.getByTestId("bw-byok-cost")).toContainText("per turn")

    await panel.getByTestId("bw-byok-key-input").fill("sk-ant-test-key")
    await panel.getByTestId("bw-byok-save").click()

    await expect(page.getByTestId("bw-key-pill")).toHaveAttribute("data-key-status", "key-active")
  })

  test("key-active: composer drives a live challenge; section locks only after operator keep", async ({
    page,
  }) => {
    await mockChallenge(page)
    await begin(page)

    // Provide a key via the BYOK panel, then close it to reach the composer.
    await page.getByTestId("bw-key-pill").click()
    await page.getByTestId("bw-byok-key-input").fill("sk-ant-test-key")
    await page.getByTestId("bw-byok-save").click()
    await page.keyboard.press("Escape")

    await expect(page.getByTestId("bw-seam")).toHaveAttribute("data-key-status", "key-active")
    await expect(page.getByTestId("bw-seam-status")).toContainText("AI turbo")

    // Send → mocked provider returns an adversarial challenge.
    await page.getByTestId("bw-composer-input").fill("A design system you copy and own.")
    await page.getByTestId("bw-composer-send").click()

    await expect(page.getByTestId("bw-seam-challenge")).toBeVisible()
    // Human gate (D-7): the section does NOT advance until the operator explicitly resolves it.
    await expect(page.getByTestId("bw-seam-locked")).toHaveCount(0)

    await page.getByTestId("bw-seam-challenge-keep").click()
    await expect(page.getByTestId("bw-seam-locked")).toBeVisible()
  })

  test("keyless: sending in the composer fires no AI (provider never called)", async ({ page }) => {
    let called = false
    await page.route("**/api.anthropic.com/**", (route) => {
      called = true
      return route.abort()
    })
    await begin(page)

    await page.getByTestId("bw-composer-input").fill("does nothing without a key")
    await page.getByTestId("bw-composer-send").click()
    await expect(page.getByTestId("bw-seam-status")).toContainText("Manual")
    expect(called).toBe(false)
  })
})
