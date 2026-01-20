import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/admin': {
        target: 'https://xnpbxrqkzgimiugqtago.supabase.co/functions/v1/admin',
        changeOrigin: true,
        rewrite: () => '',
      },
    },
  },
})
