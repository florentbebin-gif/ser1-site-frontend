import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api/admin': {
        target: 'https://xnpbxrqkzgimiugqtago.supabase.co/functions/v1/admin',
        changeOrigin: true,
        rewrite: () => '',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Supprimer TOUS les headers browser
            const headersToRemove = [
              'cookie', 'host', 'connection', 'accept-language',
              'accept-encoding', 'referer', 'origin',
              'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
              'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site',
              'upgrade-insecure-requests', 'cache-control', 'pragma',
            ];
            headersToRemove.forEach(h => proxyReq.removeHeader(h));
            
            // Ajouter apikey depuis env
            proxyReq.setHeader('apikey', process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucGJ4cnFremdpbWl1Z3F0YWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NTg1MDcsImV4cCI6MjA0ODUzNDUwN30.v8cEiz46E8ER9jCOW4R0X6OfMy7Vz8xMA-_qLPORJdY');
          });
        },
      },
    },
  },
})
