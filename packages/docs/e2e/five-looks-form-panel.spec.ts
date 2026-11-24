import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-829: in the photo looks, every form control sits on a glass form panel, never straight on
// the photo; the photo is a real one (a private theme's photos/{dark,light}.*) wherever the private
// themes are installed; stacked tiles keep a real gap; and the plain looks draw no panel at all.
// The stock theme CI has; LOOKS_THEME=honcho-backstage draws the kit's looks locally.
const THEME = process.env.LOOKS_THEME ?? "neutral";
// Every specimen with form controls or tiles (the spinner has neither). Add new ones here.
const SPECIMENS = ["theme", "button", "number-input", "alert", "glass", "key-value-list", "segmented-control", "card", "toggle-group"];
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
  for (const specimen of ["theme", "button", "number-input", "toggle-group"]) {
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

// The Button specimen binds the kit's pill hooks on every stock theme, as on main: Dark and Light
// draw the ink-on-paper pill, Today the theme's key colour. Only the Honcho themes, which bind the
// hooks themselves, take their own values (covered below). The corners are as on main too: a stock
// theme binds no corner-shape, so the pills draw round unless a squircle theme's stylesheet is on
// the page. Honcho's does that wherever the private themes are installed: it binds corner-shape on
// every element, so locally the pills draw squircles; in public CI they draw round.
test("Button specimen: a stock theme's Today, Dark and Light draw the kit's pills", async ({ page }) => {
  const corners = (await privateThemesInstalled(page)) ? "squircle" : "round";
  for (const look of ["today", "dark", "light"]) {
    await page.goto(`/looks/panel?theme=neutral&look=${look}&specimen=button`);
    await expect(page.locator("body.neutral-theme")).toHaveCount(1);
    await page.mouse.move(0, 0);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
    const read = await page.evaluate(() => {
      const pills = document.querySelector<HTMLElement>('[data-slot="button-specimen"]')!;
      const ink = (value: string) => {
        const i = pills.appendChild(document.createElement("i"));
        i.style.backgroundColor = value;
        const color = getComputedStyle(i).backgroundColor;
        i.remove();
        return color;
      };
      return {
        buttons: [...pills.querySelectorAll("button")].map((b) => {
          const cs = getComputedStyle(b);
          return { radius: cs.borderTopLeftRadius, cornerShape: cs.getPropertyValue("corner-shape"), bg: cs.backgroundColor, height: cs.height, primary: /variantDefault/.test(b.className) };
        }),
        ink: ink("var(--text-primary)"),
        key: ink("var(--interactive-primary-bg)"),
      };
    });
    expect(read.buttons).toHaveLength(3);
    for (const b of read.buttons) {
      expect(b.radius, `${look} radius`).toBe("999px");
      expect(b.cornerShape, `${look} corner-shape`).toBe(corners);
    }
    const primary = read.buttons.find((b) => b.primary)!;
    expect(primary.height, `${look} lg height`).toBe("54px");
    expect(primary.bg, `${look} primary fill`).toBe(look === "today" ? read.key : read.ink);
  }
});

// The grids the operator reviews: Honcho's five looks, and the components' In Five Looks grids.
const GRIDS = [
  { path: "/themes/private", theme: "honcho-backstage", private: true },
  { path: "/docs/components/form/number-input", theme: THEME, private: false },
  { path: "/docs/components/general/button", theme: THEME, private: false },
  { path: "/docs/components/form/toggle-group", theme: THEME, private: false },
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

// Every grid as the operator opens it, with Honcho Backstage picked in the docs: each look's frame
// is on the right theme, draws Satoshi only and squircle buttons, paints none of Visor's default
// greys, and Today's primary button is the pink key. Visiting /looks/panel directly cannot see a grid that hands Today the wrong theme
// (VI-829 v4: the Button page drew Today on honcho-backstage, so its primary was black).
const HONCHO_GRIDS = [
  { path: "/themes/private", primary: true },
  { path: "/docs/components/general/button", primary: true },
  { path: "/docs/components/form/number-input", primary: false },
  { path: "/docs/components/feedback/alert", primary: false },
  { path: "/docs/components/data-display/key-value-list", primary: false },
  { path: "/docs/components/form/segmented-control", primary: false },
  { path: "/docs/themes/glass", primary: false },
  { path: "/docs/components/form/chip", primary: false },
  { path: "/docs/components/feedback/offline-banner", primary: false },
  { path: "/docs/components/data-display/spinner", primary: false },
  { path: "/docs/components/typography/text", primary: false },
  { path: "/docs/components/data-display/status-dot", primary: false },
  { path: "/docs/components/overlay/popover", primary: false },
];

// Visor's default greys (Tailwind Gray 50-900 fallbacks). Honcho binds every role a component
// reads (BO-86), so none of them may show in any look, and no field may fill with the default white.
const DEFAULT_GREYS = ["#1f2937", "#374151", "#4b5563", "#111827", "#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db"];

/** Every painted colour in a look that is one of Visor's default greys, or a default white field in Light. */
const scanDefaultGreys = (frame: Frame, light: boolean) =>
  frame.evaluate(
    ({ greys, light }) => {
      const rgb = greys.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", "));
      const isGrey = (v: string) => rgb.some((g) => v.includes(`(${g})`) || v.includes(`(${g},`));
      const hits: string[] = [];
      for (const el of [document.body, ...document.querySelectorAll('[data-slot="look-panel"], [data-slot="look-panel"] *')]) {
        const cs = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height || cs.visibility === "hidden") continue;
        const id = `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot") ?? ""}]`;
        const paints: [string, string][] = [["background", cs.backgroundColor], ["shadow", cs.boxShadow], ["background-image", cs.backgroundImage]];
        for (const side of ["Top", "Right", "Bottom", "Left"] as const)
          if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none") paints.push([`border-${side}`, cs[`border${side}Color`]]);
        if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) paints.push(["outline", cs.outlineColor]);
        if (el.matches("input, textarea") || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) paints.push(["color", cs.color]);
        if (el instanceof SVGElement) paints.push(["fill", cs.fill], ["stroke", cs.stroke]);
        for (const [prop, value] of paints) if (isGrey(value)) hits.push(`${id} ${prop} ${value}`);
        if (light && el.matches('input, textarea, select, [data-slot*="input"], [data-slot*="field"]') && /^rgba?\(255, 255, 255(, 1)?\)$/.test(cs.backgroundColor))
          hits.push(`${id} default white field ${cs.backgroundColor}`);
      }
      return [...new Set(hits)];
    },
    { greys: DEFAULT_GREYS, light },
  );

for (const grid of HONCHO_GRIDS) for (const width of [1440, 390]) {
  test(`Honcho grid: ${grid.path} draws Today on honcho with the pink key, Satoshi, squircles and no default greys at ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    test.skip(!(await privateThemesInstalled(page)), "the private themes are not installed");
    await page.addInitScript(() => localStorage.setItem("visor-theme", "honcho-backstage"));
    await page.goto(grid.path);
    await expect(page.locator('[data-slot="five-looks"]').first()).toBeVisible();
    // Every grid on the page (Segmented Control's has two).
    const grids = await page.locator('[data-slot="five-looks"]').count();
    for (let g = 0; g < grids; g++) for (const { theme, look, mode } of HONCHO_LOOKS) {
      const where = `${grid.path} #${g} · ${look}`;
      const iframe = page.locator('[data-slot="five-looks"]').nth(g).locator(`[data-look="${look}"] iframe`);
      await expect(iframe, `${where} theme`).toHaveAttribute("src", new RegExp(`theme=${theme}&`), { timeout: 20_000 });
      await expect(async () => {
        const frame = (await (await iframe.elementHandle())!.contentFrame())!;
        await frame.waitForSelector(`body.${theme}-theme [data-slot="look-panel"]`, { timeout: 5_000 });
        await frame.evaluate(() => document.fonts.ready);
        const drawn = await frame.evaluate(() => {
          const panel = document.querySelector('[data-slot="look-panel"]')!;
          const buttons = [...panel.querySelectorAll("button")];
          return {
            key: getComputedStyle(document.body).getPropertyValue("--interactive-primary-bg").trim().toLowerCase(),
            fonts: [...new Set([panel, ...panel.querySelectorAll("*")].map((el) => getComputedStyle(el).fontFamily))],
            corners: buttons.map((b) => getComputedStyle(b).getPropertyValue("corner-shape")),
            primary: buttons.filter((b) => /variantDefault/.test(b.className)).map((b) => getComputedStyle(b).backgroundColor),
          };
        });
        for (const family of drawn.fonts) expect(family, `${where} font`).not.toMatch(RETIRED_FONTS);
        for (const corner of drawn.corners) expect(corner, `${where} corner-shape`).toBe("squircle");
        if (look === "today") {
          expect(drawn.key, `${where} key colour`).toBe("#ff2d8a");
          if (grid.primary) expect(drawn.primary.length, `${where} primary buttons`).toBeGreaterThan(0);
          for (const fill of drawn.primary) expect(fill, `${where} primary button fill`).toBe("rgb(255, 45, 138)");
        }
        // Today's white field is honcho's own declared surface (#ffffff, the site's white), not a default.
        const lightBackstage = mode === "light" && theme === "honcho-backstage";
        expect(await scanDefaultGreys(frame, lightBackstage), `${where} Visor default greys`).toEqual([]);
      }).toPass({ timeout: 20_000 });
    }
  });
}

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
        secondary: /variantSecondary/.test(button.className) || button.dataset.slot === "glass-control",
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
    for (const specimen of [...SPECIMENS, "itinerary-labels", "spinner", "popover"]) {
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
        // The plain looks' secondary controls fill with the kit's neutral surface (BO-85), never Visor's default #1f2937.
        const subtleFill = await page.evaluate(() => {
          const probe = document.querySelector('[data-slot="look-panel"]')!.appendChild(document.createElement("i"));
          probe.style.backgroundColor = "var(--surface-subtle)";
          const fill = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return fill;
        });
        for (const b of await readButtons(page.mainFrame())) {
          if (look === "dark" || look === "light") {
            expect(b.background, `${where} "${b.name}" fill`).not.toBe("rgb(31, 41, 55)");
            if (b.secondary) expect(b.background, `${where} "${b.name}" secondary fill is the kit's surface-subtle`).toBe(subtleFill);
          }
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
    // One operator-recorded exception: white ink on Honcho's key pink #ff2d8a measures 3.5:1. BO-80
    // (Justin) records it: "Backstage uses `#ff2d8a` (`themes/honcho-backstage`, white text, 3.5:1
    // accepted)", and moved honcho's key to that pink and white ink. Only that pair on honcho is held
    // to 3.5:1; every other text button stays at 4.5:1 and every icon at 3:1.
    const accepted = (r: Record<string, unknown>) =>
      r.theme === "honcho" && r.background === "rgb(255, 45, 138)" && r.ink === "rgba(255,255,255,255)";
    for (const r of rows.filter(accepted)) expect(r.min as number, `${r.specimen} "${r.name}"`).toBeGreaterThanOrEqual(3.49);
    const short = rows.filter((r) => !accepted(r) && (r.min as number) < (r.floor as number));
    expect(short, "buttons under their contrast floor").toEqual([]);
  });
}
