/**
 * No-clip measurement for trimmed controls (VI-684 regression).
 *
 * Trimming a label's line box to the capital band (text-box: trim-both cap
 * alphabetic) shrinks the box the glyphs are clipped against: a native <input>
 * clips its content to it, and any `overflow: hidden` ancestor of a trimmed span
 * does too. Everything below the baseline (g j p q y) and above the cap height
 * (É Å Ñ) is cut. The centring harness labels carry neither, so it never saw it.
 *
 * This renders each control with `label` next to a reference: the same text, in
 * the same computed font, in an unclipped box on a contrasting ground. Both are
 * screenshotted at high dsf and compared on two things that clipping changes:
 *
 *   extent  the vertical span from the topmost to the bottommost ink row
 *   area    total ink coverage (sum of contrast / full contrast), in CSS px^2
 *
 * A clipped control comes out short on both. Positive `extentGap` / `areaLoss`
 * = ink missing from the control.
 */
import { measureInk, type InkCase, type InkPage, type MeasureOptions } from "./ink-centering"

export interface ClipResult {
  id: string
  /** Reference extent minus control extent, CSS px. */
  extentGap: number
  /** 1 - control area / reference area (0 = nothing lost). */
  areaLoss: number
}

export async function measureClipping(opts: Omit<MeasureOptions, "onPage"> & { label: string }): Promise<ClipResult[]> {
  const { label, ...rest } = opts
  const dsf = opts.dsf ?? 4
  let results: ClipResult[] = []
  await measureInk({
    ...rest,
    // A mid-grey page, so ink spilling past a box shows against it whatever its colour (white label on a white page would vanish).
    extraCss: (rest.extraCss ?? "") + "\nhtml,body,#theme-scope{background:#808080!important}",
    dsf,
    onPage: async (page: InkPage, rects) => {
      // 1. Next to each control, build the reference and report where the label's text sits.
      const placed = JSON.parse((await page.evaluate(`(() => {
        const label = ${JSON.stringify(label)};
        const sels = ${JSON.stringify(Object.fromEntries(opts.cases.map((c: InkCase) => [c.id, c.selector ?? null])))};
        const holder = document.createElement("div");
        holder.style.cssText = "position:absolute;left:0;top:" + (document.documentElement.scrollHeight + 40) + "px;display:flex;flex-direction:column;gap:24px";
        document.body.appendChild(holder);
        const out = [];
        for (const w of document.querySelectorAll("[data-case]")) {
          const id = w.getAttribute("data-case");
          const el = sels[id] ? w.querySelector(sels[id]) : w.firstElementChild;
          const cr = el.getBoundingClientRect();
          let node = null, host = el;
          const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          while (tw.nextNode()) if (tw.currentNode.nodeValue.includes(label)) { node = tw.currentNode; host = node.parentElement; break; }
          let tx0, tx1;
          if (node) { const r = document.createRange(); r.selectNodeContents(node); const b = r.getBoundingClientRect(); tx0 = b.left; tx1 = b.right; }
          else { const cs = getComputedStyle(el); tx0 = cr.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft); tx1 = null; }
          const hs = getComputedStyle(host);
          const cs = getComputedStyle(el);
          // Resolve the computed colour (it may be color(srgb ...) or oklch) to RGB through a canvas pixel.
          const sw = document.createElement("canvas").getContext("2d", { willReadFrequently: true }); sw.fillStyle = hs.color; sw.fillRect(0, 0, 1, 1);
          const dark = sw.getImageData(0, 0, 1, 1).data.slice(0, 3).reduce((a, b) => a + b, 0) < 384;
          const ref = document.createElement("div");
          ref.style.cssText = "padding:16px 12px;background:" + (dark ? "#fff" : "#000") + ";color:" + hs.color + ";";
          const span = document.createElement("span");
          for (const p of ["fontFamily","fontSize","fontWeight","fontStyle","letterSpacing","textTransform","fontFeatureSettings","fontKerning","fontVariantLigatures","fontStretch"]) span.style[p] = hs[p];
          span.style.cssText += ";white-space:nowrap;line-height:2;display:block";
          span.textContent = ${JSON.stringify("")} + label;
          ref.appendChild(span);
          holder.appendChild(ref);
          const rr = ref.getBoundingClientRect();
          // An <input> holds its text unwrapped, so measure the reference span to bound the scan.
          if (tx1 === null) tx1 = tx0 + span.getBoundingClientRect().width;
          out.push({ id, c: { x: cr.x + scrollX, y: cr.y + scrollY, w: cr.width, h: cr.height, tx0: tx0 + scrollX, tx1: tx1 + scrollX, inset: Math.max(parseFloat(cs.borderTopWidth), parseFloat(cs.borderBottomWidth)) }, r: { x: rr.x + scrollX, y: rr.y + scrollY, w: rr.width, h: rr.height, tw: span.getBoundingClientRect().width } });
        }
        return JSON.stringify(out);
      })()`)) as string) as Array<{ id: string; c: { x: number; y: number; w: number; h: number; tx0: number; tx1: number; inset: number }; r: { x: number; y: number; w: number; h: number; tw: number } }>
      void rects

      // 2. Screenshot only the regions that matter (a full page at 4x is too large to decode): each control with a margin for
      // ink that spills past its box, with and without glyphs, and each reference. The difference between the with/without
      // pair is the label's ink alone, wherever it lands: borders, fills and a pill's edge cancel out.
      const MARGIN = 8
      const shot = async (x: number, y: number, w: number, h: number) =>
        ((await page.screenshot({ fullPage: true, clip: { x, y, width: w, height: h } })) as Buffer).toString("base64")
      const regions = placed.map((p) => ({ id: p.id, x: p.c.tx0 - 2, y: p.c.y - MARGIN, w: p.c.tx1 - p.c.tx0 + 4, h: p.c.h + 2 * MARGIN }))
      const inked = await Promise.all(regions.map((r) => shot(r.x, r.y, r.w, r.h)))
      const refs = await Promise.all(placed.map((p) => shot(p.r.x + 1, p.r.y + 1, p.r.w - 2, p.r.h - 2)))
      await page.evaluate(`(() => { const s = document.createElement("style"); s.textContent = "[data-case] *,[data-case] *::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}"; document.head.appendChild(s); })()`)
      const blank = await Promise.all(regions.map((r) => shot(r.x, r.y, r.w, r.h)))
      const analysis = JSON.parse((await page.evaluate(`(async () => {
        const D = ${dsf};
        const load = async (b64) => { const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
          const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
          const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(img, 0, 0); return cx.getImageData(0, 0, img.width, img.height); };
        // extent (first to last row above a quarter of the peak contrast) and area (sum of contrast / peak), in CSS px.
        function measure(a, b) {
          const w = a.width, h = a.height, d = a.data, e = b ? b.data : null;
          let bg = [d[0], d[1], d[2]];
          if (!e) { const tally = new Map(); let best = 0; for (let i = 0; i < w * h; i++) { const k = d[i*4] + "," + d[i*4+1] + "," + d[i*4+2], n = (tally.get(k) || 0) + 1; tally.set(k, n); if (n > best) { best = n; bg = [d[i*4], d[i*4+1], d[i*4+2]]; } } }
          const sum = new Array(h).fill(0), peak = new Array(h).fill(0); let full = 0;
          for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const i = (r * w + c) * 4;
            const v = e ? Math.abs(d[i]-e[i]) + Math.abs(d[i+1]-e[i+1]) + Math.abs(d[i+2]-e[i+2]) : Math.abs(d[i]-bg[0]) + Math.abs(d[i+1]-bg[1]) + Math.abs(d[i+2]-bg[2]);
            sum[r] += v; if (v > peak[r]) peak[r] = v; if (v > full) full = v; }
          let first = -1, last = -1, area = 0;
          for (let r = 0; r < h; r++) { area += sum[r]; if (peak[r] > full * 0.25) { if (first < 0) first = r; last = r; } }
          return { extent: (last - first + 1) / D, area: area / full / (D * D) };
        }
        const I = ${JSON.stringify(inked)}, B = ${JSON.stringify(blank)}, R = ${JSON.stringify(refs)}, ids = ${JSON.stringify(placed.map((p) => p.id))};
        const res = {};
        for (let n = 0; n < ids.length; n++) res[ids[n]] = { ctrl: measure(await load(I[n]), await load(B[n])), ref: measure(await load(R[n]), null) };
        return JSON.stringify(res);
      })()`)) as string) as Record<string, { ctrl: { extent: number; area: number }; ref: { extent: number; area: number } }>
      results = placed.map((p) => {
        const a = analysis[p.id]
        return { id: p.id, extentGap: a.ref.extent - a.ctrl.extent, areaLoss: 1 - a.ctrl.area / a.ref.area }
      })
    },
  })
  return results
}
