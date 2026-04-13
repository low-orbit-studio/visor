import { Command } from "commander"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { addCommand } from "./commands/add.js"
import { diffCommand } from "./commands/diff.js"
import { themeApplyCommand } from "./commands/theme-apply.js"
import type { ThemeApplyOptions } from "./commands/theme-apply.js"
import { themeExportCommand } from "./commands/theme-export.js"
import { themeValidateCommand } from "./commands/theme-validate.js"
import { themeExtractCommand } from "./commands/theme-extract.js"
import type { ThemeExtractOptions } from "./commands/theme-extract.js"
import { themeRegisterCommand } from "./commands/theme-register.js"
import type { ThemeRegisterOptions } from "./commands/theme-register.js"
import { themeUnregisterCommand } from "./commands/theme-unregister.js"
import { themeSyncCommand } from "./commands/theme-sync.js"
import type { ThemeSyncOptions } from "./commands/theme-sync.js"
import { fontsAddCommand } from "./commands/fonts-add.js"
import type { FontsAddOptions } from "./commands/fonts-add.js"

const program = new Command()

program
  .name("visor")
  .description("CLI for the Visor design system")
  .version("0.1.0")

program
  .command("init")
  .description("Initialize Visor in the current project")
  .option("--template <name>", "scaffold a themed project (nextjs)")
  .option("--json", "output structured JSON (for AI agents)")
  .action((options: { template?: string; json?: boolean }) => {
    initCommand(process.cwd(), options)
  })

program
  .command("list")
  .description("List all available registry items")
  .option("--json", "output structured JSON (for AI agents)")
  .option("--category <name>", "filter items by category")
  .action((options: { json?: boolean; category?: string }) => {
    listCommand(process.cwd(), options)
  })

program
  .command("add")
  .description("Add components, hooks, blocks, or utilities to your project")
  .argument("[items...]", "names of registry items to add")
  .option("--overwrite", "overwrite existing files", false)
  .option("--category <name>", "install all items from a category")
  .option("--block", "install blocks instead of components")
  .option("--dry-run", "preview what would be added without writing files")
  .option("--json", "output structured JSON (for AI agents)")
  .action((items: string[], options: { overwrite: boolean; category?: string; block?: boolean; dryRun?: boolean; json?: boolean }) => {
    addCommand(items, process.cwd(), { overwrite: options.overwrite, category: options.category, block: options.block, dryRun: options.dryRun, json: options.json })
  })

program
  .command("diff")
  .description(
    "Show differences between local files and the registry"
  )
  .argument("[component]", "component name to diff (all if omitted)")
  .option("--json", "output structured JSON (for AI agents)")
  .action((component: string | undefined, options: { json?: boolean }) => {
    diffCommand(component, process.cwd(), options)
  })

// Theme subcommands
const theme = program
  .command("theme")
  .description("Theme management commands")

theme
  .command("apply")
  .description(
    "Read a .visor.yaml file and generate full CSS token overrides"
  )
  .argument("<file>", "path to .visor.yaml file")
  .option("-o, --output <path>", "output CSS file path")
  .option("--json", "output structured JSON (for AI agents)")
  .option("--adapter <name>", "target adapter: nextjs, fumadocs, deck")
  .action(
    (
      file: string,
      options: { output?: string; json?: boolean; adapter?: string }
    ) => {
      themeApplyCommand(file, process.cwd(), {
        ...options,
        adapter: options.adapter as ThemeApplyOptions["adapter"],
      })
    }
  )

theme
  .command("export")
  .description(
    "Read current theme tokens and produce a .visor.yaml (or other format)"
  )
  .argument("[file]", "path to source .visor.yaml file")
  .option(
    "--format <format>",
    "output format: yaml or json",
    "yaml"
  )
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (
      file: string | undefined,
      options: { format?: "yaml" | "json"; json?: boolean }
    ) => {
      themeExportCommand(file, process.cwd(), options)
    }
  )

theme
  .command("validate")
  .description("Run full validation ruleset on a .visor.yaml file")
  .argument("<file>", "path to .visor.yaml file")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (file: string, options: { json?: boolean }) => {
      themeValidateCommand(file, process.cwd(), options)
    }
  )

theme
  .command("extract")
  .description(
    "Scan an existing project's CSS and produce a best-effort .visor.yaml theme file"
  )
  .option("--from <path>", "path to project directory to scan")
  .option("--json", "output structured JSON (for AI agents)")
  .option("-o, --output <path>", "output file path (default: .visor.yaml)")
  .option("--validate", "run validator on the extracted theme")
  .action(
    (options: { from?: string; json?: boolean; output?: string; validate?: boolean }) => {
      themeExtractCommand(process.cwd(), {
        ...options,
        runValidation: options.validate,
      })
    }
  )

theme
  .command("register")
  .description(
    "Register a theme in the docs site — creates CSS, updates globals.css and theme-config.ts"
  )
  .argument("<file>", "path to .visor.yaml file")
  .requiredOption("--group <name>", "theme group to register in (e.g. Visor, Client, Low Orbit)")
  .option("--dry-run", "show what would change without writing files")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (file: string, options: { group: string; dryRun?: boolean; json?: boolean }) => {
      themeRegisterCommand(file, process.cwd(), options as ThemeRegisterOptions)
    }
  )

theme
  .command("unregister")
  .description(
    "Remove a theme from the docs site — deletes CSS file, removes globals.css import and theme-config.ts entry"
  )
  .argument("<slug>", "theme slug to unregister (e.g. entr, kaiah)")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (slug: string, options: { json?: boolean }) => {
      themeUnregisterCommand(slug, process.cwd(), options)
    }
  )

theme
  .command("sync")
  .description(
    "Scan themes/ and custom-themes/ directories, regenerate all theme CSS, globals.css imports, and theme-config.ts"
  )
  .option("--dry-run", "show what would change without writing files")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (options: ThemeSyncOptions) => {
      themeSyncCommand(process.cwd(), options)
    }
  )

// Fonts subcommands
const fonts = program
  .command("fonts")
  .description("Font library management commands")

fonts
  .command("add")
  .description("Upload woff2 font files to the Visor Font Library on R2")
  .argument("<path>", "path to a .woff2 file or directory containing .woff2 files")
  .requiredOption("--org <org>", "organization namespace (e.g. low-orbit)")
  .option("--family <name>", "font family slug (auto-inferred from filename if omitted)")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (path: string, options: { org: string; family?: string; json?: boolean }) => {
      fontsAddCommand(path, options)
    }
  )

program.parse()
