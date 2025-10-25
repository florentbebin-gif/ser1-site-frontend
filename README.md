# SER1 – Frontend (Vercel + React)

App React (pages : **Home** – 7 tuiles, **Placement**, **Crédit**, **Params**, **Sim** – charte SER1).  
Backend consommé : Express sur Render (`/api/placement`, `/health`).  
Authentification & données : **Supabase**.

## 1) Arborescence
src/
pages/
Home.jsx
Placement.jsx
Credit.jsx
Params.jsx
Sim.jsx
utils/
reset.js
App.jsx
main.jsx
styles.css

bash
Copier le code

## 2) Variables d'environnement
Crée `.env` à la racine :
VITE_API_BASE_URL=https://ser1-backend.onrender.com # ou https://api.ser1.app après domaine
VITE_SUPABASE_URL=... # depuis Supabase
VITE_SUPABASE_ANON_KEY=... # depuis Supabase

shell
Copier le code

## 3) Lancer en local
```bash
npm i
npm run dev
# http://localhost:5173
4) Déploiement (CI/CD)
GitHub → repo ser1-site-frontend

Vercel relié à la branche main

Chaque push = nouveau déploiement (preview + prod)

5) Réglages importants Vercel
Environment Variables (mêmes clés que .env) dans Settings → Environment Variables

Domains : ajouter le domaine principal (ex : app.ser1.app)

6) Points d’attention
L’app lit VITE_API_BASE_URL → mettre le domaine Render ou api.ser1.app

CORS : le backend doit autoriser le domaine Vercel (voir README backend)

Le bouton Exporter propose Excel & PowerPoint (PPTX à brancher plus tard)
