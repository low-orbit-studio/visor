import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type Locator, type Page } from "@playwright/test";

// VI-802: profile-menu's avatar trigger opens the menu in place on Popover's skin: solid in
// Today, Dark and Light; glass over the photo in Dark + Photo and Light + Photo. The ring takes
// the theme's key colour and the header the theme's ink.
//
// Theme-agnostic by default (a public build has no private themes). To review the Honcho kit:
//   VISOR_LOOK_THEME=honcho-backstage VISOR_LOOK_TODAY_THEME=honcho \
//   VISOR_LOOK_PHOTO_DARK=/night.webp VISOR_LOOK_PHOTO_LIGHT=/day.webp npx playwright test e2e/profile-menu.spec.ts
const THEME = process.env.VISOR_LOOK_THEME ?? "neutral";
const TODAY_THEME = process.env.VISOR_LOOK_TODAY_THEME ?? THEME;
const PHOTOS = { dark: process.env.VISOR_LOOK_PHOTO_DARK, light: process.env.VISOR_LOOK_PHOTO_LIGHT };
const RENDERS = resolve(__dirname, "../../../.visor/renders/vi-802");

const LOOKS = [
  { id: "today", label: "Today", mode: "light", photo: false },
  { id: "dark", label: "Dark", mode: "dark", photo: false },
  { id: "dark-photo", label: "Dark + Photo", mode: "dark", photo: true },
  { id: "light", label: "Light", mode: "light", photo: false },
  { id: "light-photo", label: "Light + Photo", mode: "light", photo: true },
] as const;

function lookUrl(look: (typeof LOOKS)[number]) {
  const query = new URLSearchParams({
    theme: look.id === "today" ? TODAY_THEME : THEME,
    look: look.id,
    mode: look.mode,
    specimen: "profile-menu",
  });
  const photo = look.photo ? PHOTOS[look.mode] : undefined;
  if (photo) query.set("photo", photo);
  return `/looks/panel?${query}`;
}

const style = (el: Locator, prop: string) => el.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p), prop);
/** Alpha of a computed colour (`rgba(…, a)` or `color(… / a)`); 1 when opaque. */
const alpha = (c: string) => {
  const m = c.match(/^rgba\(.*,\s*([\d.]+)\)$/) ?? c.match(/\/\s*([\d.]+)\)$/);
  return m ? Number(m[1]) : 1;
};
/** A custom property resolved to a computed colour, read where `el` sits. */
const tokenColor = (el: Locator, token: string) =>
  el.evaluate((n, t) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${t})`;
    n.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, token);

test("Profile menu avatar trigger: keyboard walk on the docs page", async ({ page }) => {
  await page.goto("/docs/blocks/profile-menu");
  const root = page.locator('[data-demo="profile-menu-top-bar"]').first();
  const trigger = root.getByRole("button", { name: /^Account menu/ });
  const menu = page.getByRole("menu");

  // Tab from the control just before the demo lands on the trigger; Enter opens. Retried
  // until hydration has wired the trigger.
  await expect(async () => {
    await root.evaluate((n) => {
      document.getElementById("vi-802-before")?.remove();
      const before = document.createElement("button");
      before.id = "vi-802-before";
      before.textContent = "Before";
      n.before(before);
      before.focus();
    });
    await page.keyboard.press("Tab");
    await expect(trigger).toBeFocused({ timeout: 500 });
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible({ timeout: 500 });
  }).toPass();

  const change = menu.getByRole("menuitem", { name: "Change Email" });
  const signOut = menu.getByRole("menuitem", { name: "Sign Out" });
  await expect(change).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(signOut).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

async function openLook(page: Page, look: (typeof LOOKS)[number]) {
  await page.goto(lookUrl(look));
  const panel = page.locator(`[data-slot="look-panel"][data-look="${look.id}"]`);
  await expect(panel).toHaveAttribute("data-mode", look.mode);
  const menu = panel.locator('[data-slot="dropdown-menu-content"][data-skin="popover"]');
  await expect(menu).toHaveAttribute("data-state", "open");
  // The open keyframes have finished.
  await expect.poll(() => style(menu, "opacity")).toBe("1");
  return { panel, menu, trigger: panel.locator('[data-slot="profile-menu-trigger"]') };
}

for (const width of [1440, 390]) {
  test(`Profile menu avatar trigger: five looks at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    mkdirSync(RENDERS, { recursive: true });

    for (const look of LOOKS) {
      const { panel, menu, trigger } = await openLook(page, look);

      // Rendered in place, inside the look, so the glass switch reaches it.
      await expect(panel.locator('[data-slot="profile-menu-layer"] [role="menu"]')).toHaveCount(1);
      await expect(menu.getByRole("menuitem", { name: "Change Email" })).toBeVisible();
      await expect(menu.getByRole("menuitem", { name: "Sign Out" })).toBeVisible();

      // Glass only in the Photo looks; solid and opaque elsewhere. The avatar is a glass
      // control over the photo, so its initials never sit on the bare photo.
      const filter = await style(menu, "backdrop-filter");
      const avatarFilter = await style(trigger.locator("> span > span").first(), "backdrop-filter");
      if (look.photo) {
        expect(filter).toContain("blur(");
        expect(avatarFilter).toContain("blur(");
      } else {
        expect(filter).toBe("none");
        expect(avatarFilter).toBe("none");
        expect(alpha(await style(menu, "background-color"))).toBe(1);
      }

      // The ring is the theme's key colour, the header name its ink.
      const primary = await tokenColor(trigger, "--primary");
      await expect.poll(() => style(trigger, "box-shadow")).toContain(primary);
      const name = menu.getByText("Sam Rivera", { exact: true });
      expect(await style(name, "color")).toBe(await tokenColor(name, "--text-primary"));

      // Rows sit softly in the panel (never a solid slab) and never touch.
      const rows = [menu.getByRole("menuitem", { name: "Change Email" }), menu.getByRole("menuitem", { name: "Sign Out" })];
      for (const row of rows) expect(alpha(await style(row, "background-color"))).toBeLessThan(1);
      const [a, b] = await Promise.all(rows.map((r) => r.boundingBox()));
      expect(b!.y - (a!.y + a!.height)).toBeGreaterThanOrEqual(8);

      if (width === 390) {
        const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
        expect(fits).toBe(true);
        const box = (await menu.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(900);
      }

      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `${RENDERS}/${look.id}-${width}.png`, animations: "disabled" });
    }
  });
}
