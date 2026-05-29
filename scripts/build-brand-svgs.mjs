#!/usr/bin/env node
/**
 * Build the Visor default-brand SVG variant set (VI-469).
 *
 * Asset prep only — no new logo design. The Visor mark is an existing set of
 * heavy PNGs (`assets/visor-logo*.png`, `packages/docs/public/visor-wordmark-*.png`).
 * The brandmark (astronaut illustration) and full lockup are photographic raster
 * art that cannot be losslessly redrawn as clean vector paths, so those variants
 * embed an SVGO-friendly, size-reduced raster inside an `<svg><image>` wrapper —
 * a genuine, scalable, self-describing SVG with a viewBox and locked aspect ratio.
 *
 * The `wordmark` ("Visor.") is geometric type, so the `monochrome` variant is a
 * true single-color vector: the wordmark silhouette is traced with potrace and
 * emitted with `fill="currentColor"` so it inherits the surrounding token color
 * (the Phase-1 cohesion-test requirement, see docs/audits/visor-branding-spike.md).
 *
 * Inputs are pre-sized PNGs the caller stages with `sips`; pass the staging dir.
 * Outputs are written un-minified to assets/brand/; the caller then runs SVGO and
 * mirrors the result into packages/docs/public/themes/visor/brand/.
 *
 * Usage:
 *   node scripts/build-brand-svgs.mjs --stage <dir> [--out <dir>]
 *
 *   --stage <dir>   directory of pre-sized PNGs:
 *                     brandmark.png, logo-dark.png, wordmark-light.png, wordmark-dark.png
 *   --out <dir>     output directory for SVGs (default: assets/brand)
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// potrace is a build-time-only tool, not a runtime dependency of this repo.
// Resolve it from node_modules normally, but allow VI469_POTRACE to point at
// an out-of-tree install (e.g. an `npx`/temp install) so the asset build can
// run without adding potrace to package.json.
const require = createRequire(import.meta.url);
const potraceSpecifier = process.env.VI469_POTRACE || "potrace";
const { Potrace } = require(potraceSpecifier);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const stageDir = arg("--stage", null);
const outDir = path.resolve(repoRoot, arg("--out", "assets/brand"));

if (!stageDir) {
  console.error("error: --stage <dir> is required");
  process.exit(1);
}

/** Round to 2dp for tidy viewBox numbers. */
const r2 = (n) => Math.round(n * 100) / 100;

/** Read a PNG's intrinsic pixel size from its IHDR chunk. */
async function pngSize(file) {
  const buf = await readFile(file);
  // PNG signature is 8 bytes; IHDR width/height are big-endian uint32 at offsets 16/20.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), buf };
}

/**
 * Wrap an optimized raster PNG inside a scalable SVG. The <image> fills a
 * viewBox locked to the source aspect ratio, so the SVG scales cleanly and
 * carries its own intrinsic ratio. preserveAspectRatio keeps the mark undistorted.
 */
async function rasterSvg(srcFile, title) {
  const { width, height, buf } = await pngSize(srcFile);
  const vbW = r2(width);
  const vbH = r2(height);
  const b64 = buf.toString("base64");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${vbW}" height="${vbH}" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="${title}">
  <title>${title}</title>
  <image width="${vbW}" height="${vbH}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${b64}"/>
</svg>
`;
}

/**
 * Trace a high-contrast (dark-on-white) PNG of the wordmark into a single
 * vector path, then rewrite the fill to currentColor so it tints with the
 * surrounding token color. Threshold is tuned to capture both the dark
 * glyphs and the orange period as one silhouette.
 */
function traceMonochrome(srcFile, title) {
  return new Promise((resolve, reject) => {
    const tracer = new Potrace({
      threshold: 200, // 0-255: pixels darker than this become foreground (glyphs + orange dot)
      turdSize: 4, // drop specks <4px from resize noise
      optTolerance: 0.4, // curve-fit tolerance
      color: "currentColor",
      background: "transparent",
    });
    tracer.loadImage(srcFile, (err) => {
      if (err) return reject(err);
      const { width, height } = tracer._luminanceData; // intrinsic size from the loaded bitmap
      const pathTag = tracer.getPathTag(); // <path .../> with fill="currentColor"
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="currentColor" role="img" aria-label="${title}">
  <title>${title}</title>
  ${pathTag}
</svg>
`;
      resolve(svg);
    });
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const need = [
    "brandmark.png",
    "logo-dark.png",
    "wordmark-light.png",
    "wordmark-dark.png",
    "wordmark-mono-src.png",
  ];
  for (const f of need) {
    const p = path.join(stageDir, f);
    if (!existsSync(p)) {
      console.error(`error: missing staged input ${p}`);
      process.exit(1);
    }
  }

  const writes = [];

  // brandmark — astronaut symbol (mode-agnostic, transparent bg)
  writes.push([
    "visor-brandmark.svg",
    await rasterSvg(path.join(stageDir, "brandmark.png"), "Visor brandmark"),
  ]);

  // logo — full lockup (exists only on dark background)
  writes.push([
    "visor-logo-dark.svg",
    await rasterSvg(path.join(stageDir, "logo-dark.png"), "Visor logo"),
  ]);

  // wordmark — per-mode type
  writes.push([
    "visor-wordmark-light.svg",
    await rasterSvg(path.join(stageDir, "wordmark-light.png"), "Visor wordmark"),
  ]);
  writes.push([
    "visor-wordmark-dark.svg",
    await rasterSvg(path.join(stageDir, "wordmark-dark.png"), "Visor wordmark"),
  ]);

  // monochrome — true single-color vector, currentColor-ready
  writes.push([
    "visor-monochrome.svg",
    await traceMonochrome(path.join(stageDir, "wordmark-mono-src.png"), "Visor"),
  ]);

  for (const [name, svg] of writes) {
    const dest = path.join(outDir, name);
    await writeFile(dest, svg, "utf8");
    console.log(`wrote ${path.relative(repoRoot, dest)} (${svg.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
