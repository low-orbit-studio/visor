import { Command } from "commander"
import { checkCommand } from "./commands/check.js"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { addCommand } from "./commands/add.js"
import { diffCommand } from "./commands/diff.js"
import { infoCommand } from "./commands/info.js"
import { themeApplyCommand } from "./commands/theme-apply.js"
import type { ThemeApplyOptions } from "./commands/theme-apply.js"
import { themeExportCommand } from "./commands/theme-export.js"
import { themeValidateCommand } from "./commands/theme-validate.js"
import { themeVerifyCommand } from "./commands/theme-verify.js"
import type { ThemeVerifyOptions } from "./commands/theme-verify.js"
import { themeExtractCommand } from "./commands/theme-extract.js"
import type { ThemeExtractOptions } from "./commands/theme-extract.js"
import { themeRegisterCommand } from "./commands/theme-register.js"
import type { ThemeRegisterOptions } from "./commands/theme-register.js"
import { themeUnregisterCommand } from "./commands/theme-unregister.js"
import { themeSyncCommand } from "./commands/theme-sync.js"
import type { ThemeSyncOptions } from "./commands/theme-sync.js"
import { themeBatchApplyFlutterCommand } from "./commands/theme-batch-apply-flutter.js"
import type { ThemeBatchApplyFlutterOptions } from "./commands/theme-batch-apply-flutter.js"
import { fontsAddCommand } from "./commands/fonts-add.js"
import type { FontsAddOptions } from "./commands/fonts-add.js"
import { doctorCommand } from "./commands/doctor.js"
import { patternListCommand, patternInfoCommand } from "./commands/pattern.js"
import { suggestCommand } from "./commands/suggest.js"
import { tokensListCommand } from "./commands/tokens.js"
import { migrateTokenSubstitutionCommand } from "./commands/migrate-token-substitution.js"
import type { MigrateTokenSubstitutionOptions } from "./commands/migrate-token-substitution.js"

const program = new Command()

program
  .name("visor")
  .description("CLI for the Visor design system")
  .version("0.3.0")

program.addCommand(checkCommand())

program
  .command("init")
  .description("Initialize Visor — with --template nextjs, scaffolds a complete runnable Borealis-native Next.js app in one command")
  .option("--template <name>", "scaffold a complete runnable app (templates: nextjs)")
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
  .option("--target <platform>", "target platform: react (default) or flutter", "react")
  .option("--dry-run", "preview what would be added without writing files")
  .option("--json", "output structured JSON (for AI agents)")
  .action((items: string[], options: { overwrite: boolean; category?: string; block?: boolean; target?: string; dryRun?: boolean; json?: boolean }) => {
    const target = options.target === "flutter" ? "flutter" : "react"
    addCommand(items, process.cwd(), { overwrite: options.overwrite, category: options.category, block: options.block, target, dryRun: options.dryRun, json: options.json })
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
    "Read a .visor.yaml file and generate token overrides (CSS or Flutter)"
  )
  .argument("<file>", "path to .visor.yaml file")
  .option(
    "-o, --output <path>",
    "output CSS file path (or directory for --adapter flutter)"
  )
  .option("--json", "output structured JSON (for AI agents)")
  .option(
    "--adapter <name>",
    "target adapter: nextjs, fumadocs, deck, docs, flutter"
  )
  .option(
    "--package-name <name>",
    "(flutter) Dart package name for generated pubspec.yaml (default: ui)"
  )
  .option(
    "--tokens-only",
    "(flutter) emit only token files — skip pubspec.yaml and theme scaffolding"
  )
  .option(
    "--light-only",
    "(flutter) emit only the light-brightness theme getter"
  )
  .option(
    "--dark-only",
    "(flutter) emit only the dark-brightness theme getter"
  )
  .option(
    "--theme-class-name <name>",
    "(flutter) class name for generated theme (default: VisorAppTheme)"
  )
  .action(
    (
      file: string,
      options: {
        output?: string
        json?: boolean
        adapter?: string
        packageName?: string
        tokensOnly?: boolean
        lightOnly?: boolean
        darkOnly?: boolean
        themeClassName?: string
      }
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
  .command("verify")
  .description("Verify generated theme output for a target platform")
  .argument("<dir>", "path to generated output directory")
  .option("--target <platform>", "target platform (flutter)", "flutter")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (dir: string, options: ThemeVerifyOptions) => {
      themeVerifyCommand(dir, process.cwd(), options)
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

theme
  .command("batch-apply-flutter")
  .description(
    "Batch-generate Dart ThemeData for all .visor.yaml themes (themes/ + custom-themes/) into packages/visor_themes/"
  )
  .option("--dry-run", "show what would be generated without writing files")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (options: ThemeBatchApplyFlutterOptions) => {
      themeBatchApplyFlutterCommand(process.cwd(), options)
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

// Migrate subcommands
const migrate = program
  .command("migrate")
  .description("Migration helpers — mechanically transform source files during design-system adoption")

migrate
  .command("token-substitution")
  .description(
    "Apply the §3.1 V7-primitive → Visor-semantic substitution table across a target directory. " +
    "Dry-run by default; use --apply to commit changes. Idempotent — running twice is a no-op."
  )
  .argument("[path]", "path to file or directory to migrate (default: current directory)")
  .option("--theme-id <id>", "theme whose substitution map to apply (default: entr)", "entr")
  .option("--dry-run", "preview proposed changes without writing files (default when --apply is omitted)")
  .option("--apply", "write changes to disk")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (
      pathArg: string | undefined,
      options: MigrateTokenSubstitutionOptions & { dryRun?: boolean }
    ) => {
      migrateTokenSubstitutionCommand(pathArg, process.cwd(), {
        themeId: options.themeId,
        apply: options.apply,
        json: options.json,
      })
    }
  )

program.parse()
