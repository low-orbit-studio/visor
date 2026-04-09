"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { ComponentShowcaseContent } from "../../design-system-specimen/component-specimens"

export function ComponentShowcaseSlide() {
  return (
    <Slide id="s-components">
      <SlideHeader
        subtitle="Components"
        title="Component Showcase"
        description="A selection of Visor components composed together."
      />
      <ComponentShowcaseContent />
    </Slide>
  )
}
