import type { GeometryMode } from "./sphere.types"
import { SHADER_DISPLACEMENTS } from "./sphere-geometries"
import { DEFAULT_CONFIG } from "./sphere.types"

// ---------------------------------------------------------------------------
// GLSL Simplex noise (3D)
// ---------------------------------------------------------------------------

export const SIMPLEX_NOISE_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 curlNoise(vec3 p) {
  float e = 0.01;
  float n1 = snoise(p + vec3(e, 0, 0)); float n2 = snoise(p - vec3(e, 0, 0));
  float n3 = snoise(p + vec3(0, e, 0)); float n4 = snoise(p - vec3(0, e, 0));
  float n5 = snoise(p + vec3(0, 0, e)); float n6 = snoise(p - vec3(0, 0, e));
  float n1b = snoise(p + vec3(e, 0, 0) + 100.0); float n2b = snoise(p - vec3(e, 0, 0) + 100.0);
  float n3b = snoise(p + vec3(0, e, 0) + 100.0); float n4b = snoise(p - vec3(0, e, 0) + 100.0);
  float n5b = snoise(p + vec3(0, 0, e) + 100.0); float n6b = snoise(p - vec3(0, 0, e) + 100.0);
  return vec3((n4b-n3b)-(n5-n6), (n5b-n6b)-(n1-n2), (n1b-n2b)-(n3-n4)) / (2.0*e);
}
`

// ---------------------------------------------------------------------------
// Vertex shader
// ---------------------------------------------------------------------------

function buildModeSwitch(modes: GeometryMode[]): string {
  return modes
    .map(
      (mode, i) =>
        `    case ${i}: {\n${SHADER_DISPLACEMENTS[mode]}\n    } break;`,
    )
    .join("\n")
}

export function buildVertexShader(modes: GeometryMode[]): string {
  return `
${SIMPLEX_NOISE_GLSL}

attribute float aPhase;
attribute float aSize;
attribute float aBrightness;
attribute vec3 aBasePosition;

uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uNoiseAmplitude;
uniform float uTurbulenceScale;
uniform float uTurbulenceAmplitude;
uniform float uSwirlAmount;
uniform float uBaseSize;
uniform float uSizeScale;
uniform float uMaxSize;
uniform float uPulseAmount;
uniform float uAlphaBase;
uniform float uAlphaBreathRange;
uniform float uAlphaDepthMin;
uniform float uSparkleSizeBoost;

uniform int uGeometryMode;
uniform float uThinkIntensity;
uniform float uPulseEnabled;
uniform vec3 uPulseOrigins[6];
uniform float uPulseTimes[6];
uniform float uRampEnabled;
uniform float uScatterEnabled;
uniform float uContractPulse;

varying float vAlpha;
varying float vY;
varying float vBrightness;
varying float vPulseBrightness;

void main() {
  vec3 normal = normalize(aBasePosition);
  vY = normal.y;

  float t = uTime * uNoiseSpeed;
  float rampBoost = 1.0 + uThinkIntensity * uRampEnabled * 0.15;
  vec3 displaced;

  switch (uGeometryMode) {
${buildModeSwitch(modes)}
    default: {
      displaced = aBasePosition;
    } break;
  }

  // Effect: Staccato scatter
  if (uThinkIntensity > 0.0 && uScatterEnabled > 0.0) {
    float selection = snoise(aBasePosition * 5.0);
    if (selection > 0.3) {
      float scatterSeed = snoise(aBasePosition * 8.0 + 50.0);
      float scatterAmount = (0.3 + scatterSeed * 0.7) * uThinkIntensity * uScatterEnabled;
      scatterAmount *= (1.0 - uContractPulse);
      displaced += normal * scatterAmount * 0.45;
      vec3 drift = normalize(cross(normal, vec3(sin(aPhase), cos(aPhase), 0.0)));
      displaced += drift * scatterAmount * 0.15;
    }
  }

  // Effect: Pulse waves
  float pb = 0.0;
  if (uThinkIntensity > 0.0 && uPulseEnabled > 0.0) {
    vec3 unitPos = normalize(aBasePosition);
    for (int p = 0; p < 6; p++) {
      if (uPulseTimes[p] < 0.0) continue;
      float age = uTime - uPulseTimes[p];
      float waveFront = age * 1.0;
      float dist = distance(unitPos, uPulseOrigins[p]);
      float ring = 1.0 - smoothstep(0.0, 0.12, abs(dist - waveFront));
      float fade = exp(-age * 2.0);
      pb += ring * fade * uThinkIntensity * uPulseEnabled;
    }
  }
  vPulseBrightness = pb;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

  // Depth-based opacity
  float depth = -mvPosition.z;
  float depthFade = smoothstep(7.0, 2.5, depth);
  vAlpha = max(depthFade, uAlphaDepthMin) * (uAlphaBase + uAlphaBreathRange * sin(uTime * 0.3 + aPhase));

  vBrightness = aBrightness;

  // Particle size
  float pulse = sin(uTime * 0.6 + aPhase) * uPulseAmount;
  float size = (uBaseSize + aSize * 0.7 + pulse) * (uSizeScale / depth);
  size *= (1.0 + aBrightness * uSparkleSizeBoost);

  gl_PointSize = clamp(size, 0.5, uMaxSize);
  gl_Position = projectionMatrix * mvPosition;
}
`
}

// ---------------------------------------------------------------------------
// Fragment shader
// ---------------------------------------------------------------------------

export function buildFragmentShader(
  gradientStops: readonly number[] = DEFAULT_CONFIG.gradientStops,
  colorCount: number = 5,
): string {
  let mixLogic = ""
  for (let i = 0; i < colorCount - 1; i++) {
    const cond = i === 0 ? "if" : "} else if"
    const upper = gradientStops[i + 1]
    const lower = gradientStops[i]
    const range = (upper - lower).toFixed(3)
    if (i < colorCount - 2) {
      mixLogic += `  ${cond} (t < ${upper.toFixed(3)}) {\n`
      mixLogic += `    color = mix(uGradientColors[${i}], uGradientColors[${i + 1}], (t - ${lower.toFixed(3)}) / ${range});\n`
    } else {
      mixLogic += `  } else {\n`
      mixLogic += `    color = mix(uGradientColors[${i}], uGradientColors[${i + 1}], (t - ${lower.toFixed(3)}) / ${range});\n`
      mixLogic += `  }\n`
    }
  }

  return `
varying float vAlpha;
varying float vY;
varying float vBrightness;
varying float vPulseBrightness;

uniform float uDotSoftness;
uniform float uSparkleWhiteMix;
uniform float uAlphaFinal;
uniform float uSparkleAlphaBoost;
uniform vec3 uGradientColors[${colorCount}];

vec3 colorGradient(float y) {
  float t = y * 0.5 + 0.5;
  vec3 color;
${mixLogic}
  return color;
}

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, uDotSoftness, dist);
  vec3 color = colorGradient(vY);
  color = mix(color, vec3(1.0), vBrightness * uSparkleWhiteMix);
  float finalAlpha = alpha * vAlpha * (uAlphaFinal + vBrightness * uSparkleAlphaBoost);

  // Pulse wave glow
  color += vec3(0.4, 0.6, 1.0) * vPulseBrightness;
  finalAlpha += vPulseBrightness * 0.6;

  gl_FragColor = vec4(color, finalAlpha);
}
`
}
