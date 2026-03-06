import * as THREE from 'three'

export const configState = {
  cubePos: new THREE.Vector3(0, 3.35, -32.58),
  cubeRot: new THREE.Euler(0, 0, 30.7 * (Math.PI / 180)),
  cubeScale: 2.28,
  particlesCenter: new THREE.Vector3(0, 0, 0),
  camera: { distance: 13.9, height: 11.8, fov: 56.5, targetY: 0.7 },
}
