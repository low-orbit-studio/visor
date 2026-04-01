"use client"

import { cn } from "../../lib/utils"
import { Card, CardContent } from "../../components/ui/card/card"
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar/avatar"
import { Text } from "../../components/ui/text/text"
import { Heading } from "../../components/ui/heading/heading"
import { Separator } from "../../components/ui/separator/separator"
import styles from "./testimonial-section.module.css"

export interface Testimonial {
  quote: string
  author: string
  role?: string
  company?: string
  avatarSrc?: string
  avatarFallback?: string
}

interface TestimonialSectionProps {
  heading?: string
  testimonials: Testimonial[]
  className?: string
}

function TestimonialAttribution({ testimonial }: { testimonial: Testimonial }) {
  const fallback = testimonial.avatarFallback ?? testimonial.author.charAt(0)
  const hasAvatar = Boolean(testimonial.avatarSrc)

  return (
    <cite className={styles.attribution}>
      {hasAvatar && (
        <Avatar size="sm">
          <AvatarImage src={testimonial.avatarSrc} alt={testimonial.author} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      )}
      {!hasAvatar && testimonial.avatarFallback !== undefined && (
        <Avatar size="sm">
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      )}
      <div>
        <Text as="span" weight="medium" className={styles.authorName}>
          {testimonial.author}
        </Text>
        {(testimonial.role || testimonial.company) && (
          <Text as="p" size="sm" color="secondary" className={styles.authorRole}>
            {[testimonial.role, testimonial.company].filter(Boolean).join(", ")}
          </Text>
        )}
      </div>
    </cite>
  )
}

export function TestimonialSection({
  heading,
  testimonials,
  className,
}: TestimonialSectionProps) {
  const isSingle = testimonials.length === 1

  return (
    <section className={cn(styles.root, className)}>
      <div className={styles.container}>
        {heading && (
          <div className={styles.header}>
            <Heading level={2}>{heading}</Heading>
          </div>
        )}

        {isSingle ? (
          <div className={styles.single}>
            <blockquote className={styles.quote}>
              {testimonials[0].quote}
            </blockquote>
            <Separator />
            <TestimonialAttribution testimonial={testimonials[0]} />
          </div>
        ) : (
          <div className={styles.grid}>
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent>
                  <blockquote className={styles.quote}>
                    {testimonial.quote}
                  </blockquote>
                  <Separator />
                  <TestimonialAttribution testimonial={testimonial} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
