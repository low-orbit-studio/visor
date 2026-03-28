"use client"

import { useRef, useState, useCallback, useMemo, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Sphere } from "../../components/visual/sphere/sphere"
import type { SphereRef } from "../../components/visual/sphere/sphere.types"
import type {
  GeometryMode,
  ColorScheme,
  SphereThinkEffects,
} from "../../components/visual/sphere/sphere.types"
import { ConfigurationPanel } from "../configuration-panel/configuration-panel"
import { SliderControl } from "../../components/ui/slider-control/slider-control"
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
  /** Start the control panel collapsed. Default: false */
  defaultCollapsed?: boolean
  /** Called with a live `<Sphere>` code snippet whenever settings change */
  onCodeChange?: (code: string) => void
  /** Additional CSS class for the container */
  className?: string
  /** Inline style for the container */
  style?: React.CSSProperties
}

export function SpherePlayground({
  defaultMode = "sphere",
  defaultColorScheme = "solar",
  defaultCollapsed = false,
  onCodeChange,
  className,
  style,
}: SpherePlaygroundProps) {
  const sphereRef = useRef<SphereRef>(null)

  // --- State matching source defaults ---
  const [mode, setMode] = useState<GeometryMode>(defaultMode)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme)
  const [scale, setScale] = useState(1.0)
  const [waves, setWaves] = useState(1.0)
  const [speed, setSpeed] = useState(0) // raw log value; exponential: 3^(v/3)
  const [particleCount, setParticleCount] = useState(128000)
  const [blur, setBlur] = useState(0.75)
  const [saturation, setSaturation] = useState(1.8)
  const [lightness, setLightness] = useState(0.8)
  const [thinkIntensity, setThinkIntensity] = useState(0)
  const [thinkEffects, setThinkEffects] = useState<SphereThinkEffects>({
    pulses: true,
    ramp: true,
    scatter: true,
  })

  const speedMultiplier = useMemo(() => Math.pow(3, speed / 3), [speed])

  const particleCountLabel = useMemo(() => {
    if (particleCount >= 1000000) return `${(particleCount / 1000000).toFixed(1)}M`
    return `${Math.round(particleCount / 1000)}k`
  }, [particleCount])

  const activeEffects = useMemo(() => {
    const values: string[] = []
    if (thinkEffects.pulses) values.push("pulses")
    if (thinkEffects.ramp) values.push("ramp")
    if (thinkEffects.scatter) values.push("scatter")
    return values
  }, [thinkEffects])

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

  const handleEffectsChange = useCallback((values: string[]) => {
    setThinkEffects({
      pulses: values.includes("pulses"),
      ramp: values.includes("ramp"),
      scatter: values.includes("scatter"),
    })
  }, [])

  // --- Live code generation ---
  const liveCode = useMemo(() => {
    const effects = `{ pulses: ${thinkEffects.pulses}, ramp: ${thinkEffects.ramp}, scatter: ${thinkEffects.scatter} }`
    const props = [
      `  mode="${mode}"`,
      `  colorScheme="${colorScheme}"`,
      `  particleCount={${particleCount}}`,
      `  scale={${scale}}`,
      `  waves={${waves}}`,
      `  speed={${Number(speedMultiplier.toFixed(2))}}`,
      `  blur={${blur}}`,
      `  saturation={${saturation}}`,
      `  lightness={${lightness}}`,
      `  thinkIntensity={${thinkIntensity}}`,
      `  thinkEffects={${effects}}`,
    ]
    return `<Sphere\n${props.join("\n")}\n/>`
  }, [
    mode, colorScheme, particleCount, scale, waves, speedMultiplier,
    blur, saturation, lightness,
    thinkIntensity, thinkEffects,
  ])

  useEffect(() => {
    onCodeChange?.(liveCode)
  }, [liveCode, onCodeChange])

  return (
    <div className={cn(styles.container, className)} style={style}>
      <div className={styles.sphere}>
        <Sphere
          key={particleCount}
          ref={sphereRef}
          mode={mode}
          colorScheme={colorScheme}
          particleCount={particleCount}
          scale={scale}
          waves={waves}
          dotSize={0.4}
          speed={speedMultiplier}
          blur={blur}
          saturation={saturation}
          lightness={lightness}
          thinkIntensity={thinkIntensity}
          thinkEffects={thinkEffects}
        />
      </div>

      <ConfigurationPanel
        className={styles.panel}
        title="Sphere"
        subtitle="Visual controls"
        position="bottom-left"
        draggable
        defaultCollapsed={defaultCollapsed}
        sections={[
          {
            label: "Geometry",
            children: (
              <>
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={handleModeChange}
                  variant="outline"
                  size="xs"
                >
                  <ToggleGroupItem value="sphere">Sphere</ToggleGroupItem>
                  <ToggleGroupItem value="curl">Curl</ToggleGroupItem>
                  <ToggleGroupItem value="turing">Turing</ToggleGroupItem>
                  <ToggleGroupItem value="lorenz">Lorenz</ToggleGroupItem>
                  <ToggleGroupItem value="tendrils">Tendrils</ToggleGroupItem>
                </ToggleGroup>
                <SliderControl
                  label="Size"
                  value={scale}
                  onValueChange={setScale}
                  displayValue={scale.toFixed(1)}
                  min={0.2}
                  max={3.0}
                  step={0.05}
                />
                <SliderControl
                  label="Waves"
                  value={waves}
                  onValueChange={setWaves}
                  displayValue={waves.toFixed(1)}
                  min={0.0}
                  max={3.0}
                  step={0.05}
                />
                <SliderControl
                  label="Speed"
                  value={speed}
                  onValueChange={setSpeed}
                  displayValue={speedMultiplier.toFixed(1)}
                  min={-3}
                  max={3}
                  step={0.1}
                />
              </>
            ),
          },
          {
            label: "Appearance",
            children: (
              <>
                <SliderControl
                  label="Dots"
                  value={particleCount}
                  onValueChange={setParticleCount}
                  displayValue={particleCountLabel}
                  min={6000}
                  max={1024000}
                  step={2000}
                  aria-label="Particle count"
                />
                <SliderControl
                  label="Blur"
                  value={blur}
                  onValueChange={setBlur}
                  displayValue={blur.toFixed(2)}
                  min={0.0}
                  max={1.0}
                  step={0.01}
                />
              </>
            ),
          },
          {
            label: "Color",
            children: (
              <>
                <ToggleGroup
                  type="single"
                  value={colorScheme}
                  onValueChange={handleColorSchemeChange}
                  variant="outline"
                  size="xs"
                >
                  <ToggleGroupItem value="solar">Solar</ToggleGroupItem>
                  <ToggleGroupItem value="aqua">Aqua</ToggleGroupItem>
                  <ToggleGroupItem value="ember">Ember</ToggleGroupItem>
                  <ToggleGroupItem value="aurora">Aurora</ToggleGroupItem>
                  <ToggleGroupItem value="ghost">Ghost</ToggleGroupItem>
                </ToggleGroup>
                <SliderControl
                  label="Sat"
                  value={saturation}
                  onValueChange={setSaturation}
                  displayValue={saturation.toFixed(1)}
                  min={0.0}
                  max={2.0}
                  step={0.05}
                  aria-label="Saturation"
                />
                <SliderControl
                  label="Light"
                  value={lightness}
                  onValueChange={setLightness}
                  displayValue={lightness.toFixed(1)}
                  min={0.3}
                  max={2.0}
                  step={0.05}
                  aria-label="Lightness"
                />
              </>
            ),
          },
          {
            label: "Think",
            children: (
              <>
                <ToggleGroup
                  type="multiple"
                  value={activeEffects}
                  onValueChange={handleEffectsChange}
                  variant="outline"
                  size="xs"
                >
                  <ToggleGroupItem value="pulses">Pulses</ToggleGroupItem>
                  <ToggleGroupItem value="ramp">Ramp</ToggleGroupItem>
                  <ToggleGroupItem value="scatter">Scatter</ToggleGroupItem>
                </ToggleGroup>
                <SliderControl
                  label="Intensity"
                  value={thinkIntensity}
                  onValueChange={setThinkIntensity}
                  displayValue={thinkIntensity.toFixed(2)}
                  min={0}
                  max={1}
                  step={0.01}
                  aria-label="Think intensity"
                />
              </>
            ),
          },
        ]}
      />
    </div>
  )
}
