import { Command } from "commander"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { addCommand } from "./commands/add.js"
import { diffCommand } from "./commands/diff.js"
import { infoCommand } from "./commands/info.js"
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
import { doctorCommand } from "./commands/doctor.js"
import { patternListCommand, patternInfoCommand } from "./commands/pattern.js"
import { suggestCommand } from "./commands/suggest.js"
import { tokensListCommand } from "./commands/tokens.js"

const program = new Command()

program
  .name("visor")
  .description("CLI for the Visor design system")
  .version("0.2.0")

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
  .argument("[component]", "component name to diff (all installed if omitted)")
  .option("--all", "check all registry components for upstream changes")
  .option("--json", "output structured JSON (for AI agents)")
  .action((component: string | undefined, options: { json?: boolean; all?: boolean }) => {
    diffCommand(component, process.cwd(), options)
  })

program
  .command("info")
  .description("Show detailed metadata for a component, hook, block, or pattern")
  .argument("<component>", "Name of the component to look up")
  .option("--json", "Output as JSON")
  .action(async (component: string, options: { json?: boolean }) => {
    await infoCommand(component, process.cwd(), options)
  })

program
  .command('doctor')
  .description('Run diagnostics on a Visor installation')
  .option('--json', 'Output as JSON (for AI agents)')
  .action(async (options: { json?: boolean }) => {
    await doctorCommand(process.cwd(), options, program.version() ?? '0.0.0')
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

// Pattern subcommands
const pattern = program
  .command("pattern")
  .description("Work with composition patterns")

pattern
  .command("list")
  .description("List all composition patterns")
  .option("--json", "Output as JSON")
  .action((options: { json?: boolean }) => {
    patternListCommand(process.cwd(), options)
  })

pattern
  .command("info")
  .argument("<name>", "Pattern name")
  .description("Show full details for a composition pattern")
  .option("--json", "Output as JSON")
  .action((name: string, options: { json?: boolean }) => {
    patternInfoCommand(name, process.cwd(), options)
  })

program
  .command('suggest')
  .description('Suggest components, blocks, and patterns for a use case')
  .requiredOption('--for <useCase>', 'Use case description (e.g. "dropdown with search")')
  .option('--json', 'Output as JSON')
  .action(async (options: { for: string; json?: boolean }) => {
    await suggestCommand(process.cwd(), options)
  })

// Tokens subcommands
const tokens = program
  .command("tokens")
  .description("Explore design tokens")

tokens
  .command("list")
  .description("List all design tokens")
  .option("--json", "output as JSON (for AI agents)")
  .option("--category <category>", "filter by tier: primitives, semantic, adaptive")
  .action(async (options: { json?: boolean; category?: string }) => {
    await tokensListCommand(process.cwd(), options)
  })

program.parse()
