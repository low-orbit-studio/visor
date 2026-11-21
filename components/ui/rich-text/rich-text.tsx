import { Fragment, type ReactNode } from "react"
import { dashes } from "./dashes"
import styles from "./rich-text.module.css"

// A small markup for text that comes from a database: *bold*, _italic_, [label](url),
// blank-line paragraphs and "- " lists. Nothing else renders: every other character,
// raw HTML included, is plain text (React escapes it), and no HTML is ever parsed.

/**
 * elements: plain HTML (p, ul, li, a, b, i) with no classes of its own, for a surface that styles
 * them itself. dashes: every en dash at en-dash width (see dashes.tsx).
 */
export interface RichOptions {
  /** Render plain p, ul, li, a, b and i with no classes, for a host that styles them itself. */
  elements?: boolean
  /** Draw every en dash at en-dash width (Satoshi's runs as long as an em dash). */
  dashes?: boolean
}

export interface RichTextProps extends RichOptions {
  /** The markup: `*bold*`, `_italic_`, `[label](https://…)`, blank-line paragraphs and `- ` lists. */
  text: string
}

// A link label holds no "[" and a URL no "[" or "]", so every scan stops at the next bracket and
// parsing stays linear: a long run of "[" or "[a](" can't make the regex backtrack quadratically.
const TOKEN = /(\[[^\][]+\]\([^)\s[\]]+\)|\*[^*\n]+\*|_[^_\n]+_|\n)/
// The text comes from a database: only these link schemes render as links.
const SAFE_URL = /^(https?:|mailto:)/i

function inline(text: string, o: RichOptions): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    // split() with a capture group puts the matched tokens at odd indexes. Plain runs between them
    // stay text even when they start and end with * or _ ("____"), which would otherwise recurse
    // once per character and overflow the stack on long hostile input.
    if (i % 2 === 0) return <Fragment key={i}>{o.dashes ? dashes(part) : part}</Fragment>
    if (part === "\n") return <br key={i} />
    const link = /^\[([^\][]+)\]\(([^)\s[\]]+)\)$/.exec(part)
    if (link) {
      const [, label, href] = link
      return href && SAFE_URL.test(href) ? (
        <a key={i} href={href} target="_blank" rel="noreferrer" className={o.elements ? undefined : styles.link}>
          {inline(label ?? "", o)}
        </a>
      ) : (
        <Fragment key={i}>{label}</Fragment>
      )
    }
    // Recurse, so a link inside _italics_ still renders as a link.
    const [Bold, Italic] = o.elements ? (["b", "i"] as const) : (["strong", "em"] as const)
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <Bold key={i}>{inline(part.slice(1, -1), o)}</Bold>
    if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) return <Italic key={i}>{inline(part.slice(1, -1), o)}</Italic>
    return <Fragment key={i}>{o.dashes ? dashes(part) : part}</Fragment>
  })
}

const ITEM = /^- /

/** One paragraph as block spans: runs of "- " lines become a list, other lines a paragraph. */
function blocks(paragraph: string, key: number, o: RichOptions): ReactNode[] {
  const runs: string[][] = []
  for (const line of paragraph.split("\n")) {
    const run = runs.at(-1)
    if (run && ITEM.test(run[0] ?? "") === ITEM.test(line)) run.push(line)
    else runs.push([line])
  }
  if (o.elements)
    return runs.map((run, i) =>
      ITEM.test(run[0] ?? "") ? (
        <ul key={`${key}-${i}`}>
          {run.map((line, j) => (
            <li key={j}>{inline(line.slice(2), o)}</li>
          ))}
        </ul>
      ) : (
        <p key={`${key}-${i}`}>{inline(run.join("\n"), o)}</p>
      )
    )
  return runs.map((run, i) =>
    ITEM.test(run[0] ?? "") ? (
      <span key={`${key}-${i}`} role="list" className={styles.list}>
        {run.map((line, j) => (
          <span key={j} role="listitem" className={styles.item}>
            {inline(line.slice(2), o)}
          </span>
        ))}
      </span>
    ) : (
      <span key={`${key}-${i}`} className={styles.para}>
        {inline(run.join("\n"), o)}
      </span>
    )
  )
}

/** Paragraphs and lists are block spans, so this can sit inside a <p> or a <label> (unless `elements`). */
export function RichText({ text, ...o }: RichTextProps) {
  const paragraphs = text.split(/\n{2,}/)
  if (!o.elements && paragraphs.length === 1 && !/^- /m.test(text)) return <>{inline(text, o)}</>
  return <>{paragraphs.flatMap((p, i) => blocks(p, i, o))}</>
}

export { dashes }
