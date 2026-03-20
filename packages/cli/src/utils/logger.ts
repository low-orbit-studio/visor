import pc from "picocolors"

export const logger = {
  info(message: string): void {
    console.log(message)
  },

  success(message: string): void {
    console.log(pc.green(`✓ ${message}`))
  },

  warn(message: string): void {
    console.log(pc.yellow(`⚠ ${message}`))
  },

  error(message: string): void {
    console.error(pc.red(`✗ ${message}`))
  },

  item(message: string): void {
    console.log(pc.dim(`  ${message}`))
  },

  heading(message: string): void {
    console.log(pc.bold(message))
  },

  blank(): void {
    console.log()
  },
}
