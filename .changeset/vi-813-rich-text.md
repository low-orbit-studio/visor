---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Add RichText, safe markup for text that comes from a database: `*bold*`, `_italic_`, `[label](url)`, blank-line paragraphs, single-newline line breaks and `- ` lists, and nothing else. It never parses HTML, so tags show as plain text, and a link renders only for `http:`, `https:` and `mailto:` (with `target="_blank"` and `rel="noreferrer"`); any other scheme renders its label as plain text. Paragraphs and lists are block spans, so it can sit inside a `<p>`; `elements` renders bare `p`/`ul`/`li`/`a`/`b`/`i` for a host that styles them. `dashes` draws Satoshi's en dash at en-dash width, and `dashes(text)` is exported for plain strings. Link text inherits the host's ink; the theme engine adds the `rich-text` component family with `link-underline` (`--rich-text-link-underline`, default the host's ink at 40%). The cross-platform-manifest-sync rule skips a React manifest that declares `flutter_sibling: none`. `npx visor add rich-text`.
