import { Suspense, useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { MeshPhysicalNodeMaterial, MeshBasicNodeMaterial, WebGPURenderer } from 'three/webgpu'
import { color, sin, time, vec3, texture, attribute, float, normalMap, uv } from 'three/tsl'
import { sharedState } from './store'

function Floor() {
  const noiseTex = useTexture('/src/assets/floor_noise.webp')
  const material = useMemo(() => {
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
    noiseTex.repeat.set(2, 2)
    const mat = new MeshPhysicalNodeMaterial()
    const noiseVal = texture(noiseTex).r
    // El noise modula sutilmente el color base (oscuro con variaciones visibles)
    mat.colorNode = vec3(noiseVal.mul(0.04), noiseVal.mul(0.04), noiseVal.mul(0.08))
    mat.metalnessNode = float(1)
    mat.roughnessNode = noiseVal.mul(0.01).add(0.22)
    mat.transparent = false
    mat.opacityNode = float(5)
    return mat
  }, [noiseTex])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={material}>
      <planeGeometry args={[50, 50]} />
    </mesh>
  )
}



// --- Unified System Configuration ---
const SYSTEM = {
  COUNT: 100,
  E_MOUSE: 10.0,
  E_CUBE: 15.0,
  B_STRENGTH: 4.0,
  DAMPING: 1.2,
  MAX_SPEED: 12.0,
  SOFT_MIN: 0.4,
  REPULSION: 18.0,
  REPULSION_RADIUS: 3.0,
  SIZE_MIN: 0.15,
  SIZE_MAX: 0.5,
  SPAWN_RADIUS: 7.0,
  BOUNDARY: 20.0,
}

const TINTS = [
  [0.2, 0.5, 1.0], [1.0, 0.2, 0.2], [0.2, 1.0, 0.3],
  [0.8, 0.2, 1.0], [1.0, 0.7, 0.1], [0.1, 0.9, 0.9]
]

function CoreSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const lightGroupRef = useRef<THREE.Group>(null)
  const lightsRef = useRef<THREE.PointLight[]>([])

  // Cargamos ambas texturas de las referencias (point para centro + circle para borde/halo)
  const pointTex = useTexture('/src/assets/point.png')
  const circleTex = useTexture('/src/assets/circle.webp')

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { COUNT } = SYSTEM

  const state = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const vel = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const center = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = SYSTEM.SPAWN_RADIUS * Math.cbrt(Math.random())
      const i3 = i * 3
      pos[i3] = center.x + r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = center.z + r * Math.cos(phi)

      // Velocidad tangencial para órbita en XZ alrededor del cubo
      const dx = pos[i3] - center.x
      const dz = pos[i3 + 2] - center.z
      const rXZ = Math.sqrt(dx * dx + dz * dz) || 1
      const orbitalSpeed = 1.5 + Math.random() * 1.0
      vel[i3] = -dz / rXZ * orbitalSpeed
      vel[i3 + 1] = (Math.random() - 0.5) * 4.0
      vel[i3 + 2] = dx / rXZ * orbitalSpeed

      const tint = TINTS[i % TINTS.length]
      colors[i3] = tint[0]
      colors[i3 + 1] = tint[1]
      colors[i3 + 2] = tint[2]
      sizes[i] = SYSTEM.SIZE_MIN + Math.random() * (SYSTEM.SIZE_MAX - SYSTEM.SIZE_MIN)
    }
    return { pos, vel, colors, sizes }
  }, [COUNT])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2.5, 2.5)
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3).fill(1), 3))
    return geo
  }, [COUNT])

  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial()
    mat.transparent = true
    mat.depthWrite = false
    mat.blending = THREE.AdditiveBlending // La magia lumínica ocurre aquí
    mat.side = THREE.DoubleSide

    const pointNode = texture(pointTex)
    const circleNode = texture(circleTex)
    const instCol = vec3(attribute('aColor', 'vec3'))
    const pulse = sin(time.mul(2.5)).mul(0.15).add(0.85)

    // Glow radial suave basado en UV (1 en centro, 0 en bordes)
    const centeredUV = uv().sub(0.5)
    const radialDist = centeredUV.dot(centeredUV).sqrt().mul(2.0)
    const glowFalloff = float(1.0).sub(radialDist).max(float(0.0)).pow(float(1.2))

    const coreColor = instCol.mul(5.0)
    const coreEmission = pointNode.rgb.mul(coreColor).mul(glowFalloff.mul(1.5).add(0.3))

    const rimColor = instCol.mul(vec3(1.1, 0.95, 0.8)).mul(7.0)
    const rimEmission = circleNode.rgb.mul(rimColor).mul(glowFalloff)

    mat.colorNode = coreEmission.add(rimEmission).mul(pulse)

    return mat
  }, [pointTex, circleTex])


  const _dir = useMemo(() => new THREE.Vector3(), [])
  const _force = useMemo(() => new THREE.Vector3(), [])
  const _B = useMemo(() => new THREE.Vector3(SYSTEM.B_STRENGTH * 0.4, SYSTEM.B_STRENGTH, 0), [])
  const _cross = useMemo(() => new THREE.Vector3(), [])
  const _color = useMemo(() => new THREE.Color(), [])

  useFrame(({ camera }, delta) => {
    if (!meshRef.current) return
    const dt = Math.min(delta, 0.05)
    const { pos, vel, colors, sizes } = state
    const mouse = sharedState.mouseWorld
    const cube = sharedState.cubeCenter
    const active = sharedState.visibleCount
    const guide = sharedState.guideIndex

    // Ocultar inactivas
    for (let i = active; i < COUNT; i++) {
      dummy.position.set(0, -100, 0)
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    for (let i = 0; i < active; i++) {
      const i3 = i * 3

      if (i === guide) {
        // La partícula guía sigue al mouse suavemente
        const currentPos = new THREE.Vector3(pos[i3], pos[i3 + 1], pos[i3 + 2])
        currentPos.lerp(mouse, Math.min(delta * 15, 1.0))
        pos[i3] = currentPos.x
        pos[i3 + 1] = currentPos.y
        pos[i3 + 2] = currentPos.z
        vel[i3] = 0; vel[i3 + 1] = 0; vel[i3 + 2] = 0
      } else {
        _force.set(0, 0, 0)

        // Attraction to cube
        _dir.set(cube.x - pos[i3], cube.y - pos[i3 + 1], cube.z - pos[i3 + 2])
        let dist = _dir.length()
        let denom = Math.max(dist * dist * dist, SYSTEM.SOFT_MIN)
        _force.addScaledVector(_dir, SYSTEM.E_CUBE / denom)

        // Repulsion from very center
        if (dist < SYSTEM.REPULSION_RADIUS && dist > 0.01) {
          _force.addScaledVector(_dir, -SYSTEM.REPULSION / (dist * dist))
        }

        // Attraction to mouse
        _dir.set(mouse.x - pos[i3], mouse.y - pos[i3 + 1], mouse.z - pos[i3 + 2])
        dist = _dir.length()
        denom = Math.max(dist * dist * dist, SYSTEM.SOFT_MIN)
        _force.addScaledVector(_dir, SYSTEM.E_MOUSE / denom)

        // Lorentz: v x B
        _cross.set(vel[i3], vel[i3 + 1], vel[i3 + 2]).cross(_B)
        _force.add(_cross)

        // Update physics
        vel[i3] += _force.x * dt
        vel[i3 + 1] += _force.y * dt
        vel[i3 + 2] += _force.z * dt

        const damping = Math.exp(-SYSTEM.DAMPING * dt)
        vel[i3] *= damping; vel[i3 + 1] *= damping; vel[i3 + 2] *= damping

        const speed = Math.sqrt(vel[i3] ** 2 + vel[i3 + 1] ** 2 + vel[i3 + 2] ** 2)
        if (speed > SYSTEM.MAX_SPEED) {
          const s = SYSTEM.MAX_SPEED / speed
          vel[i3] *= s; vel[i3 + 1] *= s; vel[i3 + 2] *= s
        }

        pos[i3] += vel[i3] * dt
        pos[i3 + 1] += vel[i3 + 1] * dt
        pos[i3 + 2] += vel[i3 + 2] * dt

        // Respawn if too far
        _dir.set(pos[i3] - cube.x, pos[i3 + 1] - cube.y, pos[i3 + 2] - cube.z)
        if (_dir.length() > SYSTEM.BOUNDARY) {
          pos[i3] = cube.x; pos[i3 + 1] = cube.y; pos[i3 + 2] = cube.z
          vel[i3] = 0; vel[i3 + 1] = 0; vel[i3 + 2] = 0
        }
      }

      dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2])
      const baseScale = sizes[i]
      dummy.scale.setScalar(i === guide ? baseScale * 2.5 : baseScale)

      // [Modificación Crítica] Forzar billboarding ortogonal
      dummy.lookAt(camera.position)

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      if (i === guide) {
        const tint = TINTS[sharedState.guideColorIndex]
        _color.setRGB(tint[0], tint[1], tint[2])
      } else {
        _color.setRGB(colors[i3], colors[i3 + 1], colors[i3 + 2])
      }
      _color.toArray(meshRef.current.geometry.attributes.aColor.array as Float32Array, i * 3)

    }
    meshRef.current.instanceMatrix.needsUpdate = true
      ; (meshRef.current.geometry.attributes.aColor as THREE.InstancedBufferAttribute).needsUpdate = true

    // Inicializar luces la primera vez
    if (lightsRef.current.length === 0 && lightGroupRef.current) {
      for (let i = 0; i < COUNT; i++) {
        const light = new THREE.PointLight(0xffffff, 0, 12, 2)
        lightGroupRef.current.add(light)
        lightsRef.current.push(light)
      }
    }

    // Actualizar luces activas
    for (let i = 0; i < active; i++) {
      const i3 = i * 3
      const light = lightsRef.current[i]
      if (!light) continue
      light.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2])
      if (i === guide) {
        const tint = TINTS[sharedState.guideColorIndex]
        light.color.setRGB(tint[0], tint[1], tint[2])
        light.intensity = 120
        light.distance = 30
      } else {
        light.color.setRGB(colors[i3], colors[i3 + 1], colors[i3 + 2])
        light.intensity = 20
        light.distance = 12
      }
    }
    // Apagar luces inactivas
    for (let i = active; i < COUNT; i++) {
      if (lightsRef.current[i]) lightsRef.current[i].intensity = 0
    }
  })

  return (
    <>
      <instancedMesh ref={meshRef} args={[geometry, undefined, COUNT]} material={material} />
      <group ref={lightGroupRef} />
    </>
  )
}

function CubeModel() {
  const { scene } = useGLTF('/src/assets/cube.glb')
  const [normalTex, noiseTex] = useTexture([
    '/src/assets/cube_normals.webp',
    '/src/assets/cube_noise.webp',
  ])
  const cubeRef = useRef<THREE.Group | null>(null)
  const cubeYOffset = useRef(0)
  const cubeCenterY = useRef(0)
  const mouseTarget = useRef(new THREE.Vector3())
  const mouseCurrent = useRef(new THREE.Vector3())
  const raycaster = useRef(new THREE.Raycaster())
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const isHovering = useRef(false)
  const autoRotY = useRef(0)

  const cubeScene = useMemo(() => {
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
    const cloned = scene.clone()

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = new MeshPhysicalNodeMaterial()

        mat.colorNode = texture(noiseTex).mul(color(0x3377dd))
        mat.metalnessNode = float(0.2)
        mat.roughnessNode = float(0.4)
        mat.transparent = true
        mat.opacityNode = float(0.85)
        mat.side = THREE.DoubleSide
        mat.transmissionNode = float(0.8)
        mat.iorNode = float(1.4)
        mat.thicknessNode = float(1.5)

        mat.normalNode = normalMap(texture(normalTex))
        mat.clearcoatNode = float(0.5)
        mat.clearcoatRoughnessNode = float(0.2)

        child.material = mat
      }
    })

    const box = new THREE.Box3().setFromObject(cloned)
    cubeYOffset.current = -box.min.y
    cubeCenterY.current = (box.max.y + box.min.y) / 2

    const axes = new THREE.AxesHelper(1.5)
    axes.position.set(0, cubeCenterY.current, 0)
    cloned.add(axes)

    return cloned
  }, [scene, normalTex, noiseTex])

  useFrame(({ camera, pointer }, delta) => {
    const centerY = cubeYOffset.current + cubeCenterY.current + 1.5

    // 1. Actualizar mouse
    floorPlane.current.set(new THREE.Vector3(0, 1, 0), -centerY)
    raycaster.current.setFromCamera(pointer, camera)
    const hit = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(floorPlane.current, hit)
    if (hit) mouseTarget.current.copy(hit)
    mouseCurrent.current.lerp(mouseTarget.current, Math.min(delta * 5, 1.0))

    // 2. Rotación del cubo: hacia el mouse si hover, auto-rot si no
    if (cubeRef.current) {
      cubeRef.current.position.set(0, cubeYOffset.current + 1.5, 0)
      if (isHovering.current) {
        const angle = Math.atan2(mouseCurrent.current.x, mouseCurrent.current.z)
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0))
        cubeRef.current.quaternion.slerp(targetQuat, Math.min(delta * 4, 1))
        autoRotY.current = angle // sincroniza para que la auto-rot continúe sin salto
      } else {
        autoRotY.current += 0.005
        const autoQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, autoRotY.current, 0))
        cubeRef.current.quaternion.slerp(autoQuat, delta * 2)
      }
    }

    sharedState.mouseWorld.copy(mouseCurrent.current)
    sharedState.cubeCenter.set(0, centerY, 0)
  })

  return (
    <group
      onClick={(e: any) => {
        e.stopPropagation()
        if (sharedState.visibleCount < SYSTEM.COUNT) {
          sharedState.guideIndex = sharedState.visibleCount
          sharedState.visibleCount++
          sharedState.guideColorIndex = (sharedState.guideColorIndex + 1) % TINTS.length
        }
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; isHovering.current = true }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; isHovering.current = false }}
    >
      <primitive ref={cubeRef} object={cubeScene} />
      {/* Luz interna para iluminar el suelo desde dentro del cubo */}
      <pointLight
        position={[0, cubeYOffset.current + cubeCenterY.current, 0]}
        intensity={15}
        distance={8}
        color="#00ffcc"
      />
      {/* Clickable proxy box */}
      <mesh position={[0, cubeYOffset.current + cubeCenterY.current, 0]} visible={false}>
        <boxGeometry args={[2.5, 2.5, 2.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)
  const rendererRef = useRef<WebGPURenderer | null>(null)

  useEffect(() => {
    if (!canvasRef.current || isReady) return

    let isMounted = true
    const initWebGPU = async () => {
      try {
        const renderer = new WebGPURenderer({
          canvas: canvasRef.current!,
          antialias: true,
          alpha: true
        })
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2

        await renderer.init()

        if (isMounted) {
          rendererRef.current = renderer
          setIsReady(true)
        }
      } catch (error) {
        console.error("Hardware Context Allocation Failed:", error)
      }
    }

    initWebGPU()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020205' }}>

      {/* 1. Underlying persistent native HTML canvas for context allocation */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />

      {/* 2. Loading state overlay while waiting for compute pipelines */}
      {!isReady && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', fontFamily: 'monospace', zIndex: 10 }}>
          Allocating WebGPU Compute Pipelines...
        </div>
      )}

      {/* 3. React Three Fiber bindings to pass our generated context */}
      {isReady && rendererRef.current && (
        <Canvas
          camera={{ position: [0, 4, 8], fov: 45 }}
          dpr={[1, 2]}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
          gl={() => rendererRef.current as any}
        >
          <color attach="background" args={['#020205']} />
          <fog attach="fog" args={['#020205', 8, 30]} />

          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 5]} intensity={0.5} />

          {/* Luces globales conservadas para iluminar el cubo central */}
          <pointLight position={[-3, 4, -3]} intensity={1} color="#2244ff" />
          <pointLight position={[0, 6, 0]} intensity={1} color="#ffffff" />

          <Environment preset="city" environmentIntensity={1} />

          <Suspense fallback={null}>
            <Floor />
            <CubeModel />
            <CoreSystem />
          </Suspense>

          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={3}
            maxDistance={20}
          />
        </Canvas>
      )}
    </div>
  )
}
