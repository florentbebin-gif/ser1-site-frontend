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

En CI, c'est le gate principal.

---

## Dev local (frontend)
- `npm install`
- `npm run dev`

---

## Env vars
Le repo n’utilise pas `.env` :
- Copier `.env.example` → `.env.local` (local uniquement, gitignored)
- Ne jamais committer de secrets.

Variables attendues :

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Optionnel (Playwright E2E)
E2E_EMAIL=<email>
E2E_PASSWORD=<password>
```

---

## Debug flags & console policy
### Console
- Autorisé en prod : `console.error`, `console.warn`.
- Interdit en prod : `console.log/debug/info/trace` (bloqué ESLint).

### Activer des logs
- Via `.env.local` (recommandé) :
  - `VITE_DEBUG_AUTH=1`
  - `VITE_DEBUG_PPTX=1`
  - `VITE_DEBUG_COMPTES=1`

- Via `localStorage` (runtime) :
  - `SER1_DEBUG_AUTH=1`
  - `SER1_DEBUG_PPTX=1`
  - `SER1_DEBUG_COMPTES=1`
  - `SER1_DEBUG_ADMIN=1`
  - `SER1_DEBUG_ADMIN_FETCH=1`

Référence code : `src/utils/debugFlags.ts`.

---

## Supabase local + migrations
Source de vérité migrations : `supabase/migrations/`.

Parcours safe (si Supabase CLI configurée) :

> ⚠️ **Danger zone**: `supabase db reset` est destructif (purge totale) et interdit sans demande explicite.  
> Préférer `supabase start` + migrations ciblées si l'objectif ne nécessite pas un reset complet.

```bash
supabase start
supabase db reset
supabase migration list
```

Synchroniser le schéma distant (si besoin) :

```bash
supabase db remote commit --linked
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

Exemples :

```bash
# Public (pas de token)
supabase functions invoke admin --data '{"action":"ping_public"}'

# Admin (token requis)
supabase functions invoke admin \
  --data '{"action":"list_users"}' \
  --headers '{"Authorization":"Bearer <JWT_ADMIN>"}'
```

Contrat API : `supabase/functions/admin/index.ts`.

Notes CORS : en prod, l'app passe par un proxy Vercel (`api/admin.js`).

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

Check rapide (régression sécurité) :

```bash
rg "user_metadata.*role" supabase/functions --type ts
rg "user_metadata" supabase/migrations --type sql
```

---

Voir aussi :
- `docs/ARCHITECTURE.md` (cartographie)
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
