import * as React from "react"
import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { IconGrid, IconSizeRow } from "../../../components/ui/icon-grid/icon-grid"
import {
  House,
  MagnifyingGlass,
  Gear,
  User,
  Bell,
  EnvelopeSimple,
  Plus,
  X,
  Check,
  Warning,
  Info,
  ArrowRight,
  CaretDown,
  DotsThree,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react"
import { ICON_SPECIMENS, ICON_SIZES } from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill" }>> = {
  House,
  MagnifyingGlass,
  Gear,
  User,
  Bell,
  EnvelopeSimple,
  Plus,
  X,
  Check,
  Warning,
  Info,
  ArrowRight,
  CaretDown,
  DotsThree,
  PencilSimple,
  Trash,
}

export function IconsSlide() {
  const gridItems = ICON_SPECIMENS
    .filter((icon) => ICON_MAP[icon.phosphorName])
    .map((icon) => {
      const IconComponent = ICON_MAP[icon.phosphorName]
      return {
        name: icon.name,
        usage: icon.usage,
        icon: <IconComponent size={24} />,
      }
    })

  return (
    <Slide id="s-icons">
      <SlideHeader
        subtitle="Utility"
        title="Icons"
        description="Phosphor icons at multiple sizes. All icons from @phosphor-icons/react."
      />

      <div className={styles.content}>
        <div className={styles.iconSubsection}>
          <Text weight="medium" size="sm" as="div">Size Scale</Text>
          <IconSizeRow
            sizes={ICON_SIZES.map((size) => ({
              size,
              icon: <House size={size} />,
            }))}
          />
        </div>

        <div className={styles.iconSubsection}>
          <Text weight="medium" size="sm" as="div">Icon Map</Text>
          <IconGrid icons={gridItems} />
        </div>
      </div>
    </Slide>
  )
}
