# Checklist SER1

## Pré-requis
- [ ] Comptes créés : GitHub, Vercel, Render, Supabase, Registrar (Nom de domaine)
- [ ] Deux repos : `ser1-site-frontend` (React) et `ser1-backend` (Express)

## Supabase
- [ ] Projet créé + Region choisie
- [ ] Table `profiles` créée (id/email/role/created_at)
- [ ] RLS (Row Level Security) configurée selon besoins
- [ ] Récupérer `SUPABASE_URL` et `ANON KEY` (+ `SERVICE_ROLE` si nécessaire)

## Backend (Render)
- [ ] Connecter Render au repo `ser1-backend`
- [ ] Variables d'env : `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `ALLOWED_ORIGINS`
- [ ] Déployer et vérifier `GET /health`
- [ ] Tester `/api/placement` en local et en prod
- [ ] (Option) Ajouter **Custom Domain** `api.ser1.app` → CNAME → `xxxx.onrender.com`

## Frontend (Vercel)
- [ ] Connecter Vercel au repo `ser1-site-frontend`
- [ ] Variables d'env : `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Déployer la branche `main`
- [ ] Vérifier que l'app appelle bien l'API Render (CORS OK)
- [ ] (Option) Ajouter le domaine `app.ser1.app` sur Vercel

## DNS / Domaines
- [ ] Acheter/posséder `ser1.app` (ou autre)
- [ ] Configurer `app.ser1.app` → Vercel
- [ ] Configurer `api.ser1.app` → Render
- [ ] Mettre à jour `VITE_API_BASE_URL=https://api.ser1.app`
- [ ] Vérifier HTTPS (certificats auto via Vercel/Render)

## Finitions
- [ ] README, ARCHITECTURE.md, CHECKLIST.md présents et à jour
- [ ] Liens de prod : `https://app.ser1.app` (FE), `https://api.ser1.app` (BE)
- [ ] Comptes admin créés dans Supabase
