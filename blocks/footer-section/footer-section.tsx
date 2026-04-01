"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Separator } from "../../components/ui/separator/separator"
import styles from "./footer-section.module.css"

export interface LinkGroup {
  heading: string
  links: Array<{
    label: string
    href: string
    external?: boolean
  }>
}

export interface FooterSectionProps {
  logo?: React.ReactNode
  tagline?: string
  linkGroups: LinkGroup[]
  bottomContent?: React.ReactNode
  copyright?: string
  className?: string
}

export function FooterSection({
  logo,
  tagline,
  linkGroups,
  bottomContent,
  copyright,
  className,
}: FooterSectionProps) {
  const copyrightText = copyright ?? `© ${new Date().getFullYear()}`

  return (
    <footer className={cn(styles.root, className)}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            {logo}
            {tagline && (
              <p className={styles.tagline}>{tagline}</p>
            )}
          </div>
          {linkGroups.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <Heading level={6} className={styles.groupHeading}>
                {group.heading}
              </Heading>
              <div className={styles.linkList}>
                {group.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={styles.link}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>
          ))}
        </div>

        {bottomContent && (
          <div className={styles.bottomContent}>{bottomContent}</div>
        )}

        <Separator />

        <div className={styles.bottom}>
          <small className={styles.copyright}>{copyrightText}</small>
        </div>
      </div>
    </footer>
  )
}
