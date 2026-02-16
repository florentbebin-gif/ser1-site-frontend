# ROADMAP — Supabase “Option B” structure (temp)

> ⚠️ **Fichier temporaire** (à supprimer dans la **dernière PR** du chantier).
>
> Objectif: migrer de l’organisation Supabase **legacy (workdir dédié)** vers l’organisation Supabase standard:
>
> - `supabase/config.toml`
> - `supabase/functions/*`
> - `supabase/migrations/*` (déjà OK)
> - suppression de l’arbre legacy (workdir dédié)
>
> Contraintes: **zéro régression** (après chaque micro-commit: `npm run check` ✅) + Supabase CLI **2.75.0**.

---

## PHASE 0 — Baseline safe (local)

**Date**: 2026-02-16 (Europe/Paris)

**Branche**: `chore/supabase-option-b-structure`

**Commit baseline**: `745d470806349f8309d3907377e609c33fe13e02`

**Outils**:
- `node -v` → `v22.21.0`
- `supabase --version` → `2.75.0`

**Quality gate**:
- `npm run check` → ✅ PASS

---

## PHASE 1 — Analyse (preuve avant action)

### 1) Inventaire des deux arbres (état initial)

#### Legacy workdir (source initiale config + functions)
- `config.toml` (dans le workdir legacy)
  - `project_id = "SER1"`
  - section `[functions.admin]`:
    - `verify_jwt = true`
    - `import_map = "./functions/admin/deno.json"`
    - `entrypoint = "./functions/admin/index.ts"`
- `functions/admin/`
  - `index.ts` (Edge Function)
  - `cors.ts`, `cors_test.ts`
  - `deno.json`, `tsconfig.json`, `.npmrc`

#### `supabase/` (source initiale migrations)
- `supabase/migrations/*` ✅ (canon DB)
- `supabase/.temp/` (artefacts CLI) — doit rester gitignored
- **Absents** aujourd’hui:
  - `supabase/config.toml`
  - `supabase/functions/*`

✅ **Source de vérité initiale**:
- Migrations: `supabase/migrations/`
- Config Supabase + edge functions: legacy workdir

### 1bis) Artefacts trackés à vérifier

À valider en git (attendu: aucun `.temp` tracké; pas de `supabase/config.toml` ni `supabase/functions/*` pour l’instant).

### 2) Références à l’ancien workdir / flags de workdir

**Références à l’ancien flag de workdir (docs)**:
- `README.md`
- `docs/technical/admin/edge-functions-testing.md`
- `docs/CHANGELOG.md`

**Références à l’ancien workdir (docs)**:
- `README.md` (plusieurs sections: “source de vérité” et paths)
- `docs/technical/api/admin-function.md`
- `docs/ROADMAP_SAAS_V1.md`
- `docs/technical/diagnostics/edge-functions-diagnostics.md`
- `docs/technical/security-user-metadata-guidelines.md`
- `docs/CHANGELOG.md`

### 3) Risques identifiés

1. **Chemins relatifs dans `config.toml`**
   - Bonne nouvelle: les chemins `./functions/admin/*` resteront identiques si on copie `config.toml` vers `supabase/config.toml` et qu’on déplace `functions/` sous `supabase/`.
2. **Docs divergentes vs config réelle**
   - `docs/technical/admin/cors-setup.md` mentionne `supabase/config.toml` (et `verify_jwt=false`), mais le config TOML initial vivait dans le workdir legacy et avait `verify_jwt=true`.
   - Risque: confusion et procédures locales incohérentes.
3. **Root Supabase unique**
   - Après migration, la CLI doit fonctionner depuis la racine, sans flag de workdir.
   - Risque: CI/docs/scripts qui continuent d’utiliser l’ancien flag de workdir.
4. **Ignore `.temp`**
   - Déjà présent dans `.gitignore`: `supabase/.temp/`
5. **Deno tooling VSCode**
   - `.vscode/settings.json` est déjà configuré pour `supabase/functions` → **ça deviendra correct** après PR1.

### Rollback plan (safe)

- Rollback immédiat: `git revert <commit>` (commits atomiques)
- Si PR1/PR2: revert PR complète si besoin.

---

## PLAN PR par PR (2 PR visées)

### PR1 — Introduce supabase standard root

**Objectif**: rendre `supabase/` autonome (config + functions) tout en gardant le legacy en place.

**Changes (attendus)**:
- [x] Créer `supabase/config.toml` (copie adaptée depuis le workdir legacy)
- [x] Déplacer `functions/*` (depuis le workdir legacy) → `supabase/functions/*` (au minimum `admin/`)
- [ ] Vérifier `supabase/config.toml`:
  - [ ] `[functions.admin].import_map = "./functions/admin/deno.json"`
  - [ ] `[functions.admin].entrypoint = "./functions/admin/index.ts"`
- [ ] Garder/compléter `.gitignore` pour `supabase/.temp/`
- [ ] Mettre à jour docs pour ne plus dépendre d’un flag de workdir (minimum: README + doc de test functions)

**DoD PR1**:
- [x] `npm run check` ✅
- [x] `supabase start` (sans `--workdir`) ✅
- [x] `supabase functions serve admin` (sans `--workdir`) ✅
- [x] `supabase stop` ✅

Notes exécution (local Windows):
- `supabase start` affiche un warning Analytics Windows (Docker daemon tcp://localhost:2375). Non bloquant.
- Premier `supabase start` a échoué sur conflit de container `supabase_vector_SER1` (container déjà existant). `supabase stop` puis `supabase start` a résolu.

### PR2 — Remove legacy config workdir

**Objectif**: supprimer l’arbre legacy (workdir dédié) et nettoyer toutes les références.

**Changes (attendus)**:
- [ ] Supprimer l’arbre legacy (workdir dédié)
- [ ] Docs: plus aucune référence à l’ancien workdir / ancien flag de workdir
- [ ] `.gitignore`: reste focalisé sur `supabase/.temp/` (+ autres artefacts supabase)

**DoD PR2**:
- [ ] `rg -n "legacy workdir" .` → 0 résultat
- [ ] `git ls-files | rg "config"` → pas de réintroduction d’un workdir legacy
- [ ] `npm run check` ✅
- [ ] `supabase start` / `supabase functions serve admin` / `supabase stop` ✅

### PR3 — Finalize (uniquement si nécessaire)

- [ ] Supprimer ce fichier `docs/ROADMAP_SUPABASE_OPTION_B.md` (OBLIGATOIRE en dernier)
- [ ] Checks finaux
