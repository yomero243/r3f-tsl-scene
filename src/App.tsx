import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Stats as StatsLazy } from '@react-three/drei'
import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { Floor } from './components/Floor'
import { CoreSystem } from './components/CoreSystem'
import { CubeModel } from './components/CubeModel'
import { CameraController } from './components/CameraController'
import { EnvSync } from './components/DebugGUI'
import Particles from './components/Particles'
import { useSceneStore } from './store'

export { configState } from './config'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [gpuError, setGpuError] = useState(false)
  const rendererRef = useRef<WebGPURenderer | null>(null)

  // Cursor via DOM directo — sin re-render de React
  useEffect(() => {
    return useSceneStore.subscribe((s) => {
      if (containerRef.current) containerRef.current.style.cursor = s.cursorHidden ? 'none' : 'default'
    })
  }, [])

  const getGL = useCallback(() => rendererRef.current as any, [])

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
        if (isMounted) setGpuError(true)
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
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative', backgroundImage: 'url(/assets/cube_background.webp)', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'default' }}>
<canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
      />

      {gpuError && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ff4444', fontFamily: 'monospace', zIndex: 10, gap: 12 }}>
          <span style={{ fontSize: '1.1rem' }}>WebGPU not available</span>
          <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>Requires Chrome 113+, Edge 113+, or Safari 18+</span>
        </div>
      )}

      {!isReady && !gpuError && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', fontFamily: 'monospace', zIndex: 10 }}>
          Allocating WebGPU Compute Pipelines...
        </div>
      )}

      {isReady && rendererRef.current && (
        <Canvas
          camera={{ position: [0, 4.0, 20], fov: 45, far: 2000 }}
          dpr={[1, 2]}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}
          gl={getGL}
        >
          <Environment preset="studio" />
          {import.meta.env.DEV && <StatsLazy />}
          <EnvSync />

          <CameraController />

          <Suspense fallback={null}>
            <Floor />
            <CubeModel />
            <CoreSystem />
          </Suspense>
          <Particles />
        </Canvas>
      )}
    </div>
  )
}
