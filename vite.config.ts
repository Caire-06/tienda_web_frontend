import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carga .env del frontend; VITE_APIPERU_TOKEN es el token de dniruc.apisperu.com
  // y se inyecta en el proxy (el navegador nunca necesita incluirlo).
  const env = loadEnv(mode, process.cwd(), '')
  const tokenApis = (env.VITE_APIPERU_TOKEN || env.VITE_APISPERU_TOKEN || '').trim()

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/api-peru': {
          target: 'https://dniruc.apisperu.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-peru/, ''),
          headers: tokenApis ? { Authorization: `Bearer ${tokenApis}` } : undefined,
        },
      },
    },
  }
})
