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
- [Catalogue : principes](#catalogue--principes)

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

## Mise à jour annuelle des règles fiscales

Procédure à suivre chaque année (PLF, BOFiP, BOSS…). Aucune compétence technique requise — chaque étape est indépendante.

### Étape 1 — Mettre à jour les paramètres Impôts

1. Aller sur `/settings/impots`.
2. Vérifier et corriger : barème IR, PFU, CEHR, droits de succession (DMTG).
3. Enregistrer.

### Étape 2 — Mettre à jour les Prélèvements sociaux

1. Aller sur `/settings/prelevements`.
2. Vérifier et corriger : taux PS patrimoine (17,2 %), tranches retraite.
3. Enregistrer.

### Étape 3 — Vérifier les produits "À vérifier"

1. Aller sur `/settings/base-contrat`.
2. (Admin) Rechercher un produit et ajuster son état **Clôturé / Ouvert** si nécessaire.
   - Une clôture s'accompagne d'une **date** (et d'une note optionnelle).

---

## Base-Contrat — Clôturer / rouvrir un produit

La page `/settings/base-contrat` affiche un **catalogue hardcodé** et permet uniquement (admin) de :
- **Clôturer / rouvrir** un produit avec une date
- Ajouter une **note admin** optionnelle

### Stockage

Les changements sont stockés dans la table Supabase `base_contrat_overrides` (clé = `product_id`).

---

## Base-Contrat — Process Dev (Ajout / Modification)

Le référentiel est 100% hardcodé dans `src/domain/base-contrat/`. Toute modification du catalogue ou des règles passe par une PR.

### Règle d'or (UX Premium)
Toujours utiliser des **libellés métier clairs**. Aucun jargon technique ni ID ne doit être visible par l'utilisateur final.

### 1. Ajouter un produit
1. Ouvrir `src/domain/base-contrat/catalog.ts`.
2. Ajouter une entrée dans le tableau `CATALOG` dans la bonne `GrandeFamille`.
3. Renseigner `id`, `label` (métier), `grandeFamille`, `catalogKind`, `ppEligible`, `pmEligible`.
4. Si le produit partage les mêmes règles qu'un autre (ex: crypto = autres), l'assimiler sans créer de sous-catégorie fiscale inutile.
5. Lancer `npm run check`.

### 2. Ajouter/modifier une règle fiscale (3 colonnes)

Le **référentiel lisible** des règles fiscales est dans `src/domain/base-contrat/rules/` (PR5).  
Le **moteur de calcul** (simulateurs) reste dans `src/engine/`.

#### Modifier une règle existante
1. Identifier le produit et la phase impactée : **Constitution**, **Sortie/Rachat**, ou **Décès/Transmission**.
2. Ouvrir le fichier de bibliothèque correspondant dans `src/domain/base-contrat/rules/library/` :
   - `assurance-epargne.ts` — Assurance-vie, Contrat de capitalisation
   - `epargne-bancaire.ts` — Livrets, CTO, PEA, PEA-PME, PEL, CEL, CAT
   - `retraite.ts` — PER (assurantiel/bancaire), PEE, PERCOL, Article 83/39…
   - `immobilier.ts` — Résidence principale, locatif nu/meublé, SCPI, groupements
   - `prevoyance.ts` — Prévoyance décès, ITT/invalidité, dépendance, emprunteur, homme-clé
   - `valeurs-mobilieres.ts` — Actions, fonds (FCPR/FCPI/FIP), PE, créances, usufruit
   - `fiscaux-immobilier.ts` — Pinel, Malraux, Monuments historiques, Denormandie…
   - `autres.ts` — Tontine, Crypto-actifs, Métaux précieux
3. Modifier le tableau `bullets` (texte métier, jamais de jargon technique ni d'ID).
4. Lancer `npm run check`.

#### Ajouter des règles
1. Créer ou ouvrir le fichier de bibliothèque de la famille dans `src/domain/base-contrat/rules/library/` ou créer une entrée dans le `switch` du fichier concerné.
2. Ajouter une `ProductRules` avec title + bullets métier.
3. Lancer `npm run check` — le test de coverage se met à jour automatiquement.

### 3. Ajouter/mettre à jour les tests (Golden Tests)
1. Ouvrir `src/engine/__tests__/goldenCases.test.ts` (ou le fichier de test lié au domaine).
2. Ajouter un cas de test documenté avec des entrées déterministes et les sorties attendues calculées manuellement.
3. Lancer `npm test` et `npm run check` pour garantir l'absence de régression.

---

## Repo hygiene — Delete unused

**Règle** : Si ça ne sert plus = on supprime.

### Ce qu'on considère "sert"

- runtime (`src/**` import/usage)
- build/CI (scripts, `.github`, `package.json`)
- tests/fixtures
- documentation référentielle

### Process

1. **Preuve** : prouver 0 usage (rg/find)
2. **PR** : petite PR ciblée
3. **Validation** : `npm run check` passe
4. **Merge** → sinon **revert**

### Interdits

- Pas de dossiers `archive/`, `backup/`, `old/`, `__spike__`, `_raw` "pour plus tard"
- Pas de "parking" durable (même dans `tools/`) sans preuve d'utilité

---

## Vérifications (commandes)

Commandes utiles pour vérifier l'hygiène du code et l'organisation (conformité SaaS).

```bash
# 1. Lister les routes déclarées (source unique attendue)
rg -n "path:" src/routes/appRoutes.ts
# Résultat attendu : liste des routes (APP_ROUTES)

# 1b. Lister les redirects legacy
rg -n "kind: 'redirect'" src/routes/appRoutes.ts
# Résultat attendu : routes legacy (/placement, /credit, /prevoyance)

# 1c. Vérifier que App.jsx consomme APP_ROUTES (pas de duplication)
rg -n "APP_ROUTES\\.map" src/App.jsx

# 2. Détecter les imports cross features → pages (doit être vide à terme)
rg -n "from.*@/pages/" src/features/ -l
# Résultat attendu : (aucune sortie)

# 3. Vérifier la présence d'icônes inline dans App.jsx (doit être vide à terme)
rg -n "const Icon" src/App.jsx
# Résultat attendu post-T3 : (aucune sortie)

# 4. Lister les dossiers spike/raw dans src/ (interdits en prod)
find src -type d \( -name "__spike__" -o -name "_raw" \)
# Résultat attendu : (aucune sortie)

# 5. Vérifier l'utilisation centralisée des routes settings
grep -n "SETTINGS_ROUTES\|settingsRoutes" src/constants/settingsRoutes.js src/pages/SettingsShell.jsx
# Résultat attendu : matches dans les deux fichiers (source unique utilisée)
```

### Rollback

- `git revert <sha>` annule la PR en 1 commande

---

Voir aussi :
- `docs/ARCHITECTURE.md` (cartographie)
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
