# Visor Migration Guide

This guide covers migrating to Visor from two common starting points:

1. [From shadcn/ui](#migrating-from-shadcnui)
2. [From kaiah-app's `@kaiah/ui`](#migrating-from-kaiah-apps-kaihui)

---

## Migrating from shadcn/ui

### Key Differences

| Concern | shadcn/ui | Visor |
|---------|-----------|-------|
| Styling | Tailwind CSS utilities | CSS Modules + CSS custom properties |
| Tokens | Tailwind config + CSS vars | `@loworbitstudio/visor-core` npm package |
| Theming | `dark:` Tailwind variants | `.theme-dark` class on root element |
| Distribution | CLI copies source | CLI copies source (same model) |
| Runtime dependency | None | `@loworbitstudio/visor-core` |
| Variants | CVA with Tailwind classes | CVA with CSS Module class names |

The distribution model is conceptually identical — both use a CLI to copy component source into your project. The main differences are in how styles are written and how theming works.

### Step-by-Step Migration

#### 1. Remove shadcn configuration (optional but recommended)

If you want a clean slate, remove the shadcn `components.json` and replace it with the Visor equivalent. Otherwise you can run both CLIs side-by-side during migration.

Remove the shadcn `components.json`:

```sh
rm components.json
```

Create the Visor `components.json`:

```json
{
  "$schema": "https://visor.loworbit.studio/schema.json",
  "registry": "https://visor.loworbit.studio/registry",
  "aliases": {
    "components": "@/components/ui",
    "hooks": "@/hooks",
    "lib": "@/lib"
  }
}
```

#### 2. Install the tokens package

```sh
npm install @loworbitstudio/visor
```

#### 3. Replace the global CSS token setup

**Before (shadcn/ui):**

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    /* ... many more */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

**After (Visor):**

```css
/* globals.css */
@import "@loworbitstudio/visor-core";

/* Your project-level overrides (optional) */
:root {
  /* Override specific tokens here */
}
```

Keep `@tailwind` directives if you're still using Tailwind elsewhere in your project. The Visor tokens import is additive.

#### 4. Migrate components one at a time

Add the Visor equivalent and migrate usage page by page. You do not need to migrate everything at once.

```sh
npx visor add button
```

Visor components are placed in the same `components/ui/` directory. Old shadcn components and new Visor components can coexist.

#### 5. Update CSS class references

The main change is that shadcn components use Tailwind class strings while Visor components use CSS Module classes. If you've customized shadcn components with Tailwind, you'll need to convert those customizations to CSS custom property overrides or direct CSS Module edits.

**Before (shadcn button.tsx variant):**

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
    },
  }
)
```

**After (Visor button.tsx + button.module.css):**

```tsx
// button.tsx — uses CSS Module classes
const buttonVariants = cva(styles.base, {
  variants: {
    variant: {
      default: styles.variantDefault,
      outline: styles.variantOutline,
    },
  },
})
```

```css
/* button.module.css — uses CSS custom properties */
.base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.variantDefault {
  background-color: var(--interactive-primary-bg);
  color: var(--interactive-primary-text);
}

.variantDefault:hover {
  background-color: var(--interactive-primary-bg-hover);
}
```

#### 6. Update dark mode implementation

**Before (shadcn/Tailwind dark mode):**

```tsx
// next-themes or manual class toggle adding "dark" to <html>
<html className={theme === "dark" ? "dark" : ""}>
```

**After (Visor dark mode):**

```tsx
// Add "theme-dark" class to <html> instead of "dark"
<html className={theme === "dark" ? "theme-dark" : ""}>
```

If you're using `next-themes`, update the `attribute` config:

```tsx
// Before
<ThemeProvider attribute="class" defaultTheme="system">

// After — still uses class, just the class name changes
<ThemeProvider attribute="class" defaultTheme="system" value={{ dark: "theme-dark", light: "" }}>
```

#### 7. Remove Tailwind CSS from Visor components (optional)

If you want a clean separation, remove Tailwind from component files once migrated. Visor components do not require Tailwind. However, if you use Tailwind elsewhere in your project, you can keep it — Visor and Tailwind coexist without conflict.

### Shadcn Component Name Mapping

Most shadcn component names map directly to Visor:

| shadcn | Visor CLI | Notes |
|--------|-----------|-------|
| `button` | `npx visor add button` | Direct equivalent |
| `input` | `npx visor add input` | Direct equivalent |
| `label` | `npx visor add label` | Direct equivalent |
| `checkbox` | `npx visor add checkbox` | Direct equivalent |
| `select` | `npx visor add select` | Direct equivalent |
| `switch` | `npx visor add switch` | Direct equivalent |
| `textarea` | `npx visor add textarea` | Direct equivalent |
| `card` | `npx visor add card` | Direct equivalent |
| `badge` | `npx visor add badge` | Direct equivalent |
| `avatar` | `npx visor add avatar` | Direct equivalent |
| `separator` | `npx visor add separator` | Direct equivalent |
| `skeleton` | `npx visor add skeleton` | Direct equivalent |
| `tooltip` | `npx visor add tooltip` | Direct equivalent |
| `alert` | `npx visor add alert` | Direct equivalent |
| `progress` | `npx visor add progress` | Direct equivalent |
| `dialog` | `npx visor add dialog` | Direct equivalent |
| `sheet` | `npx visor add sheet` | Direct equivalent |
| `dropdown-menu` | `npx visor add dropdown-menu` | Direct equivalent |
| `tabs` | `npx visor add tabs` | Direct equivalent |
| `breadcrumb` | `npx visor add breadcrumb` | Direct equivalent |
| `scroll-area` | `npx visor add scroll-area` | Direct equivalent |
| `form` | `npx visor add field` | Visor calls this `field` |
| `chart` | `npx visor add chart` | Direct equivalent |

---

## Migrating from kaiah-app's `@kaiah/ui`

### Background

`@kaiah/ui` is an internal package from the kaiah-app monorepo (`~/Code/kaiah/kaiah-app/packages/ui/`). It was the precursor to Visor. The key difference is distribution model: `@kaiah/ui` is an npm package (you get components as a black box), while Visor gives you full ownership of component source.

### Key Differences

| Concern | `@kaiah/ui` | Visor |
|---------|-------------|-------|
| Distribution | npm package | Copy-and-own (CLI) |
| Component ownership | Package-managed | You own the files |
| Updates | `npm update @kaiah/ui` | `npx visor add <name> --force` |
| Customization | Prop-based only | Direct source editing |
| Token source | Package-bundled | `@loworbitstudio/visor-core` (separate package) |
| Import path | `@kaiah/ui` | `@/components/ui/<name>` |

### Step-by-Step Migration

#### 1. Install the tokens package

```sh
npm install @loworbitstudio/visor
```

#### 2. Replace the tokens import

**Before:**

```css
/* globals.css */
@import "@kaiah/ui/styles"; /* or however @kaiah/ui exports its styles */
```

**After:**

```css
/* globals.css */
@import "@loworbitstudio/visor-core";
```

#### 3. Add Visor components via the CLI

For each component you're currently importing from `@kaiah/ui`, add the Visor equivalent:

```sh
npx visor add button input label card dialog
```

#### 4. Update import paths

**Before:**

```tsx
import { Button } from "@kaiah/ui"
import { Card, CardHeader, CardContent } from "@kaiah/ui"
import { Dialog, DialogTrigger, DialogContent } from "@kaiah/ui"
```

**After:**

```tsx
import { Button } from "@/components/ui/button/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card/card"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog/dialog"
```

Or create barrel exports if you prefer the flat import style:

```ts
// components/ui/index.ts
export { Button } from "./button/button"
export { Card, CardHeader, CardContent } from "./card/card"
export { Dialog, DialogTrigger, DialogContent } from "./dialog/dialog"
```

Then:

```tsx
import { Button, Card, Dialog } from "@/components/ui"
```

#### 5. Migrate component props

Visor components maintain API compatibility with `@kaiah/ui` where possible. The main props (variant, size, className) are consistent. Check the per-component docs for any differences.

**Common pattern to verify:**

```tsx
// This should work the same in both @kaiah/ui and Visor
<Button variant="default" size="md" onClick={handleClick}>
  Submit
</Button>
```

#### 6. Migrate token overrides

If you had custom token overrides targeting `@kaiah/ui`'s CSS variables, update the variable names to match Visor's token schema.

Common remapping (if applicable):

```css
/* Before — @kaiah/ui variable names */
:root {
  --kaiah-primary: #6366f1;
  --kaiah-primary-hover: #4f46e5;
}

/* After — Visor variable names */
:root {
  --interactive-primary-bg: #6366f1;
  --interactive-primary-bg-hover: #4f46e5;
}
```

Refer to the [token architecture](../packages/tokens/README.md) for the full list of available tokens.

#### 7. Remove the `@kaiah/ui` dependency

Once all components are migrated:

```sh
npm uninstall @kaiah/ui
```

Verify there are no remaining imports:

```sh
grep -r "@kaiah/ui" src/
```

### Migration Checklist

```
[ ] npm install @loworbitstudio/visor
[ ] @import "@loworbitstudio/visor-core" in globals.css
[ ] npx visor add <all used components>
[ ] Update all import paths from @kaiah/ui to @/components/ui/...
[ ] Migrate token overrides to Visor variable names
[ ] Verify component props (variant, size, etc.) still work
[ ] Remove @kaiah/ui from package.json
[ ] Run tests
[ ] Visual QA of all migrated components
```

---

## Common Migration Issues

### Issue: Component styles are not applying

**Cause:** The `@import "@loworbitstudio/visor-core"` line is missing or placed after other CSS that overrides it.

**Fix:** Ensure `@import "@loworbitstudio/visor-core"` is the first line of your global CSS file (or at least before your component imports).

### Issue: Dark mode is not working

**Cause:** The dark class name changed. Visor uses `.theme-dark`, shadcn/ui uses `.dark`, and `@kaiah/ui` may use either.

**Fix:** Update your theme toggle to apply `theme-dark` class to the `<html>` element:

```tsx
document.documentElement.classList.toggle("theme-dark", isDark)
```

### Issue: Component has wrong border radius or spacing

**Cause:** The token variable names differ from what the previous system used.

**Fix:** Check which CSS variable the component references in its `.module.css` file. Override the Visor token in your project's global CSS if needed.

### Issue: TypeScript errors on component imports

**Cause:** The import path after migration points to a non-existent file, or the path alias (`@/`) is not configured.

**Fix:** Verify the component was added (`npx visor add <name>`) and that your `tsconfig.json` has the path alias configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: `cn()` utility not found

**Cause:** `lib/utils.ts` was not created during the initial component add.

**Fix:** Add any Visor component — the CLI creates `lib/utils.ts` automatically on first run. Or manually create it:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

And install the dependencies:

```sh
npm install clsx tailwind-merge
```
