# W026 — "Free" font licenses often forbid public CDN re-hosting (Satoshi / ITF FFL)

## Lesson

A font being **free of charge** is not the same as a font being **free to redistribute**. Indian Type Foundry's Fontshare EULA (the license shipped with Satoshi) grants unlimited free *use* on any number of devices but explicitly prohibits the two operations that public CDN hosting requires:

> §02. "The Fonts may not — beyond the permitted copies and the uses defined herein — be distributed, duplicated, loaned, resold or licensed in any way… This includes the distribution of the Fonts by e-mail, on USB sticks, CD-ROMs, or other media, **uploading them in a public server** or making the fonts available on peer-to-peer networks."

> §02. "You are not allowed to **transmit the Font Software over the Internet in font serving or for font replacement** by means of technologies such as but not limited to EOT, Cufon, sIFR or similar technologies that may be developed in the future without the prior written consent of the Licensor."

Self-hosting woff2 files at `fonts.visor.design/low-orbit-studio/satoshi/*` is the exact operation §02 prohibits — a public server doing font serving over the Internet. The license being "free" speaks only to cost; the distribution clause is independent and restrictive.

ITF's intended distribution channel is Fontshare's own CDN (their servers, their bandwidth, their bookkeeping). The EULA permits embedding via Fontshare's API; it does not permit re-hosting on a third-party CDN under a different organization's namespace.

## Implication for Visor

The substrate work that routes Satoshi-using themes (Blackout, Borderless, Space, Strata) through `fonts.visor.design` is structurally correct but legally blocked from going live with Satoshi specifically. The same code path works for any font whose license permits self-hosting (SIL OFL, Apache-2.0, etc.).

Options when a desired font's license forbids self-hosting:

1. **Use the licensor's own CDN.** Switch the theme YAML's `typography.<slot>.source` away from `visor-fonts` to a `google-fonts`-equivalent path that points at Fontshare's API. Requires a `fontshare` source type in the engine (does not currently exist).
2. **Buy a commercial license.** ITF likely offers a paid Web/Server license that permits self-hosting. Cost depends on traffic/seats.
3. **Switch to an OFL-licensed alternative.** Plus Jakarta Sans, DM Sans, Inter, IBM Plex Sans, Outfit — all permit self-hosting under SIL OFL. Any of these can replace Satoshi without legal exposure.
4. **Drop the override entirely.** Let the theme inherit the default font stack and rely on visitors having the font installed locally — which is what we just spent VI-358 fixing, so this is a regression.

## How to spot before shipping

Before adding a font to a CDN namespace under `npm run fonts:add`, read the license text shipped with the font (usually `License/*.txt` in the foundry's distribution). Look specifically for:

- A "distribution" or "redistribution" clause — most commercial-grade EULAs prohibit it for free tiers.
- A "font serving" or "web serving" clause — explicit language about transmitting the font over the Internet to end users.
- A specific licensor-controlled distribution channel — if the EULA names "our CDN" or "our API" as the only permitted serving mechanism, third-party hosting is forbidden by exclusion.

SIL OFL, Apache-2.0, and most Google-Fonts licenses do permit self-hosting (with attribution). Foundry-specific EULAs (ITF, Klim, Grilli, Pangram, Lineto) almost universally restrict it on the free tier.

## Tags

fonts, licensing, cdn, legal, satoshi, fontshare, itf

## See also

- [W025 — Themes that declare a custom font must emit @font-face](W025-font-coverage-cross-machine.md)
- [W008 — Visor Fonts CDN org slug](W008-visor-fonts-cdn-org.md)
- VI-358 (Linear) — substrate fix that exposed this license question
