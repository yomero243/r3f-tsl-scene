import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    keepNames: true,
  } as any,
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/@react-three')) return 'r3f'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react'
        },
      },
    },
  },
})
