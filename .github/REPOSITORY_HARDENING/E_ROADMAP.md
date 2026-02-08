# E) Plan d'Amélioration & Roadmap - SER1 Repository

> Version : 2026-02-08  
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

### ~~Février : Export PPTX Professionnel (Issues #17, #18, #20, #22)~~ ✅ **RÉSOLU**

#### ~~Sprint 1 : Logo Data URI (#22)~~ ✅

**Livré** : `prepareLogoForInjection()` avec import dynamique de `loadLogoDataUriSafe`

#### ~~Sprint 2 : Masters Slides (#20)~~ ✅

**Livré** :
- 4 masters définis via `defineSlideMasters()` (COVER, CHAPTER, CONTENT, END)
- 10 builders refactorisés pour utiliser `masterName`
- Zéro régression visuelle

#### ~~Sprint 3 : Spike Template Natif (#17, #18)~~ ✅

**Livré** :
- POC `analyzePptxStructure.ts` — 8/8 tests passent
- ADR-001 : Template codé PptxGenJS retenu (template natif rejeté)
- Voir `docs/adr/ADR-001-pptx-template-strategy.md`

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

MARS 2026 (avance sur planning — #17/#18/#20/#22 résolus en février)
├── S1 : Tests coverage + E2E setup
├── S2 : Refactor large files
├── S3-4 : Nouveaux simulateurs PPTX
└── S5 : Stabilisation

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

## 🎯 Prochaine Session

**Date suggérée** : Semaine du 10 Février 2026  
**Scope** : Phase 3 (Tests, Refactoring, Nouveaux simulateurs)  
**Durée estimée** : 1-2 semaines  
**Livrables attendus** :
- Tests E2E Playwright setup
- Refactor ThemeProvider.tsx
- Nouveau simulateur PPTX (Placement ou Succession)

---

*Roadmap générée suite à l'audit de hardening SER1*
