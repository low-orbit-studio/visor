"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { Button } from "../../../components/ui/button/button"
import styles from "./slides.module.css"

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive"] as const
const BUTTON_SIZES = ["sm", "md", "lg"] as const

export function ButtonSpecimenSlide() {
  return (
    <Slide id="s-buttons">
      <SlideHeader
        subtitle="Components"
        title="Buttons"
        description="Five variants across three sizes. All variants inherit theme tokens automatically."
      />

      <div className={styles.content}>
        <div className={styles.buttonSubsection}>
          <Text weight="medium" size="sm" as="div">Variants</Text>
          <div className={styles.buttonRow}>
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.buttonSubsection}>
          <Text weight="medium" size="sm" as="div">Sizes</Text>
          <div className={styles.buttonRow}>
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size}>
                {size}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.buttonSubsection}>
          <Text weight="medium" size="sm" as="div">Disabled</Text>
          <div className={styles.buttonRow}>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="outline" disabled>Disabled</Button>
          </div>
        </div>
      </div>
    </Slide>
  )
}
