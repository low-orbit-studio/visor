---
"@loworbitstudio/visor": minor
---

feat: add PhotoDrop (VI-812), a squircle photo or file drop tile lifted from the Honcho kit

`npx visor add photo-drop` ships a squircle tile for one photo or file. The real file input covers it, so click, drop and keyboard go through the browser's picker; hovering, focusing or dragging a file over it wakes the dashed edge into marching ants, and a picked photo fills the same shape with a camera badge. `size` sets the side (220, or 128 in file mode); the squircle clip and edge are one JS superellipse path at any size. `progress` (0 to 1, or `"indeterminate"`) draws a ring in the key colour along the edge and dims the photo; `failed` draws the error edge and a Try Again pill that calls `onRetry`; `locked` shows a lock badge, "Locked" and `lockedReason`; `readOnly` shows the photo only. Locked, read-only and uploading render no input. `onPick(url, file)` hands over the preview URL and the File. Animations are CSS only. Glass is off by default: the tile never blurs, and under `data-glass="on"` it takes the glass layer's control fill and its badges blur with the control blur. Every visual value is a `--photo-drop-*` variable over Visor tokens.
