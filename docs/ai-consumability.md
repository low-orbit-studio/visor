# AI Agent Consumability

## Goal

Make Visor as understandable and usable by AI agents as it is by human developers. An agent should be able to discover, understand, select, and compose Visor components without reading implementation source code.

## Why This Matters

AI agents (Claude Code, Cursor, Copilot, custom agents) are increasingly the ones writing UI code. Most design systems are built for human consumption — prose docs, visual examples, implicit conventions. Agents work better with structured data, explicit guidance, and machine-readable metadata.

Visor's advantage: if an agent can understand the full component catalog, know when to use each component, and compose them into patterns — it can build complete UIs from a description, themed via the interchange format. This is the "instant design systems" vision.

## Pillars

### 1. Component Metadata Manifests

Each component gets a structured metadata file alongside its implementation. This is the agent-readable equivalent of the MDX docs page.

```yaml
# components/ui/button/button.visor.yaml
name: Button
description: Primary interactive element for triggering actions.
category: form

when_to_use:
  - Triggering an action (submit, save, delete, navigate)
  - Primary and secondary CTAs on a page
  - Form submission

when_not_to_use:
  - Navigation to another page (use a link or NextJS Link instead)
  - Toggling state on/off (use Switch or Toggle Group)
  - Selecting from options (use Select or Radio Group)

why: >
  Button is the most common interactive primitive. It handles focus management,
  keyboard interaction, loading states, and disabled states correctly out of the box.
  Using it instead of a styled <div> or <a> ensures accessibility compliance.

variants:
  variant: [default, secondary, ghost, destructive, outline, link]
  size: [sm, md, lg, icon]

props:
  - name: variant
    type: "'default' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link'"
    default: "default"
  - name: size
    type: "'sm' | 'md' | 'lg' | 'icon'"
    default: "md"
  - name: asChild
    type: boolean
    default: false
    description: Merge props onto child element instead of rendering a <button>
  - name: disabled
    type: boolean
    default: false
  - name: loading
    type: boolean
    default: false

slots:
  - name: icon-left
    description: Icon rendered before the label
  - name: icon-right
    description: Icon rendered after the label

dependencies:
  - "@radix-ui/react-slot"
  - "class-variance-authority"

tokens_used:
  - --interactive-primary
  - --interactive-primary-hover
  - --text-on-interactive
  - --radius-md
  - --space-sm
  - --space-md

example: |
  <Button variant="primary" size="md">Save changes</Button>

  <Button variant="ghost" size="icon">
    <Trash weight="bold" />
  </Button>
```

### 2. Single Registry Manifest

One `visor-manifest.json` file that an agent can load to understand the entire catalog at a glance. Auto-generated from the individual component metadata files.

```json
{
  "version": "0.3.0",
  "components": {
    "button": {
      "category": "form",
      "description": "Primary interactive element for triggering actions.",
      "variants": ["default", "secondary", "ghost", "destructive", "outline", "link"],
      "sizes": ["sm", "md", "lg", "icon"],
      "when_to_use": ["Triggering an action", "Primary and secondary CTAs", "Form submission"],
      "when_not_to_use": ["Navigation (use Link)", "Toggling state (use Switch)", "Selecting options (use Select)"],
      "dependencies": ["@radix-ui/react-slot", "cva"]
    }
  },
  "hooks": { ... },
  "patterns": { ... },
  "categories": {
    "form": ["button", "input", "label", "textarea", "checkbox", "select", "switch", "field", "radio-group", "slider", "combobox", "file-upload", "toggle-group"],
    "navigation": ["navbar", "pagination", "command-palette", "stepper", "breadcrumb", "tabs"],
    "data-display": ["table", "accordion", "code-block", "timeline", "card", "badge", "avatar"],
    "feedback": ["toast", "alert", "popover", "banner", "tooltip", "progress", "skeleton"],
    "overlay": ["dialog", "sheet", "dropdown-menu", "context-menu", "hover-card", "menubar"],
    "media": ["carousel", "lightbox", "image"],
    "typography": ["heading", "text"],
    "layout": ["sidebar", "separator", "scroll-area"]
  }
}
```

### 3. Composition Patterns / Recipes

Higher-level documentation that tells agents not just *what* components exist but *how to combine them*. Each pattern is a documented recipe.

```yaml
# patterns/form-with-validation.visor-pattern.yaml
name: Form with Validation
description: Standard form layout with field-level validation and submission handling.

components_used:
  - field
  - input
  - label
  - button
  - alert

when_to_use:
  - Any form collecting user input (settings, profile, onboarding)
  - Forms needing inline validation feedback

structure: |
  <form>
    <Field>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" required />
    </Field>
    <Field>
      <Label htmlFor="name">Full name</Label>
      <Input id="name" required />
    </Field>
    {error && <Alert variant="destructive">{error}</Alert>}
    <Button type="submit">Submit</Button>
  </form>

notes: >
  Field component handles spacing and error message display.
  Always use Label with htmlFor matching the Input id for accessibility.
  Place Alert above the submit button for form-level errors.
```

### 4. Agent-First CLI

Enhance the existing `npx visor` CLI to be optimized for agent consumption, following CLI-Anything principles.

**Design principles:**
- **Structured output:** `--json` flag on every command. Agents never parse human-formatted text.
- **Self-describing:** Rich `--help` on every command. Agents can discover capabilities.
- **Composable:** Commands chain naturally for complex workflows.
- **Deterministic:** Same input always produces same output. No interactive prompts when `--json` is set.

**New/enhanced commands:**

```bash
# Discovery
npx visor list --json                          # Full component catalog (structured)
npx visor list --category form --json          # Filter by category
npx visor info button --json                   # Full metadata for a component
npx visor pattern list --json                  # Available composition patterns
npx visor pattern info form-with-validation --json

# Theme operations (all with structured output)
npx visor theme validate ./theme.yaml --json
npx visor theme generate --primary "#1A5F7A" --accent "#5BC4BF" --font-display "Inter" --json
npx visor theme apply ./theme.yaml --json
npx visor theme export --format figma --json

# Composition helpers
npx visor suggest --for "user settings page" --json  # Suggest components for a use case
```

**Key difference from current CLI:**
The current CLI focuses on file operations (add, init, diff). The enhanced CLI adds *knowledge operations* — querying component metadata, patterns, and guidance without touching files.

## Implementation Notes

- Component `.visor.yaml` metadata files live alongside the component source (e.g., `components/ui/button/button.visor.yaml`)
- `visor-manifest.json` is auto-generated from individual metadata files during build (`npm run build:manifest -w packages/cli`)
- Pattern files live in a top-level `patterns/` directory using `.visor-pattern.yaml` extension
- The CLI reads metadata from the registry, not from local files — so even consumers who haven't installed a component can query its metadata
- `tokens_used` is **auto-extracted** from each component's `.module.css` file at build time — not manually authored in YAML. This prevents drift between token usage and metadata.
- `props` is optional in `.visor.yaml` — compound components that delegate all behavior to sub-components (e.g., Dialog) may omit it
- A validation test ensures every registered component has a corresponding `.visor.yaml` file
