import { Command } from "commander"
import { initCommand } from "./commands/init.js"
import { listCommand } from "./commands/list.js"
import { addCommand } from "./commands/add.js"
import { diffCommand } from "./commands/diff.js"

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
  .description("Add components, hooks, or utilities to your project")
  .argument("[items...]", "names of registry items to add")
  .option("--overwrite", "overwrite existing files", false)
  .option("--category <name>", "install all items from a category")
  .action((items: string[], options: { overwrite: boolean; category?: string }) => {
    addCommand(items, process.cwd(), { overwrite: options.overwrite, category: options.category })
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

program.parse()
