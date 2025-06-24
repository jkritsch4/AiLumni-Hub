import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
        propsDestructure: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  server: {
    proxy: {
      '/New_test': {
        target: 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
