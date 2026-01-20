import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // NOTE: Pour tester /api/admin en local, utiliser 'vercel dev' au lieu de 'npm run dev'
    // Le proxy Vite vers Supabase direct a été supprimé car il contournait les gardes apikey
  },
})
