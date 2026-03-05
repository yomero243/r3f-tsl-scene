import * as THREE from 'three'

export const configState = {
  cubePos: new THREE.Vector3(0, 2.92, -1.26),
  cubeRot: new THREE.Euler(30 * (Math.PI / 180), 0, 0),
  particlesCenter: new THREE.Vector3(0, 0, 0),
  camera: { distance: 24, height: 8.5 },
}
