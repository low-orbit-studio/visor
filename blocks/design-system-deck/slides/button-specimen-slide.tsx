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
        description="All button variants, sizes, and interactive states."
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
          <Text weight="medium" size="sm" as="div">States</Text>
          <div className={styles.forceStateGrid}>
            <div className={styles.forceStateItem}>
              <Text size="xs" color="secondary" as="div">Default</Text>
              <Button>Button</Button>
            </div>
            <div className={styles.forceStateItem} data-force-state="hover">
              <Text size="xs" color="secondary" as="div">Hover</Text>
              <Button className={styles.forceHoverButton}>Button</Button>
            </div>
            <div className={styles.forceStateItem} data-force-state="active">
              <Text size="xs" color="secondary" as="div">Active</Text>
              <Button className={styles.forceActiveButton}>Button</Button>
            </div>
            <div className={styles.forceStateItem} data-force-state="focus">
              <Text size="xs" color="secondary" as="div">Focus</Text>
              <Button className={styles.forceFocusButton}>Button</Button>
            </div>
            <div className={styles.forceStateItem}>
              <Text size="xs" color="secondary" as="div">Disabled</Text>
              <Button disabled>Button</Button>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  )
}
