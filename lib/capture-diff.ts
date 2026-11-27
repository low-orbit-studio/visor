/**
 * The capture-pair engine (VI-863): a pixel diff of two captures, done in the
 * browser on a scaled copy. Shared by BeforeAfterCompare (its Diff mode) and
 * FidelityMirror (its `onDiff` readout for two image sources). Returns a changed-pixel mask and the changed
 * regions as boxes in 0–1 units of the after capture.
 *
 * `diffPixels` is pure (RGBA arrays in, mask and boxes out) so it is testable
 * without a canvas; `computeDiff` loads the two images and feeds it.
 */

export interface DiffBox {
  x: number
  y: number
  w: number
  h: number
}

export interface DiffResult {
  /** Mask width, in mask pixels. */
  width: number
  /** Compared height (the shorter capture), in mask pixels. */
  height: number
  /** Height of the after capture, in mask pixels (boxes are relative to it). */
  fullHeight: number
  /** 1 where the pixel changed. */
  mask: Uint8Array
  /** Changed pixel count. */
  changed: number
  /** Changed regions, largest first, at most 12. */
  boxes: DiffBox[]
  /** Difference in capture heights, in CSS pixels of the capture. */
  heightDelta: number
}

/** Cell size, in mask pixels, that changed pixels are grouped by. */
const CELL = 8
/** Summed RGB difference below which a pixel counts as unchanged (JPEG/WebP noise). */
const THRESHOLD = 42
const MAX_BOXES = 12

/** Diff two RGBA buffers of the same width × height. */
export function diffPixels(
  pa: ArrayLike<number>,
  pb: ArrayLike<number>,
  width: number,
  height: number,
  fullHeight = height
): Pick<DiffResult, "mask" | "changed" | "boxes"> {
  const mask = new Uint8Array(width * height)
  const cols = Math.ceil(width / CELL)
  const rows = Math.ceil(height / CELL)
  const cells = new Uint8Array(cols * rows)
  let changed = 0
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const d =
      Math.abs(pa[p] - pb[p]) +
      Math.abs(pa[p + 1] - pb[p + 1]) +
      Math.abs(pa[p + 2] - pb[p + 2])
    if (d > THRESHOLD) {
      mask[i] = 1
      changed++
      const x = i % width
      const y = (i / width) | 0
      cells[((y / CELL) | 0) * cols + ((x / CELL) | 0)] = 1
    }
  }

  // Group changed cells into regions; cells within 2 cells of each other join.
  const seen = new Uint8Array(cells.length)
  const boxes: DiffBox[] = []
  for (let start = 0; start < cells.length; start++) {
    if (!cells[start] || seen[start]) continue
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -1
    let y1 = -1
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const c = stack.pop()!
      const cx = c % cols
      const cy = (c / cols) | 0
      x0 = Math.min(x0, cx)
      y0 = Math.min(y0, cy)
      x1 = Math.max(x1, cx)
      y1 = Math.max(y1, cy)
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          const n = ny * cols + nx
          if (cells[n] && !seen[n]) {
            seen[n] = 1
            stack.push(n)
          }
        }
    }
    // One cell of padding so the box clears the change.
    const left = Math.max(0, (x0 - 1) * CELL)
    const top = Math.max(0, (y0 - 1) * CELL)
    const right = Math.min(width, (x1 + 2) * CELL)
    const bottom = Math.min(height, (y1 + 2) * CELL)
    boxes.push({
      x: left / width,
      y: top / fullHeight,
      w: (right - left) / width,
      h: (bottom - top) / fullHeight,
    })
  }
  boxes.sort((p, q) => q.w * q.h - p.w * p.h)
  return { mask, changed, boxes: boxes.slice(0, MAX_BOXES) }
}

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** Load both captures and diff them, scaled to at most `maxW` mask pixels wide. */
export async function computeDiff(
  beforeSrc: string,
  afterSrc: string,
  dpr = 1,
  maxW = 1200
): Promise<DiffResult> {
  const [a, b] = await Promise.all([load(beforeSrc), load(afterSrc)])
  const width = Math.min(a.naturalWidth, maxW)
  const scale = width / a.naturalWidth
  const height = Math.round(Math.min(a.naturalHeight, b.naturalHeight) * scale)
  const fullHeight = Math.round(b.naturalHeight * scale)

  const read = (img: HTMLImageElement) => {
    const c = document.createElement("canvas")
    c.width = width
    c.height = height
    const ctx = c.getContext("2d", { willReadFrequently: true })
    if (!ctx) throw new Error("Canvas 2D is unavailable")
    ctx.drawImage(img, 0, 0, width, img.naturalHeight * scale)
    return ctx.getImageData(0, 0, width, height).data
  }

  return {
    width,
    height,
    fullHeight,
    ...diffPixels(read(a), read(b), width, height, fullHeight),
    heightDelta: Math.round(Math.abs(a.naturalHeight - b.naturalHeight) / dpr),
  }
}

/** Paint the mask in a CSS colour read from the page (a theme token). */
export function paintMask(canvas: HTMLCanvasElement, r: DiffResult, color: string) {
  canvas.width = r.width
  canvas.height = r.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [cr, cg, cb] = ctx.getImageData(0, 0, 1, 1).data
  const out = ctx.createImageData(r.width, r.height)
  for (let i = 0, p = 0; i < r.mask.length; i++, p += 4) {
    if (!r.mask[i]) continue
    out.data[p] = cr
    out.data[p + 1] = cg
    out.data[p + 2] = cb
    out.data[p + 3] = 255
  }
  ctx.putImageData(out, 0, 0)
}
