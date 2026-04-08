import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
  },
  preview: {
    host: 'localhost',
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      '@backend': path.resolve(process.cwd(), '../backend/src'),
    },
  },
})
