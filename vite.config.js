import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split large vendor libraries into their own chunks for better caching.
        // Vite 8 (Rolldown) requires the function form of manualChunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) return 'redux'
          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            /[\\/]react[\\/]/.test(id)
          ) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
  resolve: {
    // `@` path aliases (kept in sync with jsconfig.json paths)
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
