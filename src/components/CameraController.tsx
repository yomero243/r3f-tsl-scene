import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { configState } from '../config'

export function CameraController() {
  const { camera } = useThree()
  const _target = useRef(new THREE.Vector3())

  useFrame(() => {
    camera.position.z = configState.camera.distance
    camera.position.y = configState.camera.height

    _target.current.set(configState.cubePos.x, configState.camera.targetY, configState.cubePos.z)
    camera.lookAt(_target.current)

    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== configState.camera.fov) {
      cam.fov = configState.camera.fov
      cam.updateProjectionMatrix()
    }
  })

  return null
}
