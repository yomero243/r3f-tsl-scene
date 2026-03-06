import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { texture, normalMap } from 'three/tsl'
import { LIGHTS, cubeUniforms } from '../constants'
import { configState } from '../config'
import { sharedState, useSceneStore } from '../store'

export function CubeModel() {
  const { scene } = useGLTF('/assets/cube.glb')
  const [normalTex, noiseTex] = useTexture([
    '/assets/cube_normals.webp',
    '/assets/cube_noise.webp',
  ])
  const cubeRef = useRef<THREE.Group | null>(null)
  const cubeYOffset = useRef(0)
  const mouseTarget = useRef(new THREE.Vector3())
  const mouseCurrent = useRef(new THREE.Vector3())
  const raycaster = useRef(new THREE.Raycaster())
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const isHovering = useRef(false)
  const autoRotY = useRef(0)
  const cubeLightRef = useRef<THREE.PointLight>(null)

  const _extraRot = useMemo(() => new THREE.Quaternion(), [])
  const _euler = useMemo(() => new THREE.Euler(), [])
  const _targetQuat = useMemo(() => new THREE.Quaternion(), [])
  const _hit = useMemo(() => new THREE.Vector3(), [])

  const cubeScene = useMemo(() => {
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
    const cloned = scene.clone()

    const box = new THREE.Box3().setFromObject(cloned)
    const center = new THREE.Vector3()
    box.getCenter(center)

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.translate(-center.x, -center.y, -center.z)

        const mat = new MeshPhysicalNodeMaterial()
        mat.colorNode = texture(noiseTex).mul(cubeUniforms.colorTint)
        mat.metalnessNode = cubeUniforms.metalness
        mat.roughnessNode = cubeUniforms.roughness
        mat.transparent = true
        mat.opacityNode = cubeUniforms.opacity
        mat.side = THREE.DoubleSide
        mat.transmissionNode = cubeUniforms.transmission
        mat.iorNode = cubeUniforms.ior
        mat.thicknessNode = cubeUniforms.thickness
        mat.normalNode = normalMap(texture(normalTex))
        mat.clearcoatNode = cubeUniforms.clearcoat
        mat.clearcoatRoughnessNode = cubeUniforms.clearcoatRoughness
        child.material = mat
      }
    })

    cubeYOffset.current = (box.max.y - box.min.y) / 2
    return cloned
  }, [scene, normalTex, noiseTex])

  useEffect(() => () => {
    document.body.style.cursor = 'auto'
    cubeScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }, [cubeScene])

  useFrame(({ camera, pointer }, delta) => {
    const centerY = cubeYOffset.current + 1.5 + configState.cubePos.y

    floorPlane.current.normal.set(0, 1, 0)
    floorPlane.current.constant = -centerY
    raycaster.current.setFromCamera(pointer, camera)
    raycaster.current.ray.intersectPlane(floorPlane.current, _hit)
    mouseTarget.current.copy(_hit)
    mouseCurrent.current.lerp(mouseTarget.current, Math.min(delta * 5, 1.0))

    if (cubeRef.current) {
      cubeRef.current.position.set(configState.cubePos.x, centerY, configState.cubePos.z)
      cubeRef.current.scale.setScalar(configState.cubeScale)

      _euler.set(configState.cubeRot.x, configState.cubeRot.y, configState.cubeRot.z)
      _extraRot.setFromEuler(_euler)

      if (isHovering.current) {
        const angle = Math.atan2(
          mouseCurrent.current.x - configState.cubePos.x,
          mouseCurrent.current.z - configState.cubePos.z
        )
        _euler.set(0, angle, 0)
        _targetQuat.setFromEuler(_euler)
        _targetQuat.multiply(_extraRot)
        cubeRef.current.quaternion.slerp(_targetQuat, Math.min(delta * 4, 1))
        autoRotY.current = cubeRef.current.rotation.y
      } else {
        autoRotY.current += 0.005
        _euler.set(0, autoRotY.current, 0)
        _targetQuat.setFromEuler(_euler)
        _targetQuat.multiply(_extraRot)
        cubeRef.current.quaternion.slerp(_targetQuat, delta * 2)
      }
    }

    sharedState.mouseWorld.copy(mouseCurrent.current)
    sharedState.cubeCenter.set(configState.cubePos.x, centerY, configState.cubePos.z)

    if (cubeLightRef.current) {
      cubeLightRef.current.intensity = LIGHTS.cubeLightIntensity
      cubeLightRef.current.distance = LIGHTS.cubeLightDistance
    }
  })

  const cubeY = cubeYOffset.current + 1.5 + configState.cubePos.y

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        useSceneStore.getState().spawnParticle()
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; isHovering.current = true }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; isHovering.current = false }}
    >
      <primitive ref={cubeRef} object={cubeScene} />
<pointLight
        ref={cubeLightRef}
        position={[configState.cubePos.x, cubeY, configState.cubePos.z]}
        intensity={LIGHTS.cubeLightIntensity}
        distance={LIGHTS.cubeLightDistance}
        color="#00ffcc"
      />
      <mesh position={[configState.cubePos.x, cubeY, configState.cubePos.z]} visible={false}>
        <boxGeometry args={[2.5, 2.5, 2.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
