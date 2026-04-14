import { loadManifest } from '../registry/resolve.js'

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'with', 'for', 'and', 'or', 'to', 'in', 'of', 'is',
  'that', 'this', 'it', 'as', 'at', 'by', 'on', 'be', 'are', 'was', 'were',
])

interface SuggestResult {
  name: string
  type: 'component' | 'block' | 'pattern' | 'hook'
  category?: string
  score: number
  description: string
  match_reason: string
  install_command: string | null
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_,]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

function scoreEntry(
  queryTokens: string[],
  name: string,
  description: string,
  whenToUse: string[]
): { score: number; matchReason: string } {
  const searchText = [name, description, ...whenToUse].join(' ').toLowerCase()
  const matchedTokens = queryTokens.filter((t) => searchText.includes(t))
  return {
    score: matchedTokens.length,
    matchReason:
      matchedTokens.length > 0 ? `Matched: ${matchedTokens.join(', ')}` : '',
  }
}

export async function suggestCommand(
  _cwd: string,
  options: { for: string; json?: boolean }
): Promise<void> {
  const query = options.for
  const queryTokens = tokenize(query)

  if (queryTokens.length === 0) {
    const err = {
      success: false,
      error:
        'Query is too short or contains only stop words. Try more specific terms.',
    }
    if (options.json) {
      console.error(JSON.stringify(err))
      process.exit(1)
    }
    console.error(err.error)
    process.exit(1)
  }

  const manifest = loadManifest()
  const results: SuggestResult[] = []

  // Search components
  for (const [name, entry] of Object.entries(manifest.components)) {
    const { score, matchReason } = scoreEntry(
      queryTokens,
      name,
      entry.description,
      entry.when_to_use || []
    )
    if (score >= 1) {
      results.push({
        name,
        type: 'component',
        category: entry.category,
        score,
        description: entry.description,
        match_reason: matchReason,
        install_command: `npx visor add ${name}`,
      })
    }
  }

  // Search blocks
  for (const [name, entry] of Object.entries(manifest.blocks)) {
    const { score, matchReason } = scoreEntry(
      queryTokens,
      name,
      entry.description,
      entry.when_to_use || []
    )
    if (score >= 1) {
      results.push({
        name,
        type: 'block',
        category: entry.category,
        score,
        description: entry.description,
        match_reason: matchReason,
        install_command: `npx visor add ${name} --block`,
      })
    }
  }

  // Search patterns
  for (const [name, entry] of Object.entries(manifest.patterns)) {
    const { score, matchReason } = scoreEntry(
      queryTokens,
      name,
      entry.description,
      entry.when_to_use || []
    )
    if (score >= 1) {
      results.push({
        name,
        type: 'pattern',
        score,
        description: entry.description,
        match_reason: matchReason,
        install_command: null,
      })
    }
  }

  // Search hooks
  for (const [name, entry] of Object.entries(manifest.hooks)) {
    const { score, matchReason } = scoreEntry(
      queryTokens,
      name,
      entry.description,
      []
    )
    if (score >= 1) {
      results.push({
        name,
        type: 'hook',
        score,
        description: entry.description,
        match_reason: matchReason,
        install_command: `npx visor add ${name}`,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  const topResults = results.slice(0, 10)

  if (topResults.length === 0) {
    const err = {
      success: false,
      error: `No matches found for "${query}". Try broader terms.`,
    }
    if (options.json) {
      console.error(JSON.stringify(err, null, 2))
      process.exit(1)
    }
    console.error(err.error)
    process.exit(1)
  }

  const totalSearched =
    Object.keys(manifest.components).length +
    Object.keys(manifest.blocks).length +
    Object.keys(manifest.patterns).length +
    Object.keys(manifest.hooks).length

  const output = {
    success: true,
    query,
    results: topResults,
    summary: {
      total_searched: totalSearched,
      total_matched: topResults.length,
    },
  }

  if (options.json) {
    console.log(JSON.stringify(output, null, 2))
    process.exit(0)
  }

  // Human-readable output
  console.log(`\nSuggestions for "${query}":\n`)
  for (const r of topResults) {
    const cmd = r.install_command ? ` (${r.install_command})` : ''
    console.log(`  ${r.name} [${r.type}]${cmd}`)
    console.log(`    ${r.description.slice(0, 80)}`)
  }
  console.log(
    `\n${topResults.length} result${topResults.length !== 1 ? 's' : ''} from ${totalSearched} entries\n`
  )
}
