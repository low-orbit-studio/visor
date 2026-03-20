import { createTwoFilesPatch } from "diff"

export function computeDiff(
  filePath: string,
  localContent: string,
  registryContent: string
): string {
  return createTwoFilesPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    localContent,
    registryContent,
    "local",
    "registry"
  )
}

export function hasDifferences(
  localContent: string,
  registryContent: string
): boolean {
  return localContent !== registryContent
}
