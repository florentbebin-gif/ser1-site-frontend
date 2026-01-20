import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/admin': {
        target: 'https://xnpbxrqkzgimiugqtago.supabase.co/functions/v1/admin',
        changeOrigin: true,
        rewrite: () => '',
        secure: true,
      },
    },
  },
})
