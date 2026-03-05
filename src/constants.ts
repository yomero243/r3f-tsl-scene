import * as THREE from 'three'
import { uniform } from 'three/tsl'

export const LIGHTS = {
  guideIntensity: 765,
  guideDistance: 0,
  particleIntensity: 80,
  particleDistance: 60,
  cubeLightIntensity: 195,
  cubeLightDistance: 17,
  lightStick: 0,
}

export const shaderUniforms = {
  coreStrength: uniform(1.5),
  rimStrength: uniform(0.35),
  outerGlowStrength: uniform(0.25),
  glowPower: uniform(3.3),
  sparkleStrength: uniform(1.2),
  pulseSpeed: uniform(7.4),
  pulseAmp: uniform(0.1),
}

export const SYSTEM = {
  COUNT: 30,
  MAX_LIGHTS: 8,
  E_MOUSE: 44.5,
  E_CUBE: 8.0,
  B_STRENGTH: 4.7,
  DAMPING: 6.55,
  MAX_SPEED: 6.0,
  SOFT_MIN: 0.4,
  REPULSION: 34.0,
  REPULSION_RADIUS: 5.3,
  SIZE_MIN: 0.15,
  SIZE_MAX: 0.5,
  SPAWN_RADIUS: 8.1,
  BOUNDARY: 8.0,
}

export const TINTS: [number, number, number][] = [
  [0.2, 0.5, 1.0], [1.0, 0.2, 0.2], [0.2, 1.0, 0.3],
  [0.8, 0.2, 1.0], [1.0, 0.7, 0.1], [0.1, 0.9, 0.9],
]

export const cubeUniforms = {
  colorTint: uniform(new THREE.Color('#c4c4c4')),
  metalness: uniform(0.91),
  roughness: uniform(0.06),
  opacity: uniform(0.52),
  transmission: uniform(0.66),
  ior: uniform(2.24),
  thickness: uniform(3.4),
  clearcoat: uniform(0.54),
  clearcoatRoughness: uniform(0.64),
}

export const floorUniforms = {
  textureScaleX: uniform(8.1),
  textureScaleY: uniform(2.8),
  metalnessWhite: uniform(0.50),
  metalnessBlack: uniform(1.0),
  roughnessWhite: uniform(1.0),
  roughnessBlack: uniform(0.22),
}
