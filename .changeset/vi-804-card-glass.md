---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Card gets a glass variant and an editable state. `variant="glass"` draws a glass fill and an edge on two `aria-hidden` layers placed before the content, so a blurred field inside still blurs the photo. Under `data-glass="on"` the layers read the glass layer (fill, lift, blur, shadow, and an edge blended `soft-light`); everywhere else they draw the card surface and a 1px border with no blur. `editable` renders the card as a `<button type="button">` with a pen in the corner; on hover the fill steps up, the shadow deepens and the pen fills with the key colour, without moving the card, and `data-flash` plays a 1.6s ring in the key colour after a save. `as` picks the element (`div`, `section`, `main` or `button`). The theme engine gains a `card` family: `radius`, `glass-bg`, `glass-filter`, `glass-shadow`, `glass-display`, `edge-display`, `editable-hover-bg`, `editable-hover-shadow`, `pen-size` and `pen-inset`, each falling back to what Card drew before, so a plain `<Card>` renders as it did.
