import * as THREE from 'three'
import { create } from 'zustand'
import { SYSTEM, TINTS } from './constants'

export const sharedState = {
  mouseWorld: new THREE.Vector3(),
  cubeCenter: new THREE.Vector3(),
  guidePos: new THREE.Vector3(),
}

interface SceneStore {
  visibleCount: number
  guideIndex: number
  guideColorIndex: number
  cursorHidden: boolean
  spawnParticle: () => void
  hideCursor: () => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  visibleCount: 0,
  guideIndex: 0,
  guideColorIndex: 0,
  cursorHidden: false,
  hideCursor: () => set({ cursorHidden: true }),
  spawnParticle: () => set((state) => {
    if (state.visibleCount >= SYSTEM.COUNT) return state
    return {
      guideIndex: state.visibleCount,
      visibleCount: state.visibleCount + 1,
      guideColorIndex: (state.guideColorIndex + 1) % TINTS.length,
    }
  }),
}))
