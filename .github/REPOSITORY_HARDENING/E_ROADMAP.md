# E) Plan d'Amélioration & Roadmap - SER1 Repository

> Version : 2026-02-07  
> Horizon : Q1 2026 (Février - Mars - Avril)  
> Objectif : Passer de 20/25 (80%) à 24/25 (96%)

---

## 🎯 Vision

Transformer SER1 en codebase "production-grade" avec :
- Zero dette technique critique
- Tests automatisés complets
- Documentation maintenable
- CI/CD robuste

---

## Phase 1 : Quick Wins Suite (Février 2026)

### Semaine 1-2 : Dette Technique Mineure

| Issue | Description | Effort | Livrable |
|-------|-------------|--------|----------|
| ~~#25~~ | ~~Remove deprecated logo handling in Settings.jsx~~ | ~~XS (1h)~~ | ✅ **RÉSOLU** |
| ~~#21~~ | ~~Vérifier présence fichier template~~ | ~~XS (2h)~~ | ✅ **RÉSOLU** |
| ~~#23~~ | ~~Vérifier images chapitre~~ | ~~XS (2h)~~ | ✅ **RÉSOLU** |
| ~~#19~~ | ~~Définir dimensions slides explicites~~ | ~~XS (2h)~~ | ✅ **RÉSOLU** |

**Objectif** : Nettoyer les TODOs XS, atteindre 21/25

---

## Phase 2 : Fonctionnalités Critiques (Février-Mars 2026)

### ~~Semaine 3-4 : Barèmes DMTG (Issue #24)~~ ✅ **RÉSOLU**

**Impact** : Calculs fiscaux corrects pour tous les cas de succession

**Livrables** :
- `src/engine/civil.ts` — Types `DmtgSettings` + `DEFAULT_DMTG` (4 catégories)
- `src/engine/succession.ts` — `calculateDMTG()` multi-barèmes par lien de parenté
- `src/pages/Sous-Settings/SettingsImpots.jsx` — Référentiel admin modifiable (4 sous-sections)
- `src/utils/fiscalSettingsCache.js` — Defaults DMTG synchronisés
- Tests : 16 tests dont 4 nouveaux barèmes DMTG

---

### Mars : Export PPTX Professionnel (Issues #17, #18, #20)

#### Sprint 1 : Solution Template PPTX (#17, #18)

**Options à évaluer** :
1. **pptx-template** (lib externe) - Recherche solution
2. **pptxgenjs/plugins** - Vérifier support template
3. **Parser XML** - Solution custom lourde

**Décision requise** : Architecture review

**Livrables** :
- POC chargement template
- Benchmark solutions
- Architecture Decision Record (ADR)

#### Sprint 2 : Masters Slides (#20)

**Dépendance** : Issue #17 résolue

```
Masters à créer :
├── Cover slide (titre + logo)
├── Chapter slide (transition chapitres)
├── Content slide (contenu texte/charts)
└── End slide (conclusion + contact)
```

**Livrables** :
- `src/pptx/masters/` module
- Template `serenity-base.pptx` validé

---

## Phase 3 : Excellence Technique (Avril 2026)

### Semaine 1 : Tests & Couverture

| Cible | Action | Métrique |
|-------|--------|----------|
| Engine | Ajouter tests succession | +20 tests |
| PPTX | Tests génération | Coverage >60% |
| E2E | Playwright setup | 5 scénarios critiques |

**Livrables** :
- `tests/e2e/` dossier
- CI : step e2e ajouté
- Coverage report dans PR

### Semaine 2 : Refactoring Large Files

| Fichier | Action | Lignes cible |
|---------|--------|--------------|
| `ThemeProvider.tsx` (~970l) | Split en hooks + context | <300l par fichier |
| `PlacementV2.jsx` (~530l) | Extraction composants | <300l par fichier |

**Livrables** :
- `src/settings/ThemeProvider/` dossier
- `src/features/placement/` composants
- 0 warning ESLint "max-lines"

### Semaine 3-4 : Documentation & Tooling

```
Documentation :
├── ADR/ (Architecture Decision Records)
├── docs/api/ (API Supabase documentée)
├── docs/fiscal/ (Barèmes et règles)
└── CONTRIBUTING.md (update avec nouvelles règles)

Tooling :
├── Pre-commit hooks (husky)
├── Semantic commits validation
├── Dependabot activé
└── Snyk ou GitHub Advanced Security
```

---

## 🗓️ Roadmap Visuelle

```
FÉVRIER 2026
├── S1-2 : #25, #21, #23, #19 (XS cleanup)
├── S3-4 : #24 (Barèmes DMTG - CRITIQUE)
└── S5 : Code review + Release notes

MARS 2026
├── S1-2 : POC Template PPTX (#17, #18)
├── S3 : Masters slides (#20)
├── S4 : Logo data URI (#22)
└── S5 : Stabilisation + Tests E2E setup

AVRIL 2026
├── S1 : Tests coverage + E2E
├── S2 : Refactor large files
├── S3-4 : Documentation + Tooling
└── S5 : Release v2.0 "Production Grade"
```

---

## 📊 Métriques de Succès

### Objectifs Quantitatifs

| Métrique | Actuel | Cible Q1 | Commentaire |
|----------|--------|----------|-------------|
| Score qualité | 20/25 | 24/25 | +4 points |
| Tests | 71 | 120+ | +70% coverage |
| TODOs ouverts | 9 | 0 | Tous résolus |
| Fichiers >500l | 2 | 0 | Refactorisés |
| CI time | ~3min | <2min | Optimisations |

### Objectifs Qualitatifs

- [ ] Zero `console.log` en production
- [ ] 100% TODOs liés à issues ou supprimés
- [ ] Documentation API complète
- [ ] Onboarding nouveau dev < 30min

---

## 🚧 Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Issue #17 (PPTX) complexe | Élevée | Forte | Timebox à 2 semaines, fallback reconstruction |
| Expertise fiscale manquante | Moyenne | Forte | Externaliser validation barèmes |
| Refactor large files cassant | Moyenne | Moyenne | Tests E2E avant refactoring |
| Dépendance Vite/Supabase | Faible | Forte | Garder versions LTS |

---

## 🎯 Prochaine Session

**Date suggérée** : Semaine du 10 Février 2026  
**Scope** : Phase 1 (XS cleanup) + début Phase 2 (#24 barèmes)  
**Durée estimée** : 2-3 jours  
**Livrables attendus** :
- PR #25, #21, #23, #19 merged
- Début implémentation #24 (structure + barème frères/sœurs)

---

*Roadmap générée suite à l'audit de hardening SER1*
