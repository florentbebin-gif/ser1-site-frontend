---
description: Repo simplification roadmap (temp)
---

# ROADMAP — Repo Simplify (temp)

> ⚠️ **Temporaire** : ce fichier sert de checklist PR-par-PR pendant la phase de simplification.
>
> - À **mettre à jour à chaque PR** (cocher + ajouter lien PR / commit).
> - À **supprimer dans la dernière PR** (quand le repo est stabilisé).
>
> Règle globale : **micro-étapes buildables** (idéalement 1 commit), et **`npm run check` doit passer après chaque commit**.

## Definition of Done (pour chaque PR)

- [ ] `npm run check` ✅ (lint + typecheck + tests + build)
- [ ] Aucun artefact / output généré **tracké** (dist, reports, caches, etc.)
- [ ] `.gitignore` aligné avec les outputs/caches réellement générés
- [ ] Pas de fichiers > 500 lignes (si création/déplacement)

---

## Checklist PRs

### PR-00 — Root files (artefact ESLint)
- [x] Supprimer `eslint-report.json` (artefact tracké + déjà ignoré)
  - Commit: `619a911`

### PR-01 — Outputs / caches (dist/, playwright-report/, test-results/, .vercel/, etc.)
- [x] Inventaire: tracké vs généré (preuves: `git ls-files`, `git status`)
- [x] Purge du tracké inutile (si présent)
- [x] `.gitignore` aligné
- [x] `npm run check` ✅
  - Commit: `7ef155c`

### PR-02 — docs/
- [ ] Inventaire docs (doublons, archives, liens)
- [ ] Micro-cleanup safe (déplacements/renames/suppressions) + liens mis à jour
  - [x] Supprimer `docs/INDEX.md` (non référencé, redondant avec README)
- [ ] `npm run check` ✅

### PR-03 — public/
- [ ] Inventaire assets (doublons, legacy, génération)
- [ ] Nettoyage safe + vérif build
- [ ] `npm run check` ✅

### PR-04+ — src/ (page-first)
- [ ] Appliquer progressivement l’orga **page-first** :
  - page-spécifique → `src/pages/<page>/` (UI + styles + logique spécifique)
  - partagé → `src/components|hooks|engine|utils`
- [ ] Split si fichier approche > 500 lignes
- [ ] `npm run check` ✅

### PR-FINAL — Cleanup
- [ ] Supprimer `docs/ROADMAP_REPO_SIMPLIFY.md`
- [ ] `npm run check` ✅
