# SER1 Site (Frontend)
- Login Supabase (email/mot de passe)
- Board (7 simulateurs)
- Pages de simulateurs reliées à l'API backend

## Config .env.local
VITE_SUPABASE_URL="https://...supabase.co"
VITE_SUPABASE_ANON_KEY="..."
VITE_API_BASE="https://ser1-backend.onrender.com"

## Démarrer en local
npm install
npm run dev

## Déployer sur Vercel
Build: npm run build
Output: dist
Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE
