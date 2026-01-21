import { defineConfig, loadEnv } from 'vite'

// Debug flag for proxy logs (set to true for troubleshooting /api/admin)
const DEBUG_PROXY = false;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[vite.config] ERREUR: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env.local');
  }

  return {
    server: {
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api/admin': {
          target: supabaseUrl ? `${supabaseUrl}/functions/v1/admin` : 'https://xnpbxrqkzgimiugqtago.supabase.co/functions/v1/admin',
          changeOrigin: true,
          rewrite: () => '',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const headersToRemove = [
                'cookie', 'connection', 'accept-language',
                'accept-encoding', 'referer', 'origin',
                'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
                'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site',
                'upgrade-insecure-requests', 'cache-control', 'pragma',
              ];
              headersToRemove.forEach(h => proxyReq.removeHeader(h));
              
              if (supabaseAnonKey) {
                proxyReq.setHeader('apikey', supabaseAnonKey);
              }
              
              // Debug logs (enable DEBUG_PROXY for troubleshooting)
              if (DEBUG_PROXY) {
                console.log('[PROXY_REQ]', {
                  method: proxyReq.method,
                  path: proxyReq.path,
                  host: proxyReq.getHeader('host'),
                  hasApikey: !!proxyReq.getHeader('apikey'),
                  hasAuth: !!proxyReq.getHeader('authorization'),
                });
              }
            });
            proxy.on('proxyRes', (proxyRes) => {
              if (DEBUG_PROXY) {
                console.log('[PROXY_RES]', {
                  status: proxyRes.statusCode,
                  contentType: proxyRes.headers['content-type'],
                });
              }
            });
          },
        },
      },
    },
  };
})
