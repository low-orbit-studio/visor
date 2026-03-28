"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./sphere.module.css"
import {
  COLOR_SCHEMES,
  DEFAULT_CONFIG,
  type ColorScheme,
  type GeometryMode,
  type GradientColors,
  type SphereProps,
  type SphereRef,
} from "./sphere.types"
import { rgbToHsl, hslToRgb } from "./sphere-color"
import type { ParticleSystem } from "./sphere-particles"

// ---------------------------------------------------------------------------
// Internal state held across frames (not React state — avoids re-renders)
// ---------------------------------------------------------------------------

interface SphereInternals {
  renderer: import("three").WebGLRenderer
  scene: import("three").Scene
  camera: import("three").PerspectiveCamera
  group: import("three").Group
  orbitControls: import("three/addons/controls/OrbitControls.js").OrbitControls
  particleSystem: ParticleSystem
  animationId: number
  scaledTime: number
  paused: boolean

  // Think-mode ramp state
  thinkActive: boolean
  thinkLinear: number
  thinkIntensity: number
  lastThinkTime: number
  externalThinkIntensity: number | null

  // Pulse wave state
  lastPulseTime: number
  nextPulseSlot: number

  // Staccato scatter state
  nextContractTime: number
  contractStart: number
  contractDepth: number
  contractIn: number
  contractOut: number
  pendingDoublebeat: boolean

  // Reset animation
  resetAnim: {
    startPos: import("three").Vector3
    startTarget: import("three").Vector3
    startRotation: import("three").Euler
    startTime: number
    duration: number
  } | null

  // Initial camera state
  initialCameraPos: import("three").Vector3
  initialControlsTarget: import("three").Vector3

  // Config refs for prop sync
  speed: number
  effectsEnabled: { pulses: boolean; ramp: boolean; scatter: boolean }

  // Color state
  baseHSL: Array<[number, number, number]>
  saturationMult: number
  lightnessMult: number

  dispose: () => void
  renderOnce: () => void
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Sphere = React.forwardRef<SphereRef, SphereProps>((props, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const internalsRef = React.useRef<SphereInternals | null>(null)
  const propsRef = React.useRef(props)
  propsRef.current = props

  // Track initialization
  const [isClient, setIsClient] = React.useState(false)
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // ─── Main initialization ─────────────────────────────────────────
  React.useEffect(() => {
    if (!isClient || !containerRef.current) return

    let cancelled = false
    let internals: SphereInternals | null = null

    async function init() {
      const container = containerRef.current
      if (!container || cancelled) return

      const THREE = await import("three")
      const { OrbitControls } = await import(
        "three/addons/controls/OrbitControls.js"
      )
      if (cancelled) return

      const { createParticleSystem } = await import("./sphere-particles")
      if (cancelled) return

      const p = propsRef.current
      const bgColor =
        p.backgroundColor ?? DEFAULT_CONFIG.backgroundColor

      // Renderer — use LinearSRGBColorSpace to match the original Three.js 0.160
      // color pipeline. Without this, Three.js 0.183+ applies sRGB-to-linear
      // conversion on Color uniforms, making additive-blended particles
      // saturate to white.
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
      const rect = container.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height)
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, p.maxPixelRatio ?? 2),
      )
      renderer.setClearColor(bgColor)
      container.appendChild(renderer.domElement)

      // Scene & camera
      const scene = new THREE.Scene()
      const fov = p.fov ?? DEFAULT_CONFIG.fov
      const camera = new THREE.PerspectiveCamera(
        fov,
        rect.width / rect.height,
        0.1,
        100,
      )
      camera.position.z = p.cameraDistance ?? DEFAULT_CONFIG.cameraZ

      const group = new THREE.Group()
      if (p.scale != null) group.scale.setScalar(p.scale)
      scene.add(group)

      // Resolve initial colors
      const initialColors: GradientColors =
        p.colors ?? COLOR_SCHEMES[p.colorScheme ?? "solar"].colors

      // Particles
      const particleSystem = createParticleSystem(THREE, {
        ...DEFAULT_CONFIG,
        particleCount: p.particleCount ?? DEFAULT_CONFIG.particleCount,
        sparkleChance: p.sparkleChance ?? DEFAULT_CONFIG.sparkleChance,
        sphereRadius: p.radius ?? DEFAULT_CONFIG.sphereRadius,
        gradientColors: [...initialColors],
        dotSoftness:
          p.blur != null
            ? 0.48 * (1 - p.blur)
            : DEFAULT_CONFIG.dotSoftness,
        noiseAmplitude:
          DEFAULT_CONFIG.noiseAmplitude * (p.waves ?? 1),
        turbulenceAmplitude:
          DEFAULT_CONFIG.turbulenceAmplitude * (p.waves ?? 1),
        swirlAmount: DEFAULT_CONFIG.swirlAmount * (p.waves ?? 1),
        particleBaseSize:
          DEFAULT_CONFIG.particleBaseSize * (p.dotSize ?? 1),
        particleMaxSize:
          DEFAULT_CONFIG.particleMaxSize * (p.dotSize ?? 1),
      })
      group.add(particleSystem.points)

      // Set initial geometry mode
      const initialMode = p.mode ?? "sphere"
      if (initialMode !== "sphere") {
        particleSystem.setMode(initialMode)
      }

      // OrbitControls
      const orbitControls = new OrbitControls(camera, renderer.domElement)
      orbitControls.enableDamping = true
      orbitControls.dampingFactor = 0.05
      orbitControls.enablePan = false
      orbitControls.minDistance = 2.0
      orbitControls.maxDistance = 10.0
      orbitControls.autoRotate = p.autoRotate ?? true
      orbitControls.autoRotateSpeed = p.autoRotateSpeed ?? 0.5

      if (p.orbitControls === false) {
        orbitControls.enabled = false
      }

      // Think effects
      const effectsEnabled = {
        pulses: p.thinkEffects?.pulses ?? true,
        ramp: p.thinkEffects?.ramp ?? true,
        scatter: p.thinkEffects?.scatter ?? true,
      }
      const { material } = particleSystem
      material.uniforms.uPulseEnabled.value = effectsEnabled.pulses
        ? 1.0
        : 0.0
      material.uniforms.uRampEnabled.value = effectsEnabled.ramp
        ? 1.0
        : 0.0
      material.uniforms.uScatterEnabled.value = effectsEnabled.scatter
        ? 1.0
        : 0.0

      // Color state (for saturation/lightness adjustment)
      const baseHSL = initialColors.map(
        (c) => rgbToHsl(c[0], c[1], c[2]) as [number, number, number],
      )

      // Build internals
      internals = {
        renderer,
        scene,
        camera,
        group,
        orbitControls,
        particleSystem,
        animationId: 0,
        scaledTime: 0,
        paused: false,

        thinkActive: false,
        thinkLinear: 0,
        thinkIntensity: 0,
        lastThinkTime: performance.now(),
        externalThinkIntensity: p.thinkIntensity ?? null,

        lastPulseTime: 0,
        nextPulseSlot: 0,

        nextContractTime: 0,
        contractStart: -1,
        contractDepth: 0.5,
        contractIn: 0.1,
        contractOut: 0.375,
        pendingDoublebeat: false,

        resetAnim: null,
        initialCameraPos: camera.position.clone(),
        initialControlsTarget: orbitControls.target.clone(),

        speed: p.speed ?? 1,
        effectsEnabled,

        baseHSL,
        saturationMult: p.saturation ?? 1,
        lightnessMult: p.lightness ?? 1,

        dispose() {
          cancelAnimationFrame(internals!.animationId)
          particleSystem.dispose()
          renderer.dispose()
          orbitControls.dispose()
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement)
          }
        },

        renderOnce() {
          orbitControls.update()
          renderer.render(scene, camera)
        },
      }

      internalsRef.current = internals

      // Apply initial saturation/lightness
      if (p.saturation != null || p.lightness != null) {
        applyGradient(internals)
      }

      // ─── Animation loop ────────────────────────────────────────────
      const clock = new THREE.Clock()

      function scheduleNextBeat(now: number): void {
        if (!internals) return
        if (!internals.pendingDoublebeat && Math.random() < 0.2) {
          internals.pendingDoublebeat = true
          internals.nextContractTime = now + 0.2 + Math.random() * 0.1
        } else {
          internals.pendingDoublebeat = false
          internals.nextContractTime = now + 0.5 + Math.random() * 0.7
        }
      }

      function spawnPulse(): void {
        if (!internals) return
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const origin =
          material.uniforms.uPulseOrigins.value[internals.nextPulseSlot]
        origin.set(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        )
        material.uniforms.uPulseTimes.value[internals.nextPulseSlot] =
          internals.scaledTime
        internals.nextPulseSlot = (internals.nextPulseSlot + 1) % 6
      }

      function animate(): void {
        if (!internals) return
        internals.animationId = requestAnimationFrame(animate)

        if (internals.paused) {
          orbitControls.update()
          return
        }

        const delta = clock.getDelta()

        // Think intensity ramp
        const now = performance.now()
        const dt = (now - internals.lastThinkTime) / 1000
        internals.lastThinkTime = now

        let ti: number
        if (internals.externalThinkIntensity != null) {
          ti = internals.externalThinkIntensity
          internals.thinkIntensity = ti
        } else {
          if (internals.thinkActive) {
            internals.thinkLinear = Math.min(
              1,
              internals.thinkLinear + dt * 2.67,
            )
          } else {
            internals.thinkLinear = Math.max(
              0,
              internals.thinkLinear - dt * 1.67,
            )
          }
          internals.thinkIntensity =
            1 - (1 - internals.thinkLinear) * (1 - internals.thinkLinear)
          ti = internals.thinkIntensity
        }

        // Speed with ramp effect
        const rampOn = internals.effectsEnabled.ramp
        internals.scaledTime +=
          delta * internals.speed * (1 + ti * (rampOn ? 0.15 : 0))
        material.uniforms.uTime.value = internals.scaledTime
        material.uniforms.uThinkIntensity.value = ti

        // Pulse waves
        if (
          ti > 0.1 &&
          internals.effectsEnabled.pulses &&
          internals.scaledTime - internals.lastPulseTime > 0.35
        ) {
          spawnPulse()
          internals.lastPulseTime = internals.scaledTime
        }

        // Staccato scatter contraction
        const wallNow = performance.now() / 1000
        if (
          ti > 0.5 &&
          internals.effectsEnabled.scatter &&
          wallNow >= internals.nextContractTime
        ) {
          internals.contractStart = wallNow
          internals.contractDepth = 0.35 + Math.random() * 0.25
          internals.contractIn = 0.08 + Math.random() * 0.05
          internals.contractOut = 0.3 + Math.random() * 0.15
          scheduleNextBeat(wallNow)
        }

        let contractPulse = 0
        if (internals.contractStart > 0) {
          const age = wallNow - internals.contractStart
          if (age < internals.contractIn) {
            contractPulse =
              (age / internals.contractIn) * internals.contractDepth
          } else if (age < internals.contractIn + internals.contractOut) {
            const ct =
              (age - internals.contractIn) / internals.contractOut
            contractPulse = internals.contractDepth * (1 - ct * ct)
          } else {
            internals.contractStart = -1
          }
        }
        material.uniforms.uContractPulse.value = contractPulse * ti

        // Subtle oscillation
        group.rotation.x =
          Math.sin(internals.scaledTime * 0.15) *
          DEFAULT_CONFIG.rotationOscillationX

        // Reset animation
        if (internals.resetAnim) {
          const rt =
            Math.min(
              (performance.now() - internals.resetAnim.startTime) /
                internals.resetAnim.duration,
              1,
            )
          const e = easeInOutCubic(rt)

          camera.position.lerpVectors(
            internals.resetAnim.startPos,
            internals.initialCameraPos,
            e,
          )
          orbitControls.target.lerpVectors(
            internals.resetAnim.startTarget,
            internals.initialControlsTarget,
            e,
          )

          const wallTime = performance.now() / 1000
          group.rotation.x =
            internals.resetAnim.startRotation.x * (1 - e) +
            Math.sin(wallTime * 0.15) *
              DEFAULT_CONFIG.rotationOscillationX *
              e
          group.rotation.y =
            internals.resetAnim.startRotation.y * (1 - e)
          group.rotation.z =
            internals.resetAnim.startRotation.z * (1 - e)

          if (rt >= 1) internals.resetAnim = null
        }

        orbitControls.update()
        renderer.render(scene, camera)
      }

      animate()
    }

    init()

    return () => {
      cancelled = true
      if (internals) {
        internals.dispose()
        internalsRef.current = null
      }
    }
  }, [isClient])

  // ─── Resize observer ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!isClient || !containerRef.current) return

    const container = containerRef.current
    const observer = new ResizeObserver((entries) => {
      const internals = internalsRef.current
      if (!internals) return
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width === 0 || height === 0) return
      internals.camera.aspect = width / height
      internals.camera.updateProjectionMatrix()
      internals.renderer.setSize(width, height)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [isClient])

  // ─── Prop sync effects ────────────────────────────────────────────

  // Speed
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.speed = props.speed ?? 1
    }
  }, [props.speed])

  // Think intensity (external)
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.externalThinkIntensity =
        props.thinkIntensity ?? null
    }
  }, [props.thinkIntensity])

  // Think effects
  React.useEffect(() => {
    const internals = internalsRef.current
    if (!internals) return
    const e = {
      pulses: props.thinkEffects?.pulses ?? true,
      ramp: props.thinkEffects?.ramp ?? true,
      scatter: props.thinkEffects?.scatter ?? true,
    }
    internals.effectsEnabled = e
    const { material } = internals.particleSystem
    material.uniforms.uPulseEnabled.value = e.pulses ? 1.0 : 0.0
    material.uniforms.uRampEnabled.value = e.ramp ? 1.0 : 0.0
    material.uniforms.uScatterEnabled.value = e.scatter ? 1.0 : 0.0
  }, [
    props.thinkEffects?.pulses,
    props.thinkEffects?.ramp,
    props.thinkEffects?.scatter,
  ])

  // Auto-rotate
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.orbitControls.autoRotate =
        props.autoRotate ?? true
    }
  }, [props.autoRotate])

  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.orbitControls.autoRotateSpeed =
        props.autoRotateSpeed ?? 0.5
    }
  }, [props.autoRotateSpeed])

  // Orbit controls enable/disable
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.orbitControls.enabled =
        props.orbitControls !== false
    }
  }, [props.orbitControls])

  // Scale
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.group.scale.setScalar(props.scale ?? 1)
    }
  }, [props.scale])

  // Waves (noise amplitude multiplier)
  React.useEffect(() => {
    const internals = internalsRef.current
    if (!internals) return
    const mult = props.waves ?? 1
    const { material } = internals.particleSystem
    material.uniforms.uNoiseAmplitude.value =
      DEFAULT_CONFIG.noiseAmplitude * mult
    material.uniforms.uTurbulenceAmplitude.value =
      DEFAULT_CONFIG.turbulenceAmplitude * mult
    material.uniforms.uSwirlAmount.value =
      DEFAULT_CONFIG.swirlAmount * mult
  }, [props.waves])

  // Dot size
  React.useEffect(() => {
    const internals = internalsRef.current
    if (!internals) return
    const mult = props.dotSize ?? 1
    const { material } = internals.particleSystem
    material.uniforms.uBaseSize.value =
      DEFAULT_CONFIG.particleBaseSize * mult
    material.uniforms.uMaxSize.value =
      DEFAULT_CONFIG.particleMaxSize * mult
  }, [props.dotSize])

  // Blur
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.particleSystem.material.uniforms.uDotSoftness.value =
        0.48 * (1 - (props.blur ?? 0.5))
    }
  }, [props.blur])

  // Color scheme / colors / saturation / lightness
  React.useEffect(() => {
    const internals = internalsRef.current
    if (!internals) return
    const colors: GradientColors =
      props.colors ?? COLOR_SCHEMES[props.colorScheme ?? "solar"].colors
    internals.baseHSL = colors.map(
      (c) => rgbToHsl(c[0], c[1], c[2]) as [number, number, number],
    )
    internals.saturationMult = props.saturation ?? 1
    internals.lightnessMult = props.lightness ?? 1
    applyGradient(internals)
  }, [props.colorScheme, props.colors, props.saturation, props.lightness])

  // Background color
  React.useEffect(() => {
    if (internalsRef.current) {
      internalsRef.current.renderer.setClearColor(
        props.backgroundColor ?? DEFAULT_CONFIG.backgroundColor,
      )
    }
  }, [props.backgroundColor])

  // ─── Reduced motion ───────────────────────────────────────────────
  React.useEffect(() => {
    if (!isClient) return

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")

    function handleChange() {
      const internals = internalsRef.current
      if (!internals) return
      if (mql.matches) {
        internals.paused = true
        internals.orbitControls.autoRotate = false
        internals.renderOnce()
      } else {
        internals.paused = false
        internals.orbitControls.autoRotate =
          propsRef.current.autoRotate ?? true
      }
    }

    mql.addEventListener("change", handleChange)
    handleChange()
    return () => mql.removeEventListener("change", handleChange)
  }, [isClient])

  // ─── Imperative handle ────────────────────────────────────────────
  React.useImperativeHandle(ref, () => ({
    startThinking() {
      const internals = internalsRef.current
      if (!internals) return
      internals.externalThinkIntensity = null
      internals.thinkActive = true
    },
    stopThinking() {
      const internals = internalsRef.current
      if (!internals) return
      internals.externalThinkIntensity = null
      internals.thinkActive = false
    },
    getThinkIntensity() {
      return internalsRef.current?.thinkIntensity ?? 0
    },
    setThinkIntensity(value: number) {
      if (internalsRef.current) {
        internalsRef.current.externalThinkIntensity = Math.max(
          0,
          Math.min(1, value),
        )
      }
    },
    setMode(mode: GeometryMode) {
      internalsRef.current?.particleSystem.setMode(mode)
    },
    setColorScheme(scheme: ColorScheme) {
      const internals = internalsRef.current
      if (!internals) return
      const colors = COLOR_SCHEMES[scheme].colors
      internals.baseHSL = colors.map(
        (c) => rgbToHsl(c[0], c[1], c[2]) as [number, number, number],
      )
      applyGradient(internals)
    },
    setColors(colors: GradientColors) {
      const internals = internalsRef.current
      if (!internals) return
      internals.baseHSL = colors.map(
        (c) => rgbToHsl(c[0], c[1], c[2]) as [number, number, number],
      )
      applyGradient(internals)
    },
    resetCamera() {
      const internals = internalsRef.current
      if (!internals) return
      internals.resetAnim = {
        startPos: internals.camera.position.clone(),
        startTarget: internals.orbitControls.target.clone(),
        startRotation: internals.group.rotation.clone(),
        startTime: performance.now(),
        duration: 800,
      }
    },
    dispose() {
      internalsRef.current?.dispose()
      internalsRef.current = null
    },
  }))

  return (
    <div
      ref={containerRef}
      className={cn(styles.container, props.className)}
      style={props.style}
      role="img"
      aria-label="Particle sphere visualization"
    />
  )
})

Sphere.displayName = "Sphere"

export { Sphere }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyGradient(internals: SphereInternals): void {
  const colors =
    internals.particleSystem.material.uniforms.uGradientColors.value
  for (let i = 0; i < internals.baseHSL.length; i++) {
    const [h, s, l] = internals.baseHSL[i]
    const newS = Math.min(s * internals.saturationMult, 1.0)
    const newL = Math.min(l * internals.lightnessMult, 1.0)
    const [r, g, b] = hslToRgb(h, newS, newL)
    colors[i].setRGB(r, g, b, "srgb-linear")
  }
}
