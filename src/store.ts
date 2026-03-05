import * as THREE from 'three'

// Shared mutable vectors for cross-component communication (updated every frame)
// CubeModel writes → LorentzParticles reads
export const sharedState = {
  mouseWorld: new THREE.Vector3(),
  cubeCenter: new THREE.Vector3(),
  visibleCount: 1,
  guideIndex: 0,
}
