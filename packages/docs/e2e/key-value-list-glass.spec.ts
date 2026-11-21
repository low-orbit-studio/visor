import { join } from "node:path";
import { test, expect, type Frame, type Page } from "@playwright/test";

// VI-800: KeyValueList's skin hooks and glass, in the docs page's five looks.
// The Facts panel (`surface="panel"`) is solid with a border on a plain page and
// glass over a photo; the itinerary pairs (`as="span"` inside a glass tile) never
// blur. Both read the Honcho kit's type through their hooks and the theme's ink.
const PAGE = "/docs/components/data-display/key-value-list";
// The stock theme CI has; LOOKS_THEME=honcho-backstage locally draws the kit's looks.
const THEME = process.env.LOOKS_THEME ?? "neutral";
const SHOTS = join(__dirname, "../../../docs/audits/VI-800");
const LOOKS = [
  { id: "today", label: "Today", photo: false },
  { id: "dark", label: "Dark", photo: false, mode: "dark" },
  { id: "dark-photo", label: "Dark + Photo", photo: true, mode: "dark" },
  { id: "light", label: "Light", photo: false, mode: "light" },
  { id: "light-photo", label: "Light + Photo", photo: true, mode: "light" },
];

/** The Facts and `.kv` numbers from honcho-planning (form-deck.module.css, itinerary.module.css). */
const TYPE = {
  facts: {
    label: { fontSize: "13px", fontWeight: "560", lineHeight: "24px", letterSpacing: "0.26px", textTransform: "none" },
    value: { fontSize: "17px", fontWeight: "480", lineHeight: "24.65px", letterSpacing: "normal", textTransform: "none" },
  },
  kv: {
    label: { fontSize: "13px", fontWeight: "600", lineHeight: "18.2px", letterSpacing: "normal", textTransform: "none" },
    value: { fontSize: "16px", fontWeight: "540", lineHeight: "22.4px", letterSpacing: "normal", textTransform: "none" },
  },
};

async function openDocs(page: Page, mode: "light" | "dark") {
  await page.addInitScript(
    ([theme, m]) => {
      localStorage.setItem("visor-theme", theme);
      localStorage.setItem("visor-color-mode", m);
      localStorage.setItem("theme", m);
    },
    [THEME, mode],
  );
  await page.goto(PAGE);
}

async function lookFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`[data-slot="five-looks"] [data-look="${id}"] iframe`);
  // The frames first render on the default theme, then reload on the docs theme
  // after hydration. Read only the final document.
  await expect(iframe).toHaveAttribute("src", new RegExp(`theme=${THEME}`), { timeout: 20_000 });
  const frame = await (await iframe.elementHandle())!.contentFrame();
  await expect.poll(() => frame!.url()).toContain(`theme=${THEME}`);
  await frame!.waitForSelector(`[data-slot="look-panel"][data-look="${id}"] [data-demo="kv"]`);
  return frame!;
}

/** Computed styles of one demo list: its root, first label and first value, and the theme ink it should read. */
function read(frame: Frame, demo: "facts" | "kv") {
  return frame.locator(`[data-demo="${demo}"]`).evaluate((root) => {
    const pick = (el: Element) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        color: s.color,
      };
    };
    const ink = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      root.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    const r = getComputedStyle(root);
    const item = root.querySelector('[data-slot="key-value-item"]')!;
    return {
      tag: root.tagName,
      backdrop: r.backdropFilter,
      background: r.backgroundColor,
      borderWidth: parseFloat(r.borderTopWidth),
      columns: getComputedStyle(item).gridTemplateColumns,
      label: pick(root.querySelector('[data-slot="key-value-label"]')!),
      value: pick(root.querySelector('[data-slot="key-value-value"]')!),
      ink: { primary: ink("--text-primary"), secondary: ink("--text-secondary"), tertiary: ink("--text-tertiary") },
    };
  });
}

/** Resolved px tracks of a grid template, for `minmax(96px, 1fr) 3fr` and `64px 1fr` at the rendered width. */
function tracks(columns: string): number[] {
  return columns.split(" ").map(parseFloat);
}

for (const width of [1440, 390]) {
  for (const docsMode of ["light", "dark"] as const) {
    test(`KeyValueList glass: five looks at ${width} with the docs in ${docsMode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDocs(page, docsMode);

      const grid = page.locator('[data-slot="five-looks"]');
      await expect(grid.locator("figcaption")).toHaveText(LOOKS.map((l) => l.label));

      const ink: Record<string, { label: string; value: string }> = {};
      for (const look of LOOKS) {
        // The look iframes can reload while the docs page settles; retry the look on a fresh frame.
        await expect(async () => {
          const frame = await lookFrame(page, look.id);
          const mode = look.mode ?? docsMode;
          await expect(frame.locator('[data-slot="look-panel"]')).toHaveAttribute("data-mode", mode);
          // The panel sets the frame's mode classes after it mounts; read only once they are in.
          await expect(frame.locator("html")).toHaveClass(new RegExp(`(^|\\s)${mode}(\\s|$)`));
          const facts = await read(frame, "facts");
          const kv = await read(frame, "kv");

          // Semantics: the panel is a dl; the pairs inside the button tile are spans.
          expect(facts.tag).toBe("DL");
          expect(kv.tag).toBe("SPAN");

          // Glass: the panel blurs only over a photo; the bare list never does.
          if (look.photo) {
            expect(facts.backdrop).toContain("blur(");
          } else {
            expect(facts.backdrop).toBe("none");
            expect(facts.background).not.toMatch(/^rgba\(\d+, \d+, \d+, 0\)$|^transparent$/);
            expect(facts.borderWidth).toBeGreaterThanOrEqual(1);
          }
          expect(kv.backdrop).toBe("none");

          // Type: the kit's numbers, through the hooks.
          for (const [demo, got] of [["facts", facts], ["kv", kv]] as const) {
            for (const part of ["label", "value"] as const) {
              const { color: _color, ...type } = got[part];
              expect(type, `${look.id} ${demo} ${part}`).toEqual(TYPE[demo][part]);
            }
          }
          const [factsLabel, factsValue] = tracks(facts.columns);
          expect(factsLabel).toBeGreaterThanOrEqual(96);
          // minmax(96px, 1fr) 3fr: the value track is three label tracks, unless the label's 96px floor holds.
          if (factsLabel > 96) expect(factsValue / factsLabel).toBeCloseTo(3, 1);
          expect(tracks(kv.columns)[0]).toBe(64);

          // Ink: each list reads the theme's ink where it sits.
          expect(facts.label.color).toBe(facts.ink.secondary);
          expect(facts.value.color).toBe(facts.ink.primary);
          expect(kv.label.color).toBe(kv.ink.tertiary);
          expect(kv.value.color).toBe(kv.ink.primary);
          ink[look.id] = { label: facts.label.color, value: facts.value.color };

          // Both instances fit the look with no sideways scroll.
          const scroll = await frame.evaluate(() => ({
            sw: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
          }));
          expect(scroll.sw).toBeLessThanOrEqual(scroll.cw);
        }).toPass({ timeout: 20_000 });

        // Ten review shots: each look at 390 and 1440 (docs in light; the forced looks ignore the docs mode).
        if (docsMode === "light") {
          const frame = await lookFrame(page, look.id);
          await frame.addStyleTag({ content: "nextjs-portal{display:none!important}" });
          await frame.locator('[data-slot="look-panel"]').screenshot({
            path: `${SHOTS}/${THEME === "neutral" ? "" : `${THEME}__`}${look.id}__${width}.png`,
            animations: "disabled",
          });
        }
      }
      // The ink inverts with the tone.
      expect(ink.dark.label).not.toBe(ink.light.label);
      expect(ink.dark.value).not.toBe(ink.light.value);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
