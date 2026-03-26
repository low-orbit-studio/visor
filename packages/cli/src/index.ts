import { Command } from "commander"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { addCommand } from "./commands/add.js"
import { diffCommand } from "./commands/diff.js"
import { themeApplyCommand } from "./commands/theme-apply.js"
import { themeExportCommand } from "./commands/theme-export.js"
import { themeValidateCommand } from "./commands/theme-validate.js"

const program = new Command()

program
  .name("visor")
  .description("CLI for the Visor design system")
  .version("0.1.0")

program
  .command("init")
  .description("Initialize Visor in the current project (creates visor.json)")
  .action(() => {
    initCommand(process.cwd())
  })

program
  .command("list")
  .description("List all available registry items")
  .action(() => {
    listCommand(process.cwd())
  })

program
  .command("add")
  .description("Add components, hooks, blocks, or utilities to your project")
  .argument("[items...]", "names of registry items to add")
  .option("--overwrite", "overwrite existing files", false)
  .option("--category <name>", "install all items from a category")
  .option("--block", "install blocks instead of components")
  .action((items: string[], options: { overwrite: boolean; category?: string; block?: boolean }) => {
    addCommand(items, process.cwd(), { overwrite: options.overwrite, category: options.category, block: options.block })
  })

program
  .command("diff")
  .description(
    "Show differences between local files and the registry"
  )
  .argument("[component]", "component name to diff (all if omitted)")
  .action((component: string | undefined) => {
    diffCommand(component, process.cwd())
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
  .option("-o, --output <path>", "output CSS file path", "visor-theme.css")
  .option("--json", "output structured JSON (for AI agents)")
  .action(
    (
      file: string,
      options: { output?: string; json?: boolean }
    ) => {
      themeApplyCommand(file, process.cwd(), options)
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

program.parse()
