---
"@loworbitstudio/visor": minor
---

VI-430 feat: `prototype-review` Visor block — drop-in chrome for BL-193-style design-review prototypes.

Ships a theme-agnostic block that renders the full review SPA: theme switcher, light/dark mode toggle, brand color picker, treatment tabs, viewport switcher, and a multi-viewport iframe grid. Zero hex literals in the CSS module and zero `theme ===` conditionals in the TSX — every surface, border, and focus ring references Visor semantic tokens. Implements a postMessage protocol (`{ type: "prototype-theme", themeClass, mode, brand }`) for cross-iframe theme/mode/brand propagation, with URL params (`?theme=…&mode=…&brand=…`) as the deep-link fallback. Exposes a `usePrototypeReview()` hook for advanced consumers; default consumers pass props. Block API: `ticketId`, `reviewLabel`, `statusPills`, `treatments[]`, `landing{}`, `viewports{}`, `brand{}`, `themes[]`, `footer{}`.
