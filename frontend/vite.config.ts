import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// VITE_BASE lets the console live under a sub-path (e.g. /home/ on jolly.golnk.in).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tsconfigPaths()],
})
