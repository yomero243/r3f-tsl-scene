import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { vec3, vec2, texture, uv, float } from 'three/tsl'
import { floorUniforms } from '../constants'

export function Floor() {
  const noiseTex = useTexture('/assets/floor_noise.webp')

  const material = useMemo(() => {
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
    const mat = new MeshPhysicalNodeMaterial()

    const scaledUV = uv().mul(vec2(floorUniforms.textureScaleX, floorUniforms.textureScaleY))
    const noiseVal = texture(noiseTex, scaledUV).r

    mat.colorNode = vec3(noiseVal.mul(0.03), noiseVal.mul(0.04), noiseVal.mul(0.14))

    const metalnessDiff = floorUniforms.metalnessWhite.sub(floorUniforms.metalnessBlack)
    mat.metalnessNode = floorUniforms.metalnessBlack.add(noiseVal.mul(metalnessDiff))

    const roughnessDiff = floorUniforms.roughnessWhite.sub(floorUniforms.roughnessBlack)
    mat.roughnessNode = floorUniforms.roughnessBlack.add(noiseVal.mul(roughnessDiff))

    const distToCenter = uv().sub(0.5).length().mul(1.6)
    mat.transparent = true
    mat.opacityNode = float(1.0).sub(distToCenter.clamp(0.0, 1.0).pow(float(1.5))).clamp(0.0, 1.0)
    mat.depthWrite = false

    mat.envMapIntensity = 0.51
    return mat
  }, [noiseTex])

  useEffect(() => () => { material.dispose() }, [material])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={material}>
      <planeGeometry args={[200, 200]} />
    </mesh>
  )
}
