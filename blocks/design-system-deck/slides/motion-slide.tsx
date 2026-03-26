"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { MotionDuration, MotionEasing } from "../../../components/ui/motion-specimen/motion-specimen"
import {
  MOTION_DURATIONS,
  EASINGS,
} from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function MotionSlide() {
  return (
    <Slide id="s-motion">
      <SlideHeader
        subtitle="Visual Language"
        title="Motion"
        description="Duration and easing tokens that control transition feel."
      />

      <div className={styles.content}>
        <div>
          <Text weight="medium" size="sm" as="div">Durations</Text>
          <MotionDuration durations={MOTION_DURATIONS} />
        </div>

        <div>
          <Text weight="medium" size="sm" as="div">Easing Curves</Text>
          <MotionEasing easings={EASINGS} />
        </div>
      </div>
    </Slide>
  )
}
