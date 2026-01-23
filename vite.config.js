import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/metabase-api': {
          target: env.VITE_METABASE_URL || 'https://lula.metabaseapp.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/metabase-api/, '/api'),
          headers: {
            'x-api-key': env.VITE_METABASE_API_KEY,
          },
        },
        '/hubspot-api': {
          target: 'https://api.hubapi.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hubspot-api/, ''),
          headers: {
            'Authorization': `Bearer ${env.VITE_HUBSPOT_ACCESS_TOKEN}`,
          },
        },
      },
    },
  }
})
