import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { configState } from '../config'

const _target = new THREE.Vector3()

export function CameraController() {
  const { camera } = useThree()

  useFrame(() => {
    camera.position.z = configState.camera.distance
    camera.position.y = configState.camera.height

    _target.set(configState.cubePos.x, configState.camera.targetY, configState.cubePos.z)
    camera.lookAt(_target)

    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== configState.camera.fov) {
      cam.fov = configState.camera.fov
      cam.updateProjectionMatrix()
    }
  })

  return null
}
