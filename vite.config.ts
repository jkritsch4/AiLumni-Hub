import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Use env override if provided, otherwise default to your Invoke URL.
// This is only used by the dev proxy (vite server), not in production builds.
const target =
  process.env.VITE_PREFS_API_URL ||
  'https://n54ugywlg2.execute-api.us-west-2.amazonaws.com'

console.log('Vite config loaded', target);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    // Dev-only proxy: browser calls /api/... on the same origin,
    // Vite forwards to API Gateway so no CORS is involved in dev/Codespaces.
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
        rewrite: (path) => {
          const test = path.replace(/^\/api/, '');
          console.log('investigating:', path, '->', test); // Add this for debugging!
          return path.replace(/^\/api/, '');
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log('Proxy request:', req.url);
        },
      },
    },
  }
})