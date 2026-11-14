import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Proxy exclusivo de desarrollo local: redirige /api hacia Spring Boot local.
  // En producción (Render Static Site) se usa VITE_API_URL o Rewrite /api/* hacia el backend en Render.
  // Referencia local: http://localhost:8080
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080').trim()

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
