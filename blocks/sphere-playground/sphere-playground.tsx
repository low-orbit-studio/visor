"use client"

import { useRef, useState, useCallback } from "react"
import { cn } from "../../lib/utils"
import { Sphere } from "../../components/visual/sphere/sphere"
import type { SphereRef } from "../../components/visual/sphere/sphere.types"
import type { GeometryMode, ColorScheme } from "../../components/visual/sphere/sphere.types"
import { ConfigurationPanel } from "../configuration-panel/configuration-panel"
import { Slider } from "../../components/ui/slider/slider"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../components/ui/toggle-group/toggle-group"
import styles from "./sphere-playground.module.css"

export interface SpherePlaygroundProps {
  /** Initial geometry mode. Default: "sphere" */
  defaultMode?: GeometryMode
  /** Initial color scheme. Default: "solar" */
  defaultColorScheme?: ColorScheme
  /** Additional CSS class for the container */
  className?: string
  /** Inline style for the container */
  style?: React.CSSProperties
}

export function SpherePlayground({
  defaultMode = "sphere",
  defaultColorScheme = "solar",
  className,
  style,
}: SpherePlaygroundProps) {
  const sphereRef = useRef<SphereRef>(null)

  const [mode, setMode] = useState<GeometryMode>(defaultMode)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme)
  const [dotSize, setDotSize] = useState(1.0)
  const [speed, setSpeed] = useState(1.0)
  const [blur, setBlur] = useState(0.5)
  const [saturation, setSaturation] = useState(1.0)
  const [lightness, setLightness] = useState(1.0)
  const [thinkIntensity, setThinkIntensity] = useState(0)

  const handleModeChange = useCallback(
    (value: string) => {
      if (!value) return
      const next = value as GeometryMode
      setMode(next)
      sphereRef.current?.setMode(next)
    },
    [],
  )

  const handleColorSchemeChange = useCallback(
    (value: string) => {
      if (!value) return
      const next = value as ColorScheme
      setColorScheme(next)
      sphereRef.current?.setColorScheme(next)
    },
    [],
  )

  return (
    <div className={cn(styles.container, className)} style={style}>
      <div className={styles.sphere}>
        <Sphere
          ref={sphereRef}
          mode={mode}
          colorScheme={colorScheme}
          dotSize={dotSize}
          speed={speed}
          blur={blur}
          saturation={saturation}
          lightness={lightness}
          thinkIntensity={thinkIntensity}
        />
      </div>

      <ConfigurationPanel
        title="Sphere"
        subtitle="Visual controls"
        position="bottom-left"
        sections={[
          {
            label: "Geometry",
            children: (
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={handleModeChange}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="sphere">Sphere</ToggleGroupItem>
                <ToggleGroupItem value="curl">Curl</ToggleGroupItem>
                <ToggleGroupItem value="turing">Turing</ToggleGroupItem>
                <ToggleGroupItem value="lorenz">Lorenz</ToggleGroupItem>
                <ToggleGroupItem value="tendrils">Tendrils</ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            label: "Color",
            children: (
              <ToggleGroup
                type="single"
                value={colorScheme}
                onValueChange={handleColorSchemeChange}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="solar">Solar</ToggleGroupItem>
                <ToggleGroupItem value="aqua">Aqua</ToggleGroupItem>
                <ToggleGroupItem value="ember">Ember</ToggleGroupItem>
                <ToggleGroupItem value="aurora">Aurora</ToggleGroupItem>
                <ToggleGroupItem value="ghost">Ghost</ToggleGroupItem>
              </ToggleGroup>
            ),
          },
          {
            label: "Appearance",
            children: (
              <>
                <label className={styles.sliderLabel}>
                  Dots
                  <Slider
                    value={[dotSize * 50]}
                    onValueChange={([v]) => setDotSize(v / 50)}
                    max={100}
                    step={1}
                    aria-label="Dot size"
                  />
                </label>
                <label className={styles.sliderLabel}>
                  Speed
                  <Slider
                    value={[speed * 50]}
                    onValueChange={([v]) => setSpeed(v / 50)}
                    max={100}
                    step={1}
                    aria-label="Speed"
                  />
                </label>
                <label className={styles.sliderLabel}>
                  Blur
                  <Slider
                    value={[blur * 100]}
                    onValueChange={([v]) => setBlur(v / 100)}
                    max={100}
                    step={1}
                    aria-label="Blur"
                  />
                </label>
                <label className={styles.sliderLabel}>
                  Saturation
                  <Slider
                    value={[saturation * 50]}
                    onValueChange={([v]) => setSaturation(v / 50)}
                    max={100}
                    step={1}
                    aria-label="Saturation"
                  />
                </label>
                <label className={styles.sliderLabel}>
                  Lightness
                  <Slider
                    value={[lightness * 50]}
                    onValueChange={([v]) => setLightness(v / 50)}
                    max={100}
                    step={1}
                    aria-label="Lightness"
                  />
                </label>
              </>
            ),
          },
          {
            label: "Think Mode",
            children: (
              <label className={styles.sliderLabel}>
                Intensity
                <Slider
                  value={[thinkIntensity * 100]}
                  onValueChange={([v]) => setThinkIntensity(v / 100)}
                  max={100}
                  step={1}
                  aria-label="Think intensity"
                />
              </label>
            ),
          },
        ]}
      />
    </div>
  )
}
