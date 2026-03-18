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
  E_MOUSE: 62,
  E_GUIDE: 160.0,
  E_CUBE: 14.0,
  CUBE_RADIUS: 4.8,
  B_STRENGTH: 0.6,
  DAMPING: 4.55,
  MAX_SPEED: 9.8,
  MIN_ORBIT_SPEED: 1.95,
  ORBIT_FORCE: 0.6,
  ORBIT_TARGET_SPEED: 1.7,
  SOFT_MIN: 0.4,
  REPULSION: 55.0,
  REPULSION_RADIUS: 10.2,
  SIZE_MIN: 0.15,
  SIZE_MAX: 0.5,
  SIZE_SCALE: 2.3,
  SPAWN_RADIUS: 5.0,
  BOUNDARY: 14.0,
}

export const TINTS: [number, number, number][] = [
  [0.2, 0.5, 1.0], [1.0, 0.2, 0.2], [0.2, 1.0, 0.3],
  [0.8, 0.2, 1.0], [1.0, 0.7, 0.1], [0.1, 0.9, 0.9],
]

export const cubeUniforms = {
  colorTint: uniform(new THREE.Color('#c4c4c4')),
  metalness: uniform(0.31),
  roughness: uniform(0),
  opacity: uniform(1),
  transmission: uniform(0.8),
  ior: uniform(2.95),
  thickness: uniform(4.1),
  clearcoat: uniform(0),
  clearcoatRoughness: uniform(0),
}

export const floorUniforms = {
  textureScaleX: uniform(8.1),
  textureScaleY: uniform(2.8),
  metalnessWhite: uniform(1.0),
  metalnessBlack: uniform(1.0),
  roughnessWhite: uniform(0.83),
  roughnessBlack: uniform(0.4),
}
