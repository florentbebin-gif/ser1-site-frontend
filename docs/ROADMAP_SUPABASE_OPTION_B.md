# ROADMAP — Supabase “Option B” structure (temp)

> ⚠️ **Fichier temporaire** (à supprimer dans la **dernière PR** du chantier).
>
> Objectif: migrer de `config/supabase/` vers l’organisation Supabase standard:
>
> - `supabase/config.toml`
> - `supabase/functions/*`
> - `supabase/migrations/*` (déjà OK)
> - suppression de `config/supabase/`
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

### 1) Inventaire des deux arbres (état actuel)

#### `config/supabase/` (source actuelle config + functions)
- `config/supabase/config.toml`
  - `project_id = "SER1"`
  - section `[functions.admin]`:
    - `verify_jwt = true`
    - `import_map = "./functions/admin/deno.json"`
    - `entrypoint = "./functions/admin/index.ts"`
- `config/supabase/functions/admin/`
  - `index.ts` (Edge Function)
  - `cors.ts`, `cors_test.ts`
  - `deno.json`, `tsconfig.json`, `.npmrc`

#### `supabase/` (source actuelle migrations)
- `supabase/migrations/*` ✅ (canon DB)
- `supabase/.temp/` (artefacts CLI) — doit rester gitignored
- **Absents** aujourd’hui:
  - `supabase/config.toml`
  - `supabase/functions/*`

✅ **Source de vérité actuelle**:
- Migrations: `supabase/migrations/`
- Config Supabase + edge functions: `config/supabase/`

### 1bis) Artefacts trackés à vérifier

À valider en git (attendu: aucun `.temp` tracké; pas de `supabase/config.toml` ni `supabase/functions/*` pour l’instant).

### 2) Références à `--workdir config` / `config/supabase`

**Références `--workdir config` (docs)**:
- `README.md`
- `docs/technical/admin/edge-functions-testing.md`
- `docs/CHANGELOG.md`

**Références `config/supabase` (docs)**:
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
   - `docs/technical/admin/cors-setup.md` mentionne `supabase/config.toml` (et `verify_jwt=false`), mais **le fichier n’existe pas** actuellement et `config/supabase/config.toml` a `verify_jwt=true`.
   - Risque: confusion et procédures locales incohérentes.
3. **Root Supabase unique**
   - Après migration, la CLI doit fonctionner sans `--workdir config`.
   - Risque: CI/docs/scripts qui continuent d’utiliser `--workdir config`.
4. **Ignore `.temp`**
   - Déjà présent dans `.gitignore`:
     - `supabase/.temp/`
     - `config/supabase/.temp/`
   - Après suppression de `config/supabase/`, on gardera `supabase/.temp/`.
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
- [x] Créer `supabase/config.toml` (copie adaptée depuis `config/supabase/config.toml`)
- [x] Déplacer `config/supabase/functions/*` → `supabase/functions/*` (au minimum `admin/`)
- [ ] Vérifier `supabase/config.toml`:
  - [ ] `[functions.admin].import_map = "./functions/admin/deno.json"`
  - [ ] `[functions.admin].entrypoint = "./functions/admin/index.ts"`
- [ ] Garder/compléter `.gitignore` pour `supabase/.temp/`
- [ ] Mettre à jour docs pour ne plus dépendre de `--workdir config` (minimum: README + doc de test functions)

**DoD PR1**:
- [ ] `npm run check` ✅
- [ ] `supabase start` (sans `--workdir`) ✅
- [ ] `supabase functions serve admin` (sans `--workdir`) ✅
- [ ] `supabase stop` ✅

### PR2 — Remove legacy config workdir

**Objectif**: supprimer `config/supabase/` et nettoyer toutes les références.

**Changes (attendus)**:
- [ ] Supprimer `config/supabase/`
- [ ] Docs: plus aucun `config/supabase` / `--workdir config`
- [ ] `.gitignore`: retirer l’entrée `config/supabase/.temp/` (optionnel, mais propre)

**DoD PR2**:
- [ ] `rg -n "(--workdir config|config/supabase)" .` → 0 résultat
- [ ] `git ls-files | rg "config/supabase"` → 0 résultat
- [ ] `npm run check` ✅
- [ ] `supabase start` / `supabase functions serve admin` / `supabase stop` ✅

### PR3 — Finalize (uniquement si nécessaire)

- [ ] Supprimer ce fichier `docs/ROADMAP_SUPABASE_OPTION_B.md` (OBLIGATOIRE en dernier)
- [ ] Checks finaux
