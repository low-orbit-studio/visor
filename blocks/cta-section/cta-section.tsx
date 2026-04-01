"use client"

import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Button } from "../../components/ui/button/button"
import styles from "./cta-section.module.css"

export interface CtaSectionProps {
  heading: string
  description?: string
  buttonText: string
  buttonHref?: string
  onButtonClick?: () => void
  className?: string
}

export function CtaSection({
  heading,
  description,
  buttonText,
  buttonHref,
  onButtonClick,
  className,
}: CtaSectionProps) {
  return (
    <section aria-label={heading} className={cn(styles.root, className)}>
      <div className={styles.content}>
        <Heading level={2} className={styles.heading}>
          {heading}
        </Heading>
        {description && (
          <Text color="secondary" size="lg" className={styles.description}>
            {description}
          </Text>
        )}
        {buttonHref ? (
          <Button asChild>
            <a href={buttonHref}>{buttonText}</a>
          </Button>
        ) : (
          <Button onClick={onButtonClick}>{buttonText}</Button>
        )}
      </div>
    </section>
  )
}
