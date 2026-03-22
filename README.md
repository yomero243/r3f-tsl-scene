# r3f-tsl-scene

[![WebGPU](https://img.shields.io/badge/WebGPU-Enabled-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
[![TSL](https://img.shields.io/badge/TSL-Three_Shading_Language-FF6B35?style=flat-square)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.183-black?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> Interactive 3D scene built with **React Three Fiber** and **Three Shading Language (TSL)**, rendered via the WebGPU backend of Three.js. A showcase of next-generation real-time graphics on the web.

## 🖼️ Preview

<img width="549" height="796" alt="r3f-tsl-scene preview" src="https://github.com/user-attachments/assets/b7dbbaeb-0792-4c0c-bdb8-0f6737bd0d2a" />

## 🔴 Live Demo

> ⚠️ Requires a **WebGPU-compatible browser** (Chrome 113+, Edge 113+, Safari 18+)

Deployed on Netlify — check the [live demo](https://github.com/yomero243/r3f-tsl-scene) or clone and run locally.

---

## ✨ Features

- 🌌 **Instanced Particle System** — 30 billboard particles with orbital physics, mouse/cube repulsion, and a **multi-layer glow shader** (core · rim · outer glow · sparkle) written entirely in TSL nodes
- 🧊 **Interactive GLTF Cube** — physically-based glass/metal material using `MeshPhysicalNodeMaterial` with TSL node graph; tracks mouse on the floor plane and spawns particles on click
- 🏗️ **Procedural Floor** — noise-texture-driven metalness/roughness map and radial opacity falloff, 100% TSL authored
- 🎛️ **Runtime Debug GUI** — `lil-gui` panel for tuning material uniforms; state persists via `localStorage`
- ⚡ **WebGPU Backend** — hardware-accelerated rendering via Three.js `WebGPURenderer`
- 🗄️ **Zustand State** — clean reactive state management for particle spawning and shared mutable scene data

---

## 🤔 Why TSL?

**TSL (Three Shading Language)** is the future of material authoring in Three.js. It replaces the legacy `ShaderMaterial` approach with a composable **node graph system** that:

- 🔁 **Runs on any backend** — WebGPU, WebGL, and future renderers without rewriting shaders
- 🧩 **Composable** — build complex effects by wiring together reusable node functions
- 🔒 **Type-safe** — integrate naturally with TypeScript tooling
- 🛠️ **Debuggable** — no raw GLSL strings; the graph is inspectable and serializable
- 🚀 **Future-proof** — TSL is the path Three.js core is investing in for r180+

This project demonstrates TSL in production: every material — particles, glass cube, procedural floor — is built with TSL nodes instead of raw GLSL.

---

## 🛠️ Tech Stack

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

---

## ⚙️ Requirements

WebGPU support is mandatory. Use a compatible browser:

| Browser | Version |
|---|---|
| Chrome / Edge | 113+ |
| Safari | 18+ |
| Firefox Nightly | flag required |

---

## 🚀 Getting Started

```bash
git clone https://github.com/yomero243/r3f-tsl-scene.git
cd r3f-tsl-scene
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

---

## 📁 Project Structure

```
r3f-tsl-scene/
├── public/
│   └── assets/              # Static assets
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
    ├── store.ts             # Zustand store (particle spawn, shared state)
    ├── config.ts            # Mutable scene config (cube position, etc.)
    └── components/
        ├── CoreSystem.tsx   # Instanced particle mesh + TSL shader + physics loop
        ├── CubeModel.tsx    # GLTF cube with TSL PBR material + mouse tracking
        ├── Floor.tsx        # Reflective floor with TSL noise material
        ├── CameraController.tsx  # Orbit-style camera
        └── DebugGUI.tsx     # lil-gui panel + localStorage persistence
```

---

## 🏗️ Architecture Notes

- **TSL uniforms** are defined once in `constants.ts` and referenced across components; lil-gui mutates them at runtime without triggering React re-renders.
- The **physics loop** runs inside `useFrame` with a fixed timestep; repulsion forces between particles and the cube are computed each frame in `CoreSystem.tsx`.
- **Glow layers** are composited via additive blending in a single draw call — no post-processing pass needed.

---

## 👨‍💻 About

Built by **Gabriel** — Creative 3D Developer & Technical Artist specializing in Three.js, React Three Fiber, WebGPU, and TSL.

> 💼 **Available for freelance projects** — real-time 3D experiences, WebGL/WebGPU apps, interactive installations, and creative coding. [Let's talk →](https://github.com/yomero243)

---

*If this project helped you understand TSL or WebGPU, give it a ⭐ — it helps others discover it too.*
