"use client"

import { cn } from "../../lib/utils"
import { Card, CardHeader, CardContent, CardFooter } from "../../components/ui/card/card"
import { Badge } from "../../components/ui/badge/badge"
import { Button } from "../../components/ui/button/button"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Separator } from "../../components/ui/separator/separator"
import { Check } from "@phosphor-icons/react"
import styles from "./pricing-section.module.css"

export interface PricingTier {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  buttonText: string
  buttonHref?: string
  onButtonClick?: () => void
  highlighted?: boolean
  badge?: string
}

export interface PricingSectionProps {
  heading?: string
  description?: string
  tiers: PricingTier[]
  className?: string
}

export function PricingSection({
  heading,
  description,
  tiers,
  className,
}: PricingSectionProps) {
  const headingId = heading ? "pricing-section-heading" : undefined

  return (
    <section
      data-slot="pricing-section"
      className={cn(styles.root, className)}
      aria-label={heading ? undefined : "Pricing"}
      aria-labelledby={headingId}
    >
      <div className={styles.container}>
        {(heading || description) && (
          <div className={styles.header}>
            {heading && (
              <Heading level={2} id={headingId}>
                {heading}
              </Heading>
            )}
            {description && (
              <Text color="secondary" size="lg" className={styles.headerDescription}>
                {description}
              </Text>
            )}
          </div>
        )}
        <div className={styles.grid}>
          {tiers.map((tier, i) => (
            <Card
              key={i}
              className={cn(styles.tier, tier.highlighted && styles.tierHighlighted)}
            >
              <CardHeader className={styles.tierHeader}>
                {tier.badge && (
                  <Badge className={styles.tierBadge}>{tier.badge}</Badge>
                )}
                <p className={styles.tierName}>{tier.name}</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{tier.price}</span>
                  {tier.period && (
                    <span className={styles.period}>{tier.period}</span>
                  )}
                </div>
                {tier.description && (
                  <Text color="secondary" size="sm" className={styles.tierDescription}>
                    {tier.description}
                  </Text>
                )}
              </CardHeader>
              <Separator />
              <CardContent className={styles.tierContent}>
                <ul className={styles.featureList} aria-label={`${tier.name} features`}>
                  {tier.features.map((feature, j) => (
                    <li key={j} className={styles.featureItem}>
                      <Check
                        size={16}
                        weight="bold"
                        className={styles.featureIcon}
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className={styles.tierFooter}>
                {tier.buttonHref ? (
                  <Button
                    asChild
                    variant={tier.highlighted ? "default" : "outline"}
                    className={styles.tierButton}
                  >
                    <a href={tier.buttonHref}>{tier.buttonText}</a>
                  </Button>
                ) : (
                  <Button
                    variant={tier.highlighted ? "default" : "outline"}
                    onClick={tier.onButtonClick}
                    className={styles.tierButton}
                  >
                    {tier.buttonText}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
