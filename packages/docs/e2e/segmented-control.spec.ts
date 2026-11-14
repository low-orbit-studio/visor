import { test, expect } from "@playwright/test";

// VI-777: arrow keys move focus between segments in a real browser (the jsdom
// test in components/ui/segmented-control/__tests__ passes the same keys).
test("SegmentedControl: arrows move focus along the group and Space selects", async ({ page }) => {
  await page.goto("/docs/components/form/segmented-control");
  const group = page.getByRole("radiogroup", { name: "Payment status" }).first();
  const unpaid = group.getByRole("radio", { name: "Unpaid", exact: true });
  const paid = group.getByRole("radio", { name: "Paid", exact: true });
  const any = group.getByRole("radio", { name: "Any", exact: true });

  await unpaid.focus();
  await page.keyboard.press("ArrowRight");
  await expect(paid).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(any).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(paid).toBeFocused();

  await page.keyboard.press("Space");
  await expect(paid).toHaveAttribute("aria-checked", "true");
});
