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
  E_GUIDE: 120.0,
  E_CUBE: 28.0,
  CUBE_RADIUS: 2.5,
  B_STRENGTH: 3.0,
  DAMPING: 1.5,
  MAX_SPEED: 5.0,
  MIN_ORBIT_SPEED: 1.0,
  ORBIT_FORCE: 5.0,
  ORBIT_TARGET_SPEED: 2.5,
  SOFT_MIN: 0.4,
  REPULSION: 20.0,
  REPULSION_RADIUS: 3.5,
  SIZE_MIN: 0.15,
  SIZE_MAX: 0.5,
  SIZE_SCALE: 1.0,
  SPAWN_RADIUS: 5.0,
  BOUNDARY: 14.0,
}

export const TINTS: [number, number, number][] = [
  [0.2, 0.5, 1.0], [1.0, 0.2, 0.2], [0.2, 1.0, 0.3],
  [0.8, 0.2, 1.0], [1.0, 0.7, 0.1], [0.1, 0.9, 0.9],
]

export const cubeUniforms = {
  colorTint: uniform(new THREE.Color('#c4c4c4')),
  metalness: uniform(0.61),
  roughness: uniform(0.3),
  opacity: uniform(0.54),
  transmission: uniform(0.89),
  ior: uniform(2.05),
  thickness: uniform(0.6),
  clearcoat: uniform(0.36),
  clearcoatRoughness: uniform(0.59),
}

export const floorUniforms = {
  textureScaleX: uniform(8.1),
  textureScaleY: uniform(2.8),
  metalnessWhite: uniform(1.0),
  metalnessBlack: uniform(0.78),
  roughnessWhite: uniform(0.4),
  roughnessBlack: uniform(0.12),
}
