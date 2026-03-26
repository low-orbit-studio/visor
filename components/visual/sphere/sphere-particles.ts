import type * as THREE_NS from "three"
import type { GeometryMode } from "./sphere.types"
import { DEFAULT_CONFIG } from "./sphere.types"
import { generatePositions, MODE_IDS } from "./sphere-geometries"
import { buildVertexShader, buildFragmentShader } from "./sphere-shaders"
import { GEOMETRY_MODES } from "./sphere.types"

export interface ParticleSystemConfig {
  particleCount: number
  sphereRadius: number
  particleBaseSize: number
  particleSizeVariation: number
  particleSizeScale: number
  particleMaxSize: number
  particlePulseAmount: number
  dotSoftness: number
  alphaBase: number
  alphaBreathRange: number
  alphaDepthMin: number
  alphaFinal: number
  sparkleChance: number
  sparkleWhiteMix: number
  sparkleSizeBoost: number
  sparkleAlphaBoost: number
  noiseScale: number
  noiseSpeed: number
  noiseAmplitude: number
  turbulenceScale: number
  turbulenceAmplitude: number
  swirlAmount: number
  gradientColors: Array<[number, number, number]>
}

export interface ParticleSystem {
  points: THREE_NS.Points
  material: THREE_NS.ShaderMaterial
  geometry: THREE_NS.BufferGeometry
  setMode: (mode: GeometryMode) => void
  dispose: () => void
}

export function createParticleSystem(
  THREE: typeof THREE_NS,
  config: ParticleSystemConfig = DEFAULT_CONFIG,
): ParticleSystem {
  const count = config.particleCount
  const positions = new Float32Array(count * 3)
  const basePositions = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  const sizes = new Float32Array(count)
  const brightness = new Float32Array(count)

  generatePositions("sphere", positions, count, config.sphereRadius)
  for (let i = 0; i < count * 3; i++) basePositions[i] = positions[i]
  for (let i = 0; i < count; i++) {
    phases[i] = Math.random() * Math.PI * 2
    sizes[i] = Math.random() * config.particleSizeVariation
    brightness[i] =
      Math.random() < config.sparkleChance
        ? Math.random() * 0.5 + 0.5
        : 0.0
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  )
  geometry.setAttribute(
    "aBasePosition",
    new THREE.BufferAttribute(basePositions, 3),
  )
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute(
    "aBrightness",
    new THREE.BufferAttribute(brightness, 1),
  )

  const material = new THREE.ShaderMaterial({
    vertexShader: buildVertexShader(GEOMETRY_MODES),
    fragmentShader: buildFragmentShader(),
    uniforms: {
      uTime: { value: 0 },
      uNoiseScale: { value: config.noiseScale },
      uNoiseSpeed: { value: config.noiseSpeed },
      uNoiseAmplitude: { value: config.noiseAmplitude },
      uTurbulenceScale: { value: config.turbulenceScale },
      uTurbulenceAmplitude: { value: config.turbulenceAmplitude },
      uSwirlAmount: { value: config.swirlAmount },
      uBaseSize: { value: config.particleBaseSize },
      uSizeScale: { value: config.particleSizeScale },
      uMaxSize: { value: config.particleMaxSize },
      uPulseAmount: { value: config.particlePulseAmount },
      uAlphaBase: { value: config.alphaBase },
      uAlphaBreathRange: { value: config.alphaBreathRange },
      uAlphaDepthMin: { value: config.alphaDepthMin },
      uAlphaFinal: { value: config.alphaFinal },
      uDotSoftness: { value: config.dotSoftness },
      uSparkleWhiteMix: { value: config.sparkleWhiteMix },
      uSparkleSizeBoost: { value: config.sparkleSizeBoost },
      uSparkleAlphaBoost: { value: config.sparkleAlphaBoost },
      uGradientColors: {
        value: config.gradientColors.map(
          (c) =>
            new THREE.Color().setRGB(
              c[0],
              c[1],
              c[2],
              THREE.LinearSRGBColorSpace,
            ),
        ),
      },
      uGeometryMode: { value: 0 },
      uThinkIntensity: { value: 0 },
      uPulseEnabled: { value: 0 },
      uPulseOrigins: {
        value: Array.from({ length: 6 }, () => new THREE.Vector3()),
      },
      uPulseTimes: { value: new Float32Array(6).fill(-1) },
      uRampEnabled: { value: 0 },
      uScatterEnabled: { value: 0 },
      uContractPulse: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const points = new THREE.Points(geometry, material)

  function setMode(modeName: GeometryMode): void {
    generatePositions(modeName, positions, count, config.sphereRadius)
    for (let i = 0; i < count * 3; i++) basePositions[i] = positions[i]
    for (let i = 0; i < count; i++) {
      phases[i] = Math.random() * Math.PI * 2
      sizes[i] = Math.random() * config.particleSizeVariation
      brightness[i] =
        Math.random() < config.sparkleChance
          ? Math.random() * 0.5 + 0.5
          : 0.0
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aBasePosition.needsUpdate = true
    geometry.attributes.aPhase.needsUpdate = true
    geometry.attributes.aSize.needsUpdate = true
    geometry.attributes.aBrightness.needsUpdate = true
    material.uniforms.uGeometryMode.value = MODE_IDS[modeName]
  }

  function dispose(): void {
    geometry.dispose()
    material.dispose()
  }

  return { points, material, geometry, setMode, dispose }
}
