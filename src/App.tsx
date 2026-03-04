import { Suspense, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { MeshPhysicalNodeMaterial, MeshBasicNodeMaterial, WebGPURenderer } from 'three/webgpu'
import { color, sin, time, vec3, float, mix, texture, normalMap } from 'three/tsl'

function Floor() {
  const noiseTex = useTexture('/src/assets/floor_noise.webp')
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
  noiseTex.repeat.set(10, 10)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color="#05050a"
        metalness={0.9}
        roughness={0.4}
        roughnessMap={noiseTex}
        bumpMap={noiseTex}
        bumpScale={0.02}
      />
    </mesh>
  )
}

function makePointMat(pointTex: THREE.Texture, tintColor: [number, number, number]) {
  const mat = new MeshBasicNodeMaterial()
  mat.transparent = true
  mat.depthWrite = false
  mat.blending = THREE.AdditiveBlending
  mat.side = THREE.DoubleSide

  const texNode = texture(pointTex)
  const pulse = sin(time.mul(1.5)).mul(0.15).add(0.85)

  mat.colorNode = texNode.mul(vec3(...tintColor)).mul(pulse).mul(4.0)
  mat.opacityNode = texNode.a.mul(pulse)
  return mat
}

const ORBITS = [
  { radius: 2.0, size: 1.2, speed: 1.0,  tilt: 0.1,  y: 0,    tint: [0.2, 0.5, 1.0] as [number, number, number] },
  { radius: 2.6, size: 1.0, speed: 0.7,  tilt: 0.3,  y: 0.2,  tint: [1.0, 0.2, 0.2] as [number, number, number] },
  { radius: 3.2, size: 1.1, speed: 0.5,  tilt: -0.2, y: -0.1, tint: [0.2, 1.0, 0.3] as [number, number, number] },
  { radius: 2.3, size: 0.8, speed: 1.3,  tilt: 0.5,  y: 0.3,  tint: [0.8, 0.2, 1.0] as [number, number, number] },
  { radius: 3.7, size: 1.4, speed: 0.35, tilt: -0.4, y: -0.3, tint: [1.0, 0.7, 0.1] as [number, number, number] },
  { radius: 1.7, size: 0.7, speed: 1.6,  tilt: 0.7,  y: 0.1,  tint: [0.1, 0.9, 0.9] as [number, number, number] },
]

function CubeModel() {
  const { scene } = useGLTF('/src/assets/cube.glb')
  const [normalTex, noiseTex, pointTex] = useTexture([
    '/src/assets/cube_normals.webp',
    '/src/assets/cube_noise.webp',
    '/src/assets/point.png',
  ])
  const cubeRef = useRef<THREE.Group | null>(null)
  const orbitRef = useRef<THREE.Group | null>(null)
  const cubeYOffset = useRef(0)
  const cubeCenterY = useRef(0)
  const [visibleCount, setVisibleCount] = useState(0)
  const mouseTarget = useRef(new THREE.Vector3())
  const mouseCurrent = useRef(new THREE.Vector3())
  const raycaster = useRef(new THREE.Raycaster())
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const isHovering = useRef(false)
  const cubeLookTarget = useRef(new THREE.Quaternion())
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

    const axes = new THREE.AxesHelper(2)
    axes.position.set(0, cubeCenterY.current, 0)
    cloned.add(axes)

    return cloned
  }, [scene, normalTex, noiseTex])

  const orbitGroup = useMemo(() => {
    const group = new THREE.Group()
    const planeGeo = new THREE.PlaneGeometry(1, 1)

    ORBITS.forEach((o, i) => {
      const mat = makePointMat(pointTex, o.tint)

      const pivot = new THREE.Object3D()
      pivot.rotation.x = o.tilt
      pivot.userData.orbitSpeed = o.speed
      pivot.userData.index = i
      pivot.userData.originalTilt = o.tilt
      pivot.userData.orbitRadius = o.radius
      pivot.userData.orbitY = o.y

      const plane = new THREE.Mesh(planeGeo, mat)
      plane.position.set(o.radius, o.y, 0)
      plane.scale.set(0, 0, 0)
      plane.userData.currentScale = 0
      plane.userData.baseSize = o.size
      plane.userData.wasFollower = false
      plane.raycast = () => {} 

      const light = new THREE.PointLight(
        new THREE.Color(o.tint[0], o.tint[1], o.tint[2]),
        0, 
        8,
        1.5
      )
      light.position.set(o.radius, o.y, 0)

      pivot.add(plane)
      pivot.add(light)
      group.add(pivot)
    })

    return group
  }, [pointTex])

  useFrame(({ camera, pointer }, delta) => {
    if (cubeRef.current) {
      cubeRef.current.position.set(0, cubeYOffset.current, 0)

      if (isHovering.current) {
        autoRotY.current += 0.002
        const tiltX = -pointer.y * 0.35
        const tiltY = pointer.x * 0.35
        const targetQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(tiltX, autoRotY.current + tiltY, 0)
        )
        cubeRef.current.quaternion.slerp(targetQuat, delta * 3)
      } else {
        autoRotY.current += 0.006
        const autoQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, autoRotY.current, 0)
        )
        cubeRef.current.quaternion.slerp(autoQuat, delta * 2)
      }
    }

    const centerY = cubeYOffset.current + cubeCenterY.current
    floorPlane.current.set(new THREE.Vector3(0, 1, 0), -centerY)
    raycaster.current.setFromCamera(pointer, camera)
    const hit = new THREE.Vector3()
    raycaster.current.ray.intersectPlane(floorPlane.current, hit)
    if (hit) mouseTarget.current.copy(hit)
    mouseCurrent.current.lerp(mouseTarget.current, delta * 5)

    if (orbitRef.current) {
      orbitRef.current.position.set(0, centerY, 0)

      orbitRef.current.children.forEach((pivot) => {
        const plane = pivot.children[0] as THREE.Mesh
        const light = pivot.children[1] as THREE.PointLight
        const idx = pivot.userData.index as number
        const baseSize = plane.userData.baseSize as number

        const isVisible = idx < visibleCount
        const isMouseFollower = isVisible && idx === visibleCount - 1

        const targetScale = isVisible ? baseSize : 0
        const cur = plane.userData.currentScale as number
        const next = THREE.MathUtils.lerp(cur, targetScale, delta * 4)
        plane.userData.currentScale = next
        plane.scale.set(next, next, next)
        light.intensity = (next / baseSize) * 3

        if (isMouseFollower) {
          pivot.rotation.set(0, 0, 0)
          const localMouse = mouseCurrent.current.clone().sub(orbitRef.current.position)
          plane.position.copy(localMouse)
          light.position.copy(localMouse)
          plane.userData.wasFollower = true
        } else {
          if (plane.userData.wasFollower) {
            pivot.rotation.x = pivot.userData.originalTilt
            plane.position.set(pivot.userData.orbitRadius, pivot.userData.orbitY, 0)
            light.position.set(pivot.userData.orbitRadius, pivot.userData.orbitY, 0)
            plane.userData.wasFollower = false
          }
          if (isVisible) {
            pivot.rotation.y += delta * (pivot.userData.orbitSpeed || 1)
          }
        }

        plane.quaternion.copy(camera.quaternion)
      })
    }
  })

  return (
    <>
      <primitive
        ref={cubeRef}
        object={cubeScene}
        onClick={(e: any) => {
          e.stopPropagation()
          setVisibleCount((prev) => prev < ORBITS.length ? prev + 1 : 0)
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; isHovering.current = true }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; isHovering.current = false }}
      />
      <primitive ref={orbitRef} object={orbitGroup} />
    </>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 4, 8], fov: 45 }}
        dpr={[1, 2]}
        gl={(props) => {
          const renderer = new WebGPURenderer({ canvas: props.canvas as HTMLCanvasElement, antialias: true, alpha: true })
          renderer.toneMapping = THREE.ACESFilmicToneMapping
          renderer.toneMappingExposure = 1.2
          renderer.init().catch(console.error)
          return renderer as any
        }}
      >
        <color attach="background" args={['#020205']} />
        <fog attach="fog" args={['#020205', 8, 30]} />

        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} />
        <pointLight position={[-3, 4, -3]} intensity={2} color="#2244ff" />
        <pointLight position={[0, 6, 0]} intensity={2} color="#ffffff" />

        <Environment preset="city" />

        <Suspense fallback={null}>
          <Floor />
          <CubeModel />
        </Suspense>

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={3}
          maxDistance={20}
        />
      </Canvas>
    </div>
  )
}
