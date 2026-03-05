import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Floor } from './components/Floor'
import { CoreSystem } from './components/CoreSystem'
import { CubeModel } from './components/CubeModel'
import { CameraController } from './components/CameraController'

export { configState } from './config'

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
          alpha: true,
        })
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2
        await renderer.init()
        if (isMounted) {
          rendererRef.current = renderer
          setIsReady(true)
        }
      } catch (error) {
        console.error('Hardware Context Allocation Failed:', error)
      }
    }

    initWebGPU()

    return () => {
      isMounted = false
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundImage: 'url(/assets/cube_background.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />

      {!isReady && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', fontFamily: 'monospace', zIndex: 10 }}>
          Allocating WebGPU Compute Pipelines...
        </div>
      )}

      {isReady && rendererRef.current && (
        <Canvas
          camera={{ position: [0, 4.0, 20], fov: 45, far: 2000 }}
          dpr={[1, 2]}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
          gl={() => rendererRef.current as any}
        >
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          <Environment preset="warehouse" environmentIntensity={0.5} />

          <CameraController />

          <Suspense fallback={null}>
            <Floor />
            <CubeModel />
            <CoreSystem />
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
