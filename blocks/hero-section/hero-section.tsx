"use client"

import type { ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Button } from "../../components/ui/button/button"
import styles from "./hero-section.module.css"

export interface HeroSectionProps {
  heading: string
  subheading?: string
  buttonText?: string
  buttonHref?: string
  onButtonClick?: () => void
  backgroundImage?: string
  backgroundVideo?: string
  overlay?: boolean
  className?: string
  children?: ReactNode
}

export function HeroSection({
  heading,
  subheading,
  buttonText,
  buttonHref,
  onButtonClick,
  backgroundImage,
  backgroundVideo,
  overlay = true,
  className,
  children,
}: HeroSectionProps) {
  const hasMedia = Boolean(backgroundVideo || backgroundImage)

  return (
    <section
      aria-label={heading}
      data-slot="hero-section"
      className={cn(styles.root, hasMedia && styles.withMedia, className)}
      style={backgroundImage && !backgroundVideo ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {backgroundVideo && (
        <video className={styles.video} autoPlay muted loop playsInline>
          <source src={backgroundVideo} />
        </video>
      )}
      {overlay && hasMedia && <div className={styles.overlay} />}
      <div className={styles.content}>
        <Heading level={1} className={styles.heading}>
          {heading}
        </Heading>
        {subheading && (
          <Text size="lg" className={styles.subheading}>
            {subheading}
          </Text>
        )}
        {buttonText && (
          buttonHref ? (
            <Button asChild>
              <a href={buttonHref}>{buttonText}</a>
            </Button>
          ) : (
            <Button onClick={onButtonClick}>{buttonText}</Button>
          )
        )}
        {children}
      </div>
    </section>
  )
}
