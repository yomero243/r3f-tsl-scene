import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import GUI from 'lil-gui'
import { floorUniforms, cubeUniforms, SYSTEM } from '../constants'
import { configState } from '../config'

export const guiState = { envIntensity: 0.23, envRotY: 141 }

// ── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'r3f-tsl-scene-gui'

function saveAll() {
  const data = {
    floor: {
      metalnessWhite: floorUniforms.metalnessWhite.value,
      metalnessBlack: floorUniforms.metalnessBlack.value,
      roughnessWhite: floorUniforms.roughnessWhite.value,
      roughnessBlack: floorUniforms.roughnessBlack.value,
    },
    env: { ...guiState },
    cubeMat: {
      metalness: cubeUniforms.metalness.value,
      roughness: cubeUniforms.roughness.value,
      opacity: cubeUniforms.opacity.value,
      transmission: cubeUniforms.transmission.value,
      ior: cubeUniforms.ior.value,
      thickness: cubeUniforms.thickness.value,
      clearcoat: cubeUniforms.clearcoat.value,
      clearcoatRoughness: cubeUniforms.clearcoatRoughness.value,
    },
    cube: {
      posX: configState.cubePos.x,
      posY: configState.cubePos.y,
      posZ: configState.cubePos.z,
      rotX: configState.cubeRot.x,
      rotY: configState.cubeRot.y,
      rotZ: configState.cubeRot.z,
      scale: configState.cubeScale,
    },
    camera: { ...configState.camera },
    particles: {
      orbitStrength: SYSTEM.B_STRENGTH,
      sizeScale: SYSTEM.SIZE_SCALE,
      damping: SYSTEM.DAMPING,
      eMouse: SYSTEM.E_MOUSE,
      eGuide: SYSTEM.E_GUIDE,
      eCube: SYSTEM.E_CUBE,
      repulsion: SYSTEM.REPULSION,
      repulsionRadius: SYSTEM.REPULSION_RADIUS,
      maxSpeed: SYSTEM.MAX_SPEED,
      minOrbitSpeed: SYSTEM.MIN_ORBIT_SPEED,
      orbitForce: SYSTEM.ORBIT_FORCE,
      orbitTargetSpeed: SYSTEM.ORBIT_TARGET_SPEED,
      cubeRadius: SYSTEM.CUBE_RADIUS,
    },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const d = JSON.parse(raw)

    if (d.floor) {
      floorUniforms.metalnessWhite.value = d.floor.metalnessWhite
      floorUniforms.metalnessBlack.value = d.floor.metalnessBlack
      floorUniforms.roughnessWhite.value  = d.floor.roughnessWhite
      floorUniforms.roughnessBlack.value  = d.floor.roughnessBlack
    }
    if (d.env) {
      guiState.envIntensity = d.env.envIntensity
      guiState.envRotY      = d.env.envRotY
    }
    if (d.cubeMat) {
      cubeUniforms.metalness.value        = d.cubeMat.metalness
      cubeUniforms.roughness.value        = d.cubeMat.roughness
      cubeUniforms.opacity.value          = d.cubeMat.opacity
      cubeUniforms.transmission.value     = d.cubeMat.transmission
      cubeUniforms.ior.value              = d.cubeMat.ior
      cubeUniforms.thickness.value        = d.cubeMat.thickness
      cubeUniforms.clearcoat.value        = d.cubeMat.clearcoat
      cubeUniforms.clearcoatRoughness.value = d.cubeMat.clearcoatRoughness
    }
    if (d.cube) {
      configState.cubePos.set(d.cube.posX, d.cube.posY, d.cube.posZ)
      configState.cubeRot.set(d.cube.rotX, d.cube.rotY, d.cube.rotZ)
      configState.cubeScale = d.cube.scale
    }
    if (d.camera) {
      Object.assign(configState.camera, d.camera)
    }
    if (d.particles) {
      SYSTEM.B_STRENGTH       = d.particles.orbitStrength    ?? SYSTEM.B_STRENGTH
      SYSTEM.SIZE_SCALE       = d.particles.sizeScale        ?? SYSTEM.SIZE_SCALE
      SYSTEM.DAMPING          = d.particles.damping          ?? SYSTEM.DAMPING
      SYSTEM.E_MOUSE          = d.particles.eMouse           ?? SYSTEM.E_MOUSE
      SYSTEM.E_GUIDE          = d.particles.eGuide           ?? SYSTEM.E_GUIDE
      SYSTEM.E_CUBE           = d.particles.eCube            ?? SYSTEM.E_CUBE
      SYSTEM.REPULSION        = d.particles.repulsion        ?? SYSTEM.REPULSION
      SYSTEM.REPULSION_RADIUS = d.particles.repulsionRadius  ?? SYSTEM.REPULSION_RADIUS
      SYSTEM.MAX_SPEED        = d.particles.maxSpeed         ?? SYSTEM.MAX_SPEED
      SYSTEM.MIN_ORBIT_SPEED  = d.particles.minOrbitSpeed    ?? SYSTEM.MIN_ORBIT_SPEED
      SYSTEM.ORBIT_FORCE        = d.particles.orbitForce       ?? SYSTEM.ORBIT_FORCE
      SYSTEM.ORBIT_TARGET_SPEED = d.particles.orbitTargetSpeed ?? SYSTEM.ORBIT_TARGET_SPEED
      SYSTEM.CUBE_RADIUS        = d.particles.cubeRadius        ?? SYSTEM.CUBE_RADIUS
    }
  } catch {
    // localStorage corrupto — ignorar
  }
}

// Carga inmediata al importar el módulo (antes del primer render)
loadAll()

// ── EnvSync ──────────────────────────────────────────────────────────────────

export function EnvSync() {
  useFrame(({ scene }) => {
    scene.environmentIntensity = guiState.envIntensity
    scene.environmentRotation.y = guiState.envRotY * (Math.PI / 180)
  })
  return null
}

// ── DebugGUI ─────────────────────────────────────────────────────────────────

export function DebugGUI() {
  useEffect(() => {
    const gui = new GUI({ title: 'Scene Controls' })

    // ── Floor ──────────────────────────────────────────────
    const floorFolder = gui.addFolder('Floor')
    const fp = {
      metalnessWhite: floorUniforms.metalnessWhite.value as number,
      metalnessBlack: floorUniforms.metalnessBlack.value as number,
      roughnessWhite:  floorUniforms.roughnessWhite.value  as number,
      roughnessBlack:  floorUniforms.roughnessBlack.value  as number,
    }
    floorFolder.add(fp, 'metalnessWhite', 0, 1, 0.01).name('metalness (white)')
      .onChange((v: number) => { floorUniforms.metalnessWhite.value = v; saveAll() })
    floorFolder.add(fp, 'metalnessBlack', 0, 1, 0.01).name('metalness (black)')
      .onChange((v: number) => { floorUniforms.metalnessBlack.value = v; saveAll() })
    floorFolder.add(fp, 'roughnessWhite', 0, 1, 0.01).name('roughness (white)')
      .onChange((v: number) => { floorUniforms.roughnessWhite.value = v; saveAll() })
    floorFolder.add(fp, 'roughnessBlack', 0, 1, 0.01).name('roughness (black)')
      .onChange((v: number) => { floorUniforms.roughnessBlack.value = v; saveAll() })

    // ── Environment ─────────────────────────────────────────
    const envFolder = gui.addFolder('Environment')
    envFolder.add(guiState, 'envIntensity', 0, 3, 0.01).name('intensity')
      .onChange(() => saveAll())
    envFolder.add(guiState, 'envRotY', -180, 180, 0.5).name('rotation Y°')
      .onChange(() => saveAll())

    // ── Cube Material ───────────────────────────────────────
    const cubMatFolder = gui.addFolder('Cube Material')
    const cm = {
      metalness:        cubeUniforms.metalness.value        as number,
      roughness:        cubeUniforms.roughness.value        as number,
      opacity:          cubeUniforms.opacity.value          as number,
      transmission:     cubeUniforms.transmission.value     as number,
      ior:              cubeUniforms.ior.value              as number,
      thickness:        cubeUniforms.thickness.value        as number,
      clearcoat:        cubeUniforms.clearcoat.value        as number,
      clearcoatRoughness: cubeUniforms.clearcoatRoughness.value as number,
    }
    cubMatFolder.add(cm, 'metalness', 0, 1, 0.01)
      .onChange((v: number) => { cubeUniforms.metalness.value = v; saveAll() })
    cubMatFolder.add(cm, 'roughness', 0, 1, 0.01)
      .onChange((v: number) => { cubeUniforms.roughness.value = v; saveAll() })
    cubMatFolder.add(cm, 'opacity', 0, 1, 0.01)
      .onChange((v: number) => { cubeUniforms.opacity.value = v; saveAll() })
    cubMatFolder.add(cm, 'transmission', 0, 1, 0.01)
      .onChange((v: number) => { cubeUniforms.transmission.value = v; saveAll() })
    cubMatFolder.add(cm, 'ior', 1, 3, 0.01)
      .onChange((v: number) => { cubeUniforms.ior.value = v; saveAll() })
    cubMatFolder.add(cm, 'thickness', 0, 10, 0.1)
      .onChange((v: number) => { cubeUniforms.thickness.value = v; saveAll() })
    cubMatFolder.add(cm, 'clearcoat', 0, 1, 0.01)
      .onChange((v: number) => { cubeUniforms.clearcoat.value = v; saveAll() })
    cubMatFolder.add(cm, 'clearcoatRoughness', 0, 1, 0.01)
      .onChange((v: number) => { cubeUniforms.clearcoatRoughness.value = v; saveAll() })

    // ── Cube Transform ──────────────────────────────────────
    const cubeFolder = gui.addFolder('Cube')
    const cp = {
      posX:  configState.cubePos.x,
      posY:  configState.cubePos.y,
      posZ:  configState.cubePos.z,
      rotX:  configState.cubeRot.x * (180 / Math.PI),
      rotY:  configState.cubeRot.y * (180 / Math.PI),
      rotZ:  configState.cubeRot.z * (180 / Math.PI),
      scale: configState.cubeScale,
    }
    cubeFolder.add(cp, 'posX', -10, 10, 0.01).name('pos X')
      .onChange((v: number) => { configState.cubePos.x = v; saveAll() })
    cubeFolder.add(cp, 'posY', -5, 20, 0.01).name('pos Y')
      .onChange((v: number) => { configState.cubePos.y = v; saveAll() })
    cubeFolder.add(cp, 'posZ', -50, 10, 0.01).name('pos Z')
      .onChange((v: number) => { configState.cubePos.z = v; saveAll() })
    cubeFolder.add(cp, 'rotX', -180, 180, 0.1).name('rot X°')
      .onChange((v: number) => { configState.cubeRot.x = v * (Math.PI / 180); saveAll() })
    cubeFolder.add(cp, 'rotY', -180, 180, 0.1).name('rot Y°')
      .onChange((v: number) => { configState.cubeRot.y = v * (Math.PI / 180); saveAll() })
    cubeFolder.add(cp, 'rotZ', -180, 180, 0.1).name('rot Z°')
      .onChange((v: number) => { configState.cubeRot.z = v * (Math.PI / 180); saveAll() })
    cubeFolder.add(cp, 'scale', 0.1, 5, 0.01).name('scale')
      .onChange((v: number) => { configState.cubeScale = v; saveAll() })

    // ── Particles ───────────────────────────────────────────
    const particlesFolder = gui.addFolder('Particles')
    const pp = {
      orbitStrength:  SYSTEM.B_STRENGTH,
      sizeScale:      SYSTEM.SIZE_SCALE,
      damping:        SYSTEM.DAMPING,
      eMouse:         SYSTEM.E_MOUSE,
      eGuide:         SYSTEM.E_GUIDE,
      eCube:          SYSTEM.E_CUBE,
      repulsion:      SYSTEM.REPULSION,
      repulsionRadius: SYSTEM.REPULSION_RADIUS,
      maxSpeed:       SYSTEM.MAX_SPEED,
      minOrbitSpeed:  SYSTEM.MIN_ORBIT_SPEED,
      orbitForce:       SYSTEM.ORBIT_FORCE,
      orbitTargetSpeed: SYSTEM.ORBIT_TARGET_SPEED,
      cubeRadius:       SYSTEM.CUBE_RADIUS,
    }
    particlesFolder.add(pp, 'orbitTargetSpeed', 0, 10, 0.1).name('orbit speed')
      .onChange((v: number) => { SYSTEM.ORBIT_TARGET_SPEED = v; saveAll() })
    particlesFolder.add(pp, 'orbitForce', 0, 20, 0.1).name('orbit force (gain)')
      .onChange((v: number) => { SYSTEM.ORBIT_FORCE = v; saveAll() })
    particlesFolder.add(pp, 'orbitStrength', 0, 20, 0.1).name('B field strength')
      .onChange((v: number) => { SYSTEM.B_STRENGTH = v; saveAll() })
    particlesFolder.add(pp, 'minOrbitSpeed', 0, 6, 0.05).name('min orbit speed')
      .onChange((v: number) => { SYSTEM.MIN_ORBIT_SPEED = v; saveAll() })
    particlesFolder.add(pp, 'maxSpeed', 1, 20, 0.1).name('max speed')
      .onChange((v: number) => { SYSTEM.MAX_SPEED = v; saveAll() })
    particlesFolder.add(pp, 'damping', 0, 20, 0.05).name('damping')
      .onChange((v: number) => { SYSTEM.DAMPING = v; saveAll() })
    particlesFolder.add(pp, 'eMouse', 0, 200, 0.5).name('mouse attraction')
      .onChange((v: number) => { SYSTEM.E_MOUSE = v; saveAll() })
    particlesFolder.add(pp, 'eGuide', 0, 400, 1).name('guide ball attraction')
      .onChange((v: number) => { SYSTEM.E_GUIDE = v; saveAll() })
    particlesFolder.add(pp, 'eCube', 0, 80, 0.5).name('cube attraction')
      .onChange((v: number) => { SYSTEM.E_CUBE = v; saveAll() })
    particlesFolder.add(pp, 'cubeRadius', 0.5, 8, 0.1).name('cube bounce radius')
      .onChange((v: number) => { SYSTEM.CUBE_RADIUS = v; saveAll() })
    particlesFolder.add(pp, 'sizeScale', 0.1, 5, 0.05).name('size scale')
      .onChange((v: number) => { SYSTEM.SIZE_SCALE = v; saveAll() })

    // ── Camera ──────────────────────────────────────────────
    const camFolder = gui.addFolder('Camera')
    const cam = { ...configState.camera }
    camFolder.add(cam, 'fov', 15, 90, 0.5).name('FOV')
      .onChange((v: number) => { configState.camera.fov = v; saveAll() })
    camFolder.add(cam, 'distance', 5, 80, 0.1).name('distance')
      .onChange((v: number) => { configState.camera.distance = v; saveAll() })
    camFolder.add(cam, 'height', -5, 30, 0.1).name('height')
      .onChange((v: number) => { configState.camera.height = v; saveAll() })
    camFolder.add(cam, 'targetY', -5, 20, 0.1).name('target Y')
      .onChange((v: number) => { configState.camera.targetY = v; saveAll() })

    return () => { gui.destroy() }
  }, [])

  return null
}
