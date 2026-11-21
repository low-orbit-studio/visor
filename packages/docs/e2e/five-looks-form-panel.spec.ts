import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-829: in the photo looks, every form control sits on a glass form panel, never straight on
// the photo; the photo is a real one (a private theme's photos/{dark,light}.*) wherever the private
// themes are installed; stacked tiles keep a real gap; and the plain looks draw no panel at all.
// The stock theme CI has; LOOKS_THEME=honcho-backstage draws the kit's looks locally.
const THEME = process.env.LOOKS_THEME ?? "neutral";
// Every specimen with form controls or tiles (the spinner has neither). Add new ones here.
const SPECIMENS = ["theme", "button", "number-input", "alert", "glass", "key-value-list"];
const PHOTO_LOOKS = [
  { id: "dark-photo", mode: "dark" },
  { id: "light-photo", mode: "light" },
] as const;
const MIN_TILE_GAP = 12;

/** What a photo look draws: its controls off a panel, its backdrop and the gaps between stacked tiles. */
const probe = (frame: Frame) =>
  frame.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-slot="look-panel"]')!;
    // A panel draws its glass on an aria-hidden layer among its children (the glass recipe).
    const isPanel = (el: Element) =>
      [...el.children].some(
        (k) => k.getAttribute("aria-hidden") === "true" && getComputedStyle(k).backdropFilter.includes("blur("),
      );
    const controls = root.querySelectorAll(
      'input, button, textarea, select, [data-slot="alert"], [role="switch"], [role="radio"], [role="checkbox"]',
    );
    const bare: string[] = [];
    for (const control of controls) {
      let el: Element | null = control;
      while (el && el !== root && !isPanel(el)) el = el.parentElement;
      if (!el || el === root) bare.push(control.outerHTML.slice(0, 120));
    }
    // Tiles: glass panels, plus the surfaces that carry their own glass (alerts, the Facts panel).
    const tiles = [...root.querySelectorAll("*")].filter(
      (el) => isPanel(el) || el.matches('[data-slot="alert"], [data-demo="facts"]'),
    );
    const gaps: { gap: number; a: string; b: string }[] = [];
    for (const a of tiles) {
      for (const b of tiles) {
        if (a === b || a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const sideBySide = rb.left >= ra.right || ra.left >= rb.right;
        if (sideBySide || rb.top < ra.top) continue;
        gaps.push({ gap: rb.top - ra.bottom, a: a.className.toString(), b: b.className.toString() });
      }
    }
    // A panel the look's frame cuts off: its bottom or right edge past the viewport.
    const clipped = tiles
      .map((t) => t.getBoundingClientRect())
      .filter((r) => r.bottom > window.innerHeight + 0.5 || r.right > window.innerWidth + 0.5).length;
    return { controls: controls.length, bare, gaps, clipped, backdrop: getComputedStyle(root).backgroundImage };
  });

async function privateThemesInstalled(page: Page) {
  return (await page.request.get("/themes/private")).status() === 200;
}

function expectOnPanels(look: (typeof PHOTO_LOOKS)[number], result: Awaited<ReturnType<typeof probe>>, real: boolean) {
  expect(result.controls).toBeGreaterThan(0);
  expect(result.bare).toEqual([]);
  for (const g of result.gaps) expect(g.gap, `${g.a} → ${g.b}`).toBeGreaterThanOrEqual(MIN_TILE_GAP);
  expect(result.clipped, "panels cut off by the frame").toBe(0);
  if (real) {
    // A real photo for the tone, never the gradient stand-in.
    expect(result.backdrop).toContain(`/photos/${look.mode}.`);
    expect(result.backdrop).not.toContain("data:image/svg");
  }
}

for (const width of [1440, 390]) {
  test(`Form panel: every specimen's controls sit on glass in the photo looks at ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const real = await privateThemesInstalled(page);
    for (const specimen of SPECIMENS) {
      for (const look of PHOTO_LOOKS) {
        await page.goto(`/looks/panel?theme=${THEME}&look=${look.id}&specimen=${specimen}`);
        await expect(page.locator(`body.${THEME}-theme`)).toHaveCount(1);
        await expect(page.locator('[data-slot="look-panel"]')).toHaveAttribute("data-glass", "on");
        expectOnPanels(look, await probe(page.mainFrame()), real);
      }
    }
  });
}

test("Form panel: the plain looks draw no panel, so they are unchanged", async ({ page }) => {
  for (const specimen of ["theme", "button", "number-input"]) {
    for (const look of ["today", "dark", "light"]) {
      await page.goto(`/looks/panel?theme=${THEME}&look=${look}&specimen=${specimen}`);
      await expect(page.locator(`body.${THEME}-theme`)).toHaveCount(1);
      const panel = page.locator('[data-slot="look-form-panel"]');
      await expect(panel).toHaveCSS("padding-top", "0px");
      await expect(panel).toHaveCSS("position", "static");
      await expect(panel.locator('[data-slot="glass-layer"]')).toHaveCSS("display", "none");
    }
  }
});

// The grids the operator reviews: Honcho's five looks, and two components' In Five Looks grids.
const GRIDS = [
  { path: "/themes/private", theme: "honcho-backstage", private: true },
  { path: "/docs/components/form/number-input", theme: THEME, private: false },
  { path: "/docs/components/general/button", theme: THEME, private: false },
];

for (const grid of GRIDS) for (const width of [1440, 390]) {
  test(`Form panel: ${grid.path} photo looks put their controls on glass at ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const real = await privateThemesInstalled(page);
    test.skip(grid.private && !real, "the private themes are not installed");
    await page.addInitScript((theme) => localStorage.setItem("visor-theme", theme), THEME);
    await page.goto(grid.path);
    for (const look of PHOTO_LOOKS) {
      const iframe = page.locator(`[data-slot="five-looks"] [data-look="${look.id}"] iframe`);
      await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${grid.theme}`), { timeout: 20_000 });
      await expect(async () => {
        const frame = (await (await iframe.elementHandle())!.contentFrame())!;
        expect(frame.url()).toContain(`theme=${grid.theme}`);
        await frame.waitForSelector(`body.${grid.theme}-theme [data-slot="look-panel"][data-glass="on"]`);
        expectOnPanels(look, await probe(frame), real);
      }).toPass({ timeout: 20_000 });
    }
  });
}

// Honcho's looks as the operator reviews them (/themes/private): Today on honcho, the rest on
// honcho-backstage. Every look's computed styles are checked: Satoshi only (no Montserrat, Arny Sans
// or BBB DM Sans), every button a squircle, Today's key colour #ff2d8a, no outline-only button over a
// photo, and every button's ink measured against the pixels behind it (text 4.5:1, icon 3:1).
const HONCHO_LOOKS = [
  { theme: "honcho", look: "today", mode: "light" },
  { theme: "honcho-backstage", look: "dark", mode: "dark" },
  { theme: "honcho-backstage", look: "dark-photo", mode: "dark" },
  { theme: "honcho-backstage", look: "light", mode: "light" },
  { theme: "honcho-backstage", look: "light-photo", mode: "light" },
] as const;
const RETIRED_FONTS = /montserrat|arny sans|bbb dm sans/i;

/** A button's ink and where it sits, with its ink hidden so a screenshot shows only what is behind it. */
const readButtons = (frame: Frame) =>
  frame.evaluate(() => {
    const toRgba = (color: string) => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    return [...document.querySelectorAll<HTMLElement>('[data-slot="look-panel"] button')].map((button, i) => {
      button.dataset.audit = String(i);
      const label = [...button.querySelectorAll<HTMLElement>('[data-slot="button-text"], span, div')].find(
        (el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()),
      );
      const text = !!label && label.getBoundingClientRect().width > 1;
      const target = text ? label! : (button.querySelector("svg") ?? button);
      const r = target.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      const style = getComputedStyle(button);
      // A wash: the button's own fill or glass, or a filled control it belongs to (a stepper's
      // field), found before the panel it sits on. Reaching the panel first means a bare edge.
      const isPanel = (el: Element) =>
        [...el.children].some((k) => k.getAttribute("aria-hidden") === "true" && getComputedStyle(k).backdropFilter.includes("blur("));
      let wash = false;
      for (let el: HTMLElement | null = button; el && el.dataset.slot !== "look-panel"; el = el.parentElement) {
        if (getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)" || (el === button && isPanel(el))) {
          wash = true;
          break;
        }
        if (isPanel(el)) break;
      }
      return {
        wash,
        index: i,
        name: (button.getAttribute("aria-label") ?? button.textContent ?? "").trim().slice(0, 40),
        kind: text ? "text" : "icon",
        ink: toRgba(getComputedStyle(target === button ? button : target).color),
        clip: { x: r.x - b.x, y: r.y - b.y, width: r.width, height: r.height },
        cornerShape: style.getPropertyValue("corner-shape"),
        background: style.backgroundColor,
        borderRadius: style.borderTopLeftRadius,
        height: b.height,
      };
    });
  });

/** The worst contrast between an ink (composited over each pixel) and the pixels in a PNG. */
const worstContrast = (page: Page, png: Buffer, ink: number[]) =>
  page.evaluate(
    async ({ src, ink }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, img.width, img.height).data;
      const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const a = ink[3] / 255;
      const ratios: number[] = [];
      for (let i = 0; i < px.length; i += 4) {
        const bg = [px[i], px[i + 1], px[i + 2]];
        const fg = bg.map((c, k) => ink[k] * a + c * (1 - a));
        const [l1, l2] = [lum(fg[0], fg[1], fg[2]), lum(bg[0], bg[1], bg[2])].sort((x, y) => y - x);
        ratios.push((l1 + 0.05) / (l2 + 0.05));
      }
      ratios.sort((x, y) => x - y);
      return { min: ratios[0], p5: ratios[Math.floor(ratios.length * 0.05)] };
    },
    { src: `data:image/png;base64,${png.toString("base64")}`, ink },
  );

for (const width of [1440, 390]) {
  test(`Honcho looks: Satoshi only, squircle buttons, the pink key and readable buttons at ${width}`, async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height: 900 });
    test.skip(!(await privateThemesInstalled(page)), "the private themes are not installed");
    const rows: Record<string, unknown>[] = [];
    for (const specimen of [...SPECIMENS, "itinerary-labels", "spinner"]) {
      for (const { theme, look, mode } of HONCHO_LOOKS) {
        await page.goto(`/looks/panel?theme=${theme}&look=${look}&mode=${mode}&specimen=${specimen}`);
        await expect(page.locator(`body.${theme}-theme`)).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        const where = `${specimen} · ${look}`;
        const fonts = await page.evaluate(() =>
          [...new Set([...document.querySelectorAll('[data-slot="look-panel"], [data-slot="look-panel"] *')].map((el) => getComputedStyle(el).fontFamily))],
        );
        for (const family of fonts) expect(family, `${where} font`).not.toMatch(RETIRED_FONTS);
        if (look === "today") {
          const key = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--interactive-primary-bg").trim());
          expect(key.toLowerCase(), `${where} key colour`).toBe("#ff2d8a");
        }
        // Settle hover/entrance motion before measuring, and park the pointer off every button.
        await page.mouse.move(0, 0);
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
        for (const b of await readButtons(page.mainFrame())) {
          expect(b.cornerShape, `${where} "${b.name}" corner-shape`).toBe("squircle");
          if (look.endsWith("photo")) expect(b.wash, `${where} "${b.name}" has a wash, not a bare edge`).toBe(true);
          const button = page.locator(`[data-audit="${b.index}"]`);
          await button.evaluate((el) => {
            el.style.setProperty("color", "transparent", "important");
            el.querySelectorAll<HTMLElement>("*").forEach((k) => k.style.setProperty("color", "transparent", "important"));
          });
          const box = (await button.boundingBox())!;
          const png = await page.screenshot({ clip: { x: box.x + b.clip.x, y: box.y + b.clip.y, width: b.clip.width, height: b.clip.height } });
          const contrast = await worstContrast(page, png, b.ink);
          const floor = b.kind === "text" ? 4.5 : 3;
          rows.push({ width, specimen, theme, look, name: b.name, kind: b.kind, wash: b.wash, cornerShape: b.cornerShape, background: b.background, ink: `rgba(${b.ink.join(",")})`, min: +contrast.min.toFixed(2), p5: +contrast.p5.toFixed(2), floor });
        }
      }
    }
    await testInfo.attach("button-measurements", { body: JSON.stringify(rows, null, 2), contentType: "application/json" });
    if (process.env.LOOKS_AUDIT_OUT) (await import("node:fs")).writeFileSync(`${process.env.LOOKS_AUDIT_OUT}-${width}.json`, JSON.stringify(rows, null, 2));
    // Honcho's white label on its key pink measures 3.5:1, accepted in the theme itself (BO-80,
    // visor-themes-private themes/honcho): still measured and listed, held to that 3.5:1.
    const accepted = (r: Record<string, unknown>) => r.theme === "honcho" && r.background === "rgb(255, 45, 138)";
    for (const r of rows.filter(accepted)) expect(r.min as number, `${r.specimen} "${r.name}"`).toBeGreaterThanOrEqual(3.49);
    const short = rows.filter((r) => !accepted(r) && (r.min as number) < (r.floor as number));
    expect(short, "buttons under their contrast floor").toEqual([]);
  });
}
