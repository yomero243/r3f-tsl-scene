import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { sin, time, vec3, texture, attribute, float, uv } from 'three/tsl'
import { SYSTEM, TINTS, LIGHTS, shaderUniforms } from '../constants'
import { sharedState, useSceneStore } from '../store'
import { configState } from '../config'

export function CoreSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const lightGroupRef = useRef<THREE.Group>(null)
  const lightsRef = useRef<THREE.PointLight[]>([])

  const pointTex = useTexture('/assets/point.png')
  const circleTex = useTexture('/assets/circle.webp')

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { COUNT } = SYSTEM

  const state = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const vel = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const center = new THREE.Vector3(
      configState.cubePos.x,
      configState.cubePos.y + 1.5,
      configState.cubePos.z
    )

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = SYSTEM.SPAWN_RADIUS * Math.cbrt(Math.random())
      const i3 = i * 3
      pos[i3] = center.x + r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = center.z + r * Math.cos(phi)

      const dx = pos[i3] - center.x
      const dz = pos[i3 + 2] - center.z
      const rXZ = Math.sqrt(dx * dx + dz * dz) || 1
      const orbitalSpeed = 1.5 + Math.random() * 1.0
      vel[i3] = -dz / rXZ * orbitalSpeed
      vel[i3 + 1] = (Math.random() - 0.5) * 4.0
      vel[i3 + 2] = dx / rXZ * orbitalSpeed

      const tint = TINTS[i % TINTS.length]
      colors[i3] = tint[0]; colors[i3 + 1] = tint[1]; colors[i3 + 2] = tint[2]
      sizes[i] = SYSTEM.SIZE_MIN + Math.random() * (SYSTEM.SIZE_MAX - SYSTEM.SIZE_MIN)
    }
    return { pos, vel, colors, sizes }
  }, [COUNT])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(3.0, 3.0)
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3).fill(1), 3))
    return geo
  }, [COUNT])

  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial()
    mat.transparent = true
    mat.depthWrite = false
    mat.depthTest = false
    mat.blending = THREE.AdditiveBlending
    mat.toneMapped = false
    mat.side = THREE.DoubleSide

    const pointNode = texture(pointTex)
    const circleNode = texture(circleTex)
    const instCol = vec3(attribute('aColor', 'vec3'))

    const pulse = sin(time.mul(shaderUniforms.pulseSpeed))
      .mul(shaderUniforms.pulseAmp)
      .add(float(1.0).sub(shaderUniforms.pulseAmp))

    const centeredUV = uv().sub(0.5)
    const radialDist = centeredUV.dot(centeredUV).sqrt().mul(1.4)

    const outerGlow = float(1.0).sub(radialDist.mul(0.6)).max(float(0.0)).pow(float(0.4))
    const coreGlow = float(1.0).sub(radialDist).max(float(0.0)).pow(shaderUniforms.glowPower)
    const sparkle = float(1.0).sub(radialDist.mul(3.0)).max(float(0.0)).pow(float(5.0))

    const outerEmission = circleNode.rgb.mul(instCol.mul(shaderUniforms.outerGlowStrength)).mul(outerGlow)
    const coreEmission = pointNode.rgb.mul(instCol.mul(shaderUniforms.coreStrength)).mul(coreGlow)
    const rimEmission = circleNode.rgb.mul(instCol.mul(vec3(1.2, 0.98, 0.85)).mul(shaderUniforms.rimStrength)).mul(coreGlow)
    const sparkleEmission = vec3(1.6, 1.6, 2.2).mul(shaderUniforms.sparkleStrength).mul(sparkle)

    mat.colorNode = outerEmission.add(coreEmission).add(rimEmission).add(sparkleEmission).mul(pulse)

    mat.opacityNode = float(1.0).sub(radialDist.mul(radialDist).mul(1.5)).max(float(0.0)).pow(float(1.8))
    mat.fog = false
    return mat
  }, [pointTex, circleTex])

  const _dir = useMemo(() => new THREE.Vector3(), [])
  const _force = useMemo(() => new THREE.Vector3(), [])
  const _B = useMemo(() => new THREE.Vector3(), [])
  const _cross = useMemo(() => new THREE.Vector3(), [])
  const _color = useMemo(() => new THREE.Color(), [])
  const _lightOffset = useMemo(() => new THREE.Vector3(), [])
  const _guideTarget = useMemo(() => new THREE.Vector3(), [])
  const _ray = useMemo(() => new THREE.Ray(), [])
  const _sphere = useMemo(() => new THREE.Sphere(), [])

  useEffect(() => {
    const group = lightGroupRef.current
    if (!group) return
    for (let i = 0; i < SYSTEM.MAX_LIGHTS; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 12, 2)
      group.add(light)
      lightsRef.current.push(light)
    }
    return () => {
      lightsRef.current.forEach(l => { l.removeFromParent(); l.dispose() })
      lightsRef.current = []
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(({ camera, pointer }, delta) => {
    if (!meshRef.current) return
    const dt = Math.min(delta, 0.05)
    const { pos, vel, colors, sizes } = state
    const mouse = sharedState.mouseWorld
    const cube = sharedState.cubeCenter
    const { visibleCount: active, guideIndex: guide, guideColorIndex } = useSceneStore.getState()

    _ray.origin.setFromMatrixPosition(camera.matrixWorld)
    _ray.direction.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(_ray.origin).normalize()
    _sphere.set(cube, SYSTEM.BOUNDARY * 0.6)
    if (!_ray.intersectSphere(_sphere, _guideTarget)) _guideTarget.copy(mouse)

    _B.set(SYSTEM.B_STRENGTH * 0.4, SYSTEM.B_STRENGTH, 0)

    const targetX = cube.x
    const targetY = cube.y
    const targetZ = cube.z

    for (let i = active; i < COUNT; i++) {
      const i3 = i * 3
      pos[i3] = targetX; pos[i3 + 1] = targetY; pos[i3 + 2] = targetZ
      vel[i3] = 0; vel[i3 + 1] = 0; vel[i3 + 2] = 0
      dummy.position.set(targetX, targetY, targetZ)
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    for (let i = 0; i < active; i++) {
      const i3 = i * 3

      if (i === guide) {
        _dir.set(pos[i3], pos[i3 + 1], pos[i3 + 2])
        _dir.lerp(_guideTarget, Math.min(delta * 15, 1.0))
        pos[i3] = _dir.x; pos[i3 + 1] = _dir.y; pos[i3 + 2] = _dir.z
        vel[i3] = 0; vel[i3 + 1] = 0; vel[i3 + 2] = 0
      } else {
        _force.set(0, 0, 0)

        _dir.set(targetX - pos[i3], targetY - pos[i3 + 1], targetZ - pos[i3 + 2])
        let dist = _dir.length()
        let denom = Math.max(dist * dist * dist, SYSTEM.SOFT_MIN)
        _force.addScaledVector(_dir, SYSTEM.E_CUBE / denom)

        if (dist < SYSTEM.CUBE_RADIUS && dist > 0.001) {
          const nx = _dir.x / dist
          const ny = _dir.y / dist
          const nz = _dir.z / dist
          const vDotN = vel[i3] * nx + vel[i3 + 1] * ny + vel[i3 + 2] * nz
          if (vDotN > 0) {
            vel[i3]     -= 2 * vDotN * nx
            vel[i3 + 1] -= 2 * vDotN * ny
            vel[i3 + 2] -= 2 * vDotN * nz
          }
          pos[i3]     = targetX - nx * SYSTEM.CUBE_RADIUS
          pos[i3 + 1] = targetY - ny * SYSTEM.CUBE_RADIUS
          pos[i3 + 2] = targetZ - nz * SYSTEM.CUBE_RADIUS
        }

        _dir.set(mouse.x - pos[i3], mouse.y - pos[i3 + 1], mouse.z - pos[i3 + 2])
        dist = _dir.length()
        denom = Math.max(dist * dist * dist, SYSTEM.SOFT_MIN)
        _force.addScaledVector(_dir, SYSTEM.E_MOUSE / denom)

        if (guide < active) {
          const g3 = guide * 3
          _dir.set(pos[g3] - pos[i3], pos[g3 + 1] - pos[i3 + 1], pos[g3 + 2] - pos[i3 + 2])
          dist = _dir.length()
          denom = Math.max(dist * dist * dist, SYSTEM.SOFT_MIN)
          _force.addScaledVector(_dir, SYSTEM.E_GUIDE / denom)
        }

        _cross.set(vel[i3], vel[i3 + 1], vel[i3 + 2]).cross(_B)
        _force.add(_cross)

        const rdx = pos[i3] - targetX
        const rdz = pos[i3 + 2] - targetZ
        const rXZ = Math.sqrt(rdx * rdx + rdz * rdz) || 1
        const tanX = -rdz / rXZ
        const tanZ = rdx / rXZ
        const vTan = vel[i3] * tanX + vel[i3 + 2] * tanZ
        const deficit = SYSTEM.ORBIT_TARGET_SPEED - vTan
        if (deficit > 0) {
          _force.x += tanX * SYSTEM.ORBIT_FORCE * deficit
          _force.z += tanZ * SYSTEM.ORBIT_FORCE * deficit
        }

        vel[i3] += _force.x * dt; vel[i3 + 1] += _force.y * dt; vel[i3 + 2] += _force.z * dt

        const damping = Math.exp(-SYSTEM.DAMPING * dt)
        vel[i3] *= damping; vel[i3 + 1] *= damping; vel[i3 + 2] *= damping

        const speed = Math.sqrt(vel[i3] ** 2 + vel[i3 + 1] ** 2 + vel[i3 + 2] ** 2)
        if (speed > SYSTEM.MAX_SPEED) {
          const s = SYSTEM.MAX_SPEED / speed
          vel[i3] *= s; vel[i3 + 1] *= s; vel[i3 + 2] *= s
        } else if (speed > 0.001 && speed < SYSTEM.MIN_ORBIT_SPEED) {
          const s = SYSTEM.MIN_ORBIT_SPEED / speed
          vel[i3] *= s; vel[i3 + 1] *= s; vel[i3 + 2] *= s
        }

        pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt

        if (pos[i3 + 1] < 0.5) {
          pos[i3 + 1] = 0.5
          if (vel[i3 + 1] < 0) vel[i3 + 1] *= -0.6
        }

        _dir.set(pos[i3] - targetX, pos[i3 + 1] - targetY, pos[i3 + 2] - targetZ)
        if (_dir.length() > SYSTEM.BOUNDARY) {
          const angle = Math.random() * Math.PI * 2
          const spawnR = SYSTEM.CUBE_RADIUS * 2.0
          pos[i3]     = targetX + Math.cos(angle) * spawnR
          pos[i3 + 1] = targetY
          pos[i3 + 2] = targetZ + Math.sin(angle) * spawnR
          vel[i3]     = -Math.sin(angle) * SYSTEM.ORBIT_TARGET_SPEED
          vel[i3 + 1] = 0
          vel[i3 + 2] = Math.cos(angle) * SYSTEM.ORBIT_TARGET_SPEED
        }
      }

      dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2])
      dummy.scale.setScalar((i === guide ? sizes[i] * 2.5 : sizes[i]) * SYSTEM.SIZE_SCALE)
      dummy.lookAt(camera.position)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      if (i === guide) {
        const tint = TINTS[guideColorIndex]
        _color.setRGB(tint[0], tint[1], tint[2])
      } else {
        _color.setRGB(colors[i3], colors[i3 + 1], colors[i3 + 2])
      }
      _color.toArray(meshRef.current.geometry.attributes.aColor.array as Float32Array, i * 3)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
      ; (meshRef.current.geometry.attributes.aColor as THREE.InstancedBufferAttribute).needsUpdate = true

    const LIGHT_STICK = LIGHTS.lightStick
    let lightSlot = 0

    if (guide < active && lightsRef.current[0]) {
      const i3 = guide * 3
      _lightOffset.set(
        camera.position.x - pos[i3],
        camera.position.y - pos[i3 + 1],
        camera.position.z - pos[i3 + 2]
      ).normalize().multiplyScalar(LIGHT_STICK)
      const tint = TINTS[guideColorIndex]
      lightsRef.current[0].position.set(
        pos[i3] + _lightOffset.x,
        pos[i3 + 1] + _lightOffset.y,
        pos[i3 + 2] + _lightOffset.z
      )
      lightsRef.current[0].color.setRGB(tint[0], tint[1], tint[2])
      lightsRef.current[0].intensity = LIGHTS.guideIntensity
      lightsRef.current[0].distance = LIGHTS.guideDistance
      lightSlot = 1
    }

    for (let i = 0; i < active && lightSlot < SYSTEM.MAX_LIGHTS; i++) {
      if (i === guide) continue
      const i3 = i * 3
      _lightOffset.set(
        camera.position.x - pos[i3],
        camera.position.y - pos[i3 + 1],
        camera.position.z - pos[i3 + 2]
      ).normalize().multiplyScalar(LIGHT_STICK)
      const light = lightsRef.current[lightSlot]
      light.position.set(
        pos[i3] + _lightOffset.x,
        pos[i3 + 1] + _lightOffset.y,
        pos[i3 + 2] + _lightOffset.z
      )
      light.color.setRGB(colors[i3], colors[i3 + 1], colors[i3 + 2])
      light.intensity = LIGHTS.particleIntensity
      light.distance = LIGHTS.particleDistance
      lightSlot++
    }

    for (let i = lightSlot; i < SYSTEM.MAX_LIGHTS; i++) {
      lightsRef.current[i].intensity = 0
    }
  })

  return (
    <>
      <instancedMesh ref={meshRef} args={[geometry, undefined, COUNT]} material={material} />
      <group ref={lightGroupRef} />
    </>
  )
}
