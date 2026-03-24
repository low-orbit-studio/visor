"use client"

import * as React from "react"
import { Copy, Check } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./code-block.module.css"

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string
  language?: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  title?: string
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      className,
      code,
      language,
      showLineNumbers = false,
      showCopyButton = true,
      title,
      children,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard API may not be available in all contexts
      }
    }, [code])

    const lines = code.split("\n")

    return (
      <div
        ref={ref}
        data-slot="code-block"
        data-language={language}
        className={cn(styles.base, className)}
        {...props}
      >
        {(title || language || showCopyButton) && (
          <div data-slot="code-block-header" className={styles.header}>
            <span className={styles.headerText}>
              {title || language || ""}
            </span>
            {showCopyButton && (
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy code"}
              >
                {copied ? (
                  <Check size={16} weight="bold" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            )}
          </div>
        )}
        <pre className={styles.pre}>
          <code className={styles.code}>
            {children ??
              lines.map((line, i) => (
                <span key={i} className={styles.line}>
                  {showLineNumbers && (
                    <span className={styles.lineNumber}>{i + 1}</span>
                  )}
                  <span className={styles.lineContent}>{line}</span>
                  {i < lines.length - 1 && "\n"}
                </span>
              ))}
          </code>
        </pre>
      </div>
    )
  }
)
CodeBlock.displayName = "CodeBlock"

export { CodeBlock }
