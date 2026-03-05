import { useThree, useFrame } from '@react-three/fiber'
import { configState } from '../config'

export function CameraController() {
  const { camera } = useThree()

  useFrame(() => {
    camera.position.z = configState.camera.distance
    camera.position.y = configState.camera.height
  })

  return null
}
