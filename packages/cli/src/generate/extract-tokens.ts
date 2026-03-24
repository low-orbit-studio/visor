/**
 * Extract CSS custom property tokens from CSS module content.
 *
 * Scans for var(--token-name) patterns, strips fallback values,
 * deduplicates, and returns sorted token names.
 */

export function extractTokensFromCSS(cssContent: string): string[] {
  const tokenPattern = /var\(\s*(--[\w-]+)/g
  const tokens = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = tokenPattern.exec(cssContent)) !== null) {
    tokens.add(match[1])
  }

  return [...tokens].sort()
}
