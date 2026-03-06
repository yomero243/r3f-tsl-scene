# r3f-tsl-scene

Interactive 3D scene built with React Three Fiber and Three Shading Language (TSL), rendered via the WebGPU backend of Three.js.

## Overview
<img width="549" height="796" alt="image" src="https://github.com/user-attachments/assets/b7dbbaeb-0792-4c0c-bdb8-0f6737bd0d2a" />

A real-time WebGPU scene featuring:
lil-gui.js?v=d163b3e5:1433 gui.add faile
- **Particle system** — 30 instanced billboard particles with orbital physics, mouse/cube repulsion, and a multi-layer glow shader (core, rim, outer glow, sparkle) written entirely in TSL.
- **Interactive GLTF cube** — physically-based glass/metal material defined with TSL nodes (`MeshPhysicalNodeMaterial`). The cube follows the mouse cursor on a floor plane and responds to click events that spawn particles.
- **Procedural floor** — noise-texture-driven metalness/roughness map and radial opacity falloff, all authored in TSL.
- **Debug GUI** — `lil-gui` panel for tuning material uniforms at runtime; state persists via `localStorage`.

## Tech Stack

| Package | Version |
|---|---|
| React | 19.2 |
| @react-three/fiber | 9.5 |
| @react-three/drei | 10.7 |
| Three.js (WebGPU) | 0.183 |
| Zustand | 5.0 |
| lil-gui | 0.21 |
| Vite | 8.0 (beta) |
| TypeScript | 5.9 |

## Requirements

WebGPU support is mandatory. Use a compatible browser:

- Chrome / Edge 113+
- Safari 18+
- Firefox Nightly (flag required)

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Other scripts

```bash
npm run build    # Type-check + production build
npm run preview  # Serve production build locally
npm run lint     # ESLint
```

## Project Structure

```
r3f-tsl-scene/
├── public/
│   └── assets/              # Static assets served at /assets/*
│       ├── cube.glb
│       ├── cube_background.webp
│       ├── cube_normals.webp
│       ├── cube_noise.webp
│       ├── floor_noise.webp
│       ├── point.png
│       └── circle.webp
└── src/
    ├── main.tsx             # React entry point
    ├── App.tsx              # WebGPU renderer init + Canvas setup
    ├── constants.ts         # TSL uniforms, physics constants, tint palette
    ├── store.ts             # Zustand store (particle spawn, shared mutable state)
    ├── config.ts            # Mutable scene config (cube position, etc.)
    └── components/
        ├── CoreSystem.tsx   # Instanced particle mesh + TSL shader + physics loop
        ├── CubeModel.tsx    # GLTF cube with TSL PBR material + mouse tracking
        ├── Floor.tsx        # Reflective floor with TSL noise material
        ├── CameraController.tsx  # Orbit-style camera
        └── DebugGUI.tsx     # lil-gui panel + localStorage persistence
```

## Architecture Notes

### WebGPU Renderer

`App.tsx` creates a `WebGPURenderer` imperatively before mounting the R3F `<Canvas>`, then passes it via `gl={() => rendererRef.current}`. This pattern is required for R3F v9 when using the WebGPU backend, since R3F does not create a `WebGPURenderer` by default.

### TSL Shaders

All materials use TSL node graphs instead of raw GLSL:

- `CoreSystem` — `MeshBasicNodeMaterial` with a custom `colorNode` compositing core glow, rim, outer glow, and sparkle layers driven by `shaderUniforms` in `constants.ts`.
- `CubeModel` — `MeshPhysicalNodeMaterial` with `normalMapNode`, `colorNode`, and PBR channel nodes wired to `cubeUniforms`.
- `Floor` — `MeshPhysicalNodeMaterial` with noise-driven `colorNode`, `metalnessNode`, `roughnessNode`, and `opacityNode`.

### State

- **Zustand** (`store.ts`) — particle count and spawn sequencing shared across components.
- **`sharedState`** (`store.ts`) — plain mutable object for high-frequency per-frame data (mouse world position, cube center) to avoid React re-renders in the render loop.
- **`configState`** (`config.ts`) — mutable scene configuration referenced by components.
- **TSL uniforms** (`constants.ts`) — `uniform()` nodes that the debug GUI mutates directly; changes propagate to the GPU without re-creating materials.
