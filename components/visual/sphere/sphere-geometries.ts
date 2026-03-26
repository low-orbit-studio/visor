import type { GeometryMode } from "./sphere.types"

// ---------------------------------------------------------------------------
// GLSL displacement snippets per geometry mode
// ---------------------------------------------------------------------------

export const SHADER_DISPLACEMENTS: Record<GeometryMode, string> = {
  sphere: `
    float n1 = snoise(aBasePosition * uNoiseScale + t);
    float n2 = snoise(aBasePosition * uTurbulenceScale + t * 1.5 + 100.0);
    float disp = (n1 * uNoiseAmplitude + n2 * uTurbulenceAmplitude) * rampBoost;
    displaced = aBasePosition + normal * disp;
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + 0.001));
    displaced += tangent * snoise(aBasePosition * 2.0 + uTime * 0.08) * uSwirlAmount * rampBoost;
  `,
  curl: `
    vec3 curl = curlNoise(aBasePosition * uNoiseScale * 0.8 + t * 0.3);
    vec3 tangentialCurl = curl - normal * dot(curl, normal);
    float radialNoise = snoise(aBasePosition * uTurbulenceScale + t * 1.5 + 100.0);
    displaced = aBasePosition + tangentialCurl * uSwirlAmount * 1.5 * rampBoost
              + normal * radialNoise * uTurbulenceAmplitude * 0.5 * rampBoost;
  `,
  turing: `
    float tSlow = t * 0.5;
    float activator = snoise(aBasePosition * uNoiseScale * 3.0 + tSlow * 0.8);
    float inhibitor = snoise(aBasePosition * uNoiseScale * 7.0 + tSlow * 1.2 + 50.0);
    float pattern = smoothstep(-0.1, 0.3, activator - inhibitor * 0.7);
    float act2 = snoise(aBasePosition * uNoiseScale * 5.0 + tSlow * 0.6 + 100.0);
    float inh2 = snoise(aBasePosition * uNoiseScale * 11.0 + tSlow * 1.0 + 150.0);
    float pattern2 = smoothstep(-0.1, 0.3, act2 - inh2 * 0.7);
    float combined = pattern * 0.6 + pattern2 * 0.4;
    float disp = combined * uNoiseAmplitude * 1.5 * rampBoost;
    displaced = aBasePosition + normal * disp;
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + 0.001));
    displaced += tangent * snoise(aBasePosition * 2.0 + tSlow * 0.3) * uSwirlAmount * 0.4 * rampBoost;
  `,
  lorenz: `
    float n1 = snoise(aBasePosition * uNoiseScale * 2.0 + t);
    float n2 = snoise(aBasePosition * uTurbulenceScale * 2.0 + t * 1.5 + 100.0);
    float n3 = snoise(aBasePosition * uNoiseScale * 2.0 + t + 200.0);
    displaced = aBasePosition + vec3(n1, n2, n3) * uNoiseAmplitude * 0.4 * rampBoost;
  `,
  tendrils: `
    float n1 = snoise(aBasePosition * uNoiseScale * 1.5 + t);
    float n2 = snoise(aBasePosition * uNoiseScale * 1.5 + t + 100.0);
    float n3 = snoise(aBasePosition * uNoiseScale * 1.5 + t + 200.0);
    float d1 = snoise(aBasePosition * uTurbulenceScale * 2.0 + t * 1.5 + 300.0);
    float d2 = snoise(aBasePosition * uTurbulenceScale * 2.0 + t * 1.5 + 400.0);
    float d3 = snoise(aBasePosition * uTurbulenceScale * 2.0 + t * 1.5 + 500.0);
    displaced = aBasePosition + vec3(n1+d1*0.3, n2+d2*0.3, n3+d3*0.3) * uNoiseAmplitude * 0.35 * rampBoost;
  `,
}

/** Mode name -> integer ID (order matches GEOMETRY_MODES array) */
export const MODE_IDS: Record<GeometryMode, number> = {
  sphere: 0,
  curl: 1,
  turing: 2,
  lorenz: 3,
  tendrils: 4,
}

// ---------------------------------------------------------------------------
// CPU position generators
// ---------------------------------------------------------------------------

export function generateSphere(
  positions: Float32Array,
  count: number,
  radius: number,
): void {
  const goldenAngle = Math.PI * (1 + Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count)
    const theta = goldenAngle * i
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[i * 3 + 1] = Math.cos(phi) * radius
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
  }
}

export function generateLorenz(
  positions: Float32Array,
  count: number,
  radius: number,
): void {
  const sigma = 10
  const rho = 28
  const beta = 8 / 3
  const dt = 0.005
  const scale = radius / 25

  for (let i = 0; i < count; i++) {
    let lx = 0.1 + Math.random() * 0.01
    let ly = Math.random() * 0.01
    let lz = Math.random() * 0.01

    const steps = 200 + Math.floor(Math.random() * 2000)
    for (let s = 0; s < steps; s++) {
      const dx = sigma * (ly - lx)
      const dy = lx * (rho - lz) - ly
      const dz = lx * ly - beta * lz
      lx += dx * dt
      ly += dy * dt
      lz += dz * dt
    }

    positions[i * 3] = lx * scale
    positions[i * 3 + 1] = (lz - 25) * scale
    positions[i * 3 + 2] = ly * scale
  }
}

export function generateTendrils(
  positions: Float32Array,
  count: number,
  radius: number,
): void {
  function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return s / 2147483647
    }
  }

  const numTendrils = 80
  const particlesPerTendril = Math.floor(count / numTendrils)
  const remaining = count - numTendrils * particlesPerTendril

  let idx = 0
  for (let t = 0; t < numTendrils; t++) {
    const rng = seededRandom(t * 1337 + 42)
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const dirX = Math.sin(phi) * Math.cos(theta)
    const dirY = Math.cos(phi)
    const dirZ = Math.sin(phi) * Math.sin(theta)

    const pCount = particlesPerTendril + (t < remaining ? 1 : 0)
    for (let p = 0; p < pCount && idx < count; p++) {
      const frac = p / pCount
      const dist = frac * radius * 1.4
      const noiseScale = 0.3 + frac * 0.6

      positions[idx * 3] = dirX * dist + (rng() - 0.5) * noiseScale
      positions[idx * 3 + 1] = dirY * dist + (rng() - 0.5) * noiseScale
      positions[idx * 3 + 2] = dirZ * dist + (rng() - 0.5) * noiseScale
      idx++
    }
  }
}

const GENERATORS: Record<
  GeometryMode,
  (positions: Float32Array, count: number, radius: number) => void
> = {
  sphere: generateSphere,
  curl: generateSphere, // curl uses sphere positions with different shader displacement
  turing: generateSphere, // turing uses sphere positions with different shader displacement
  lorenz: generateLorenz,
  tendrils: generateTendrils,
}

export function generatePositions(
  mode: GeometryMode,
  positions: Float32Array,
  count: number,
  radius: number,
): void {
  GENERATORS[mode](positions, count, radius)
}
