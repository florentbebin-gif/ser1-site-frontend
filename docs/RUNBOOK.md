# RUNBOOK (dev / ops)

## But
Donner une procédure **actionnable** pour exécuter, diagnostiquer et opérer le repo (local dev, Supabase, Edge Functions, troubleshooting).

## Audience
Dev qui doit dépanner vite, ou exécuter un parcours local/CI.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : commandes, symptômes→cause→fix, flags debug, Edge Functions, migrations.
- ❌ Ne couvre pas : les conventions UI/couleurs (voir `docs/GOUVERNANCE.md`).

## Sommaire
- [Checks du repo](#checks-du-repo)
- [Dev local (frontend)](#dev-local-frontend)
- [Env vars](#env-vars)
- [Debug flags & console policy](#debug-flags--console-policy)
- [Supabase local + migrations](#supabase-local--migrations)
- [Edge Function admin](#edge-function-admin)
- [Troubleshooting rapide](#troubleshooting-rapide)

---

## Checks du repo
- Check complet :
  - `npm run check` (lint + typecheck + tests + build)

---

## Dev local (frontend)
- `npm install`
- `npm run dev`

---

## Env vars
Le repo n’utilise pas `.env` :
- Copier `.env.example` → `.env.local` (local uniquement, gitignored)
- Ne jamais committer de secrets.

---

## Debug flags & console policy
### Console
- Autorisé en prod : `console.error`, `console.warn`.
- Interdit en prod : `console.log/debug/info/trace` (bloqué ESLint).

### Activer des logs
- Via `.env.local` : `VITE_DEBUG_AUTH=1`, `VITE_DEBUG_PPTX=1`, ...
- Via `localStorage` : `SER1_DEBUG_AUTH=1`, `SER1_DEBUG_PPTX=1`, ...

Référence code : `src/utils/debugFlags.ts`.

---

## Supabase local + migrations
Source de vérité migrations : `supabase/migrations/`.

Parcours safe (si Supabase CLI configurée) :
```bash
supabase start
supabase db reset
supabase migration list
```

---

## Edge Function admin
### Déployer
```bash
npx supabase functions deploy admin --project-ref <ref>
```

### Tester
- Public : `ping_public`
- Auth/admin : via Dashboard Functions ou `supabase functions invoke admin`.

Contrat API : `supabase/functions/admin/index.ts`.

---

## Troubleshooting rapide
### CORS / /functions/v1/admin
Symptôme : erreur CORS ou requêtes invisibles côté logs Supabase.
- Vérifier `VITE_SUPABASE_URL` / token.
- Tester `ping_public` depuis navigateur.
- Vérifier preflight `OPTIONS` (Network tab).

### Thème ne s’applique pas / cache stale
- Vider les caches `ser1_theme_cache_*` / `ser1_cabinet_*` dans localStorage.
- Vérifier `theme_mode/preset_id/my_palette` en DB (`ui_settings`).

### RLS / rôle admin
- Vérifier que l’autorisation utilise `app_metadata.role`.
- Interdit : checks `user_metadata`.

---

Voir aussi :
- `docs/ARCHITECTURE.md` (cartographie)
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
