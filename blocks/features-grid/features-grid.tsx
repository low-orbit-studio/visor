"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Card, CardContent } from "../../components/ui/card/card"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import styles from "./features-grid.module.css"

export interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

export interface FeaturesGridProps {
  heading?: string
  description?: string
  features: FeatureItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function FeaturesGrid({
  heading,
  description,
  features,
  columns = 3,
  className,
}: FeaturesGridProps) {
  return (
    <section className={cn(styles.root, className)}>
      <div className={styles.container}>
        {(heading || description) && (
          <div className={styles.header}>
            {heading && (
              <Heading level={2}>{heading}</Heading>
            )}
            {description && (
              <Text color="secondary">{description}</Text>
            )}
          </div>
        )}
        <div className={styles.grid} data-columns={columns}>
          {features.map((feature, index) => (
            <Card key={index} className={styles.card}>
              <CardContent>
                <div className={styles.icon}>{feature.icon}</div>
                <Heading level={3} className={styles.title}>
                  {feature.title}
                </Heading>
                <Text color="secondary">{feature.description}</Text>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
