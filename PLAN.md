# Plan de Mise à Jour Pragmatique — SER1

> **Branche :** `refactor/codebase-cleanup-plan`  
> **Date :** 2026-02-08  
> **Approche :** Simple, safe, pro — pas de réécriture, pas de nouveaux dossiers, pas d'usine à gaz.

---

## Résumé de l'approche (10 lignes)

- **Stopper la dette** : console.*, imports @/, CSS croisés
- **Consolider** : pages vivantes → extraction progressive, pages figées → smoke tests uniquement
- **Proteger** : garde-fous automatisés (husky + lint-staged) pour empêcher la régression
- **Stratégie minimal viable** : pas de refactors structurels, uniquement des corrections ciblées
- **Risque global :** Faible à moyen — chaque étape est atomique et rollbackable
- **Temps estimé total :** 4-6 heures de travail concentré

---

## Cartographie des zones à risque (Top 10)

| Rang | Fichier | Lignes | Statut | Risque principal |
|------|---------|--------|--------|------------------|
| 1 | `SettingsFiscalites.jsx` | 1616 | 🔥 **Vivant** (10 commits récents) | Monolithique, mélange UI/API/validation |
| 2 | `SettingsComptes.jsx` | 1225 | 🔥 **Vivant** (36 commits récents) | Thème + cabinets + signalements, très actif |
| 3 | `SettingsPrelevements.jsx` | 1424 | 🔥 **Vivant** (10 commits récents) | PASS history, 8 imports `../../` |
| 4 | `SettingsImpots.jsx` | 1246 | 🔥 **Vivant** (12 commits récents) | Tables fiscales complexes |
| 5 | `Credit.jsx` | 1313 | 🔥 **Vivant** (25 commits récents) | Simulateur avec state dense |
| 6 | `Ir.jsx` | 1285 | 🔥 **Vivant** (25 commits récents) | Moteur IR inline |
| 7 | `PlacementV2.jsx` | 1047 | 🔥 **Vivant** (11 commits récents) | Import CSS croisé `./Ir.css` |
| 8 | `ThemeProvider.tsx` | 597 | 🔥 **Vivant** (39 commits récents) | Logique thème complexe mais isolée |
| 9 | `placementEngine.js` | 1219 | 🧊 **Figé** | Moteur stable, bien testé |
| 10 | `Home.jsx` | ~150 | 🧊 **Figé** (11 commits, stable) | Page statique, peu de risque |

**Classification :**
- 🔥 **Vivant** : fichiers fréquemment modifiés, nécessitent découpage progressif
- 🧊 **Figé** : stable, tests smoke suffisants

---

## Plan en commits atomiques (8 commits)

### Commit 1 — `chore: nettoyer console.* non conditionnés`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Éliminer les logs en production qui ne sont pas derrière DEBUG flags |
| **Difficulté** | ⭐⭐ Moyenne — nécessite analyse contextuelle de chaque log |
| **Fichiers** | `src/auth/AuthProvider.tsx`, `src/engine/helpers.ts`, `src/pptx/presets/*.ts`, `src/utils/exportExcel.js` |
| **Risque** | Faible — uniquement suppression de logs |
| **Rollback** | `git revert HEAD` ou restaurer les lignes depuis l'historique |

**Actions :**
1. Remplacer par `debugLog('pptx', ...)` ou supprimer si obsolètes
2. Pour `engine/helpers.ts` : vérifier que `trace()` n'est jamais appelé sans flag

**Validation :**
```bash
npm run lint
npm run typecheck
npm test
# Vérifier qu'aucun console.* ne reste (sauf dans __tests__ et debugFlags.ts)
grep -r "console\.(log|debug|info|trace)" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "__tests__" | grep -v ".test." | grep -v "debugFlags" | grep -v "eslint-disable"
```

---

### Commit 2 — `chore: ajouter garde-fou anti-console en CI`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Empêcher toute régression sur les `console.*` en production |
| **Difficulté** | ⭐ Facile — simple ajout de step CI |
| **Fichiers** | `.github/workflows/ci.yml` |
| **Risque** | Très faible — ajout de check uniquement |
| **Rollback** | Supprimer l'étape du workflow |

**Actions :**
1. Ajouter une étape de vérification dans la CI :
```yaml
- name: Check no console.* in production
  run: |
    ! grep -r "console\.(log|debug|info|trace)" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "__tests__" | grep -v ".test." | grep -v "debugFlags" | grep -v "eslint-disable-next-line"
```

**Validation :**
- CI passe sur la PR
- Tester en ajoutant un `console.log` temporaire → CI doit échouer

---

### Commit 3 — `chore: setup husky + lint-staged pour quality gates pre-commit`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Empêcher les commits qui cassent les quality gates |
| **Difficulté** | ⭐ Facile — tooling standard |
| **Fichiers** | `.husky/pre-commit` (nouveau), `package.json` |
| **Risque** | Faible — tooling dev uniquement |
| **Rollback** | `git rm -r .husky` + `npm uninstall husky lint-staged` |

**Actions :**
1. Installer husky et lint-staged :
```bash
npm install --save-dev husky lint-staged
npx husky init
```
2. Configurer `.husky/pre-commit` :
```bash
npx lint-staged
```
3. Ajouter dans `package.json` :
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "tsc --noEmit --skipLibCheck"
    ]
  }
}
```

**Validation :**
- Modifier un fichier avec une erreur ESLint → commit doit bloquer
- Corriger l'erreur → commit doit passer

**Alternative Minimal** (si husky trop lourd) : Documenter dans CONTRIBUTING.md l'obligation de passer les quality gates manuellement.

---

### Commit 4 — `refactor: standardiser imports vers @/ pour les cross-module`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Réduire les imports fragiles `../../` en favorisant `@/` |
| **Difficulté** | ⭐⭐ Moyenne — changement de chemins, risque d'erreurs de résolution |
| **Fichiers** | `SettingsComptes.jsx`, `SettingsPrelevements.jsx`, `SettingsImpots.jsx`, `SettingsFiscalites.jsx` |
| **Risque** | Moyen — changement de chemins, mais TypeScript détectera les erreurs |
| **Rollback** | `git revert HEAD` |

**Actions :**
1. Remplacer les imports cross-module par `@/` :
   - `from '../components/X'` → `from '@/components/X'`
   - `from '../utils/X'` → `from '@/utils/X'`
   - `from '../engine/X'` → `from '@/engine/X'`
   - `from '../hooks/X'` → `from '@/hooks/X'`
2. Garder les imports relatifs pour les sous-modules (même dossier) :
   - `from './utils/formatters'` ✓ (reste relatif)

**Validation :**
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

### Commit 5 — `fix: corriger import CSS croisé PlacementV2 → Ir.css`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Éliminer la dépendance CSS inter-pages |
| **Difficulté** | ⭐⭐⭐ Difficile — nécessite analyse visuelle et merge CSS |
| **Fichiers** | `PlacementV2.jsx`, `Placement.css`, `Ir.css` |
| **Risque** | Moyen — risque visuel, à tester manuellement |
| **Rollback** | Restaurer l'import et revert le CSS |

**Actions :**
1. Identifier dans `Ir.css` quelles règles sont utilisées par PlacementV2
2. Déplacer ces règles dans `Placement.css` ou créer `src/styles/shared-simulators.css`
3. Remplacer `import './Ir.css'` par l'import correct

**Validation :**
- Vérifier visuellement PlacementV2 (pas de régression CSS)
- `npm run build`

---

### Commit 6 — `docs: ajouter règles imports et CSS à CONTRIBUTING.md`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Documenter les garde-fous pour éviter régression |
| **Difficulté** | ⭐ Facile — documentation uniquement |
| **Fichiers** | `CONTRIBUTING.md` |
| **Risque** | Nul — documentation uniquement |
| **Rollback** | `git revert HEAD` |

**Actions :**
1. Ajouter section "Imports" :
   - `@/` obligatoire pour cross-module
   - Interdiction d'importer CSS d'une autre page
   - Exemples de bon/mauvais patterns
2. Ajouter section "CSS" :
   - Chaque page a son propre CSS ou utilise `styles.css` global
   - Pas d'import `../Page/Page.css`

**Validation :**
- Relecture du markdown

---

### Commit 7 — `test: ajouter smoke tests Playwright pour pages figées`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Protéger les pages figées contre les régressions |
| **Difficulté** | ⭐⭐ Moyenne — écriture de tests E2E |
| **Fichiers** | `tests/e2e/smoke.spec.ts` (nouveau ou compléter) |
| **Risque** | Faible — ajout de tests uniquement |
| **Rollback** | Supprimer les tests ajoutés |

**Actions :**
1. Ajouter tests smoke pour pages figées :
   - Home
   - Login
   - ForgotPassword
   - SetPassword
   - Placement (lecture seule)
2. Tests minimaux : chargement sans erreur console, éléments clés présents

**Validation :**
```bash
npm run test:e2e
```

---

### Commit 8 — `refactor: extraire helpers Settings API dans fichier dédié (amorce)`

| Aspect | Détail |
|--------|--------|
| **Objectif** | Commencer le découplage UI/API dans Settings sans tout casser |
| **Difficulté** | ⭐⭐⭐ Difficile — extraction partielle risquée si mal faite |
| **Fichiers** | `SettingsComptes.jsx`, `src/features/settings/api/settingsApi.ts` (nouveau) |
| **Risque** | Moyen — extraction partielle, mais limitée à 2-3 fonctions |
| **Rollback** | Copier-coller les fonctions retour dans SettingsComptes |

**Actions :**
1. Créer `src/features/settings/api/settingsApi.ts`
2. Y déplacer **2-3 fonctions** d'appel Supabase les plus simples de SettingsComptes :
   - Ex: `fetchCabinets()`, `updateTheme()`, `uploadLogo()`
3. Remplacer dans SettingsComptes par import du nouveau module
4. Ne **PAS** tout déplacer d'un coup — juste amorce

**Validation :**
- Tests Settings passent
- Build OK
- Smoke test manuel sur SettingsComptes

---

## Garde-fous à mettre en place

### Anti console.* — Option Minimal (recommandée)

**Mise en place :**
```bash
# Dans .husky/pre-commit
npm run lint
# ESLint no-console: error dans eslint.config.js (déjà présent)
```

**CI check** (déjà dans Commit 2) :
```yaml
- name: Check console.* in production
  run: |
    ! grep -r "console\.(log|debug|info|trace)" src/ \
      --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
      | grep -v "__tests__" | grep -v ".test." | grep -v "debugFlags" \
      | grep -v "eslint-disable"
```

### Règle d'import @/

**CONTRIBUTING.md** (Commit 6) :
```markdown
### Imports — Règles absolues
- ✅ `from '@/components/X'` — cross-module
- ✅ `from './utils/X'` — sous-module local
- ❌ `from '../../components/X'` — interdit, utiliser `@/`
```

**Lint (optionnel Plus Robuste)** : Plugin ESLint `eslint-plugin-import` avec `no-relative-parent-imports`, mais peut être bruyant. **Recommandé :** documentation + revue de code.

### Règle CSS — Pas d'import croisé

**CONTRIBUTING.md** (Commit 6) :
```markdown
### CSS — Règles absolues
- ✅ `import './MaPage.css'` — CSS de la page
- ✅ `import '@/styles/global.css'` — CSS global partagé
- ❌ `import '../AutrePage/AutrePage.css'` — INTERDIT
```

---

## Définition de Done finale

| Critère | Validation |
|---------|------------|
| ✅ Aucun `console.*` en production | `grep` vide + CI passe |
| ✅ Imports standardisés | 0 import `../../components/` dans les fichiers vivants |
| ✅ Pas de CSS croisé | `PlacementV2.jsx` n'importe plus `Ir.css` |
| ✅ Quality gates automatisés | Husky bloque les commits qui cassent lint/typecheck |
| ✅ Pages figées protégées | Smoke tests Playwright passent pour Home/Login/Placement |
| ✅ Documentation à jour | CONTRIBUTING.md mentionne les règles imports/CSS |
| ✅ Build & tests | `npm run build && npm test` passe |
| ✅ Onboarding < 30 min | Nouveau dev clone, lit README, installe, démarre → OK |

**Smoke tests manuels à faire après chaque commit :**
1. Page d'accueil (Home)
2. Login / navigation
3. Un simulateur (Credit ou IR)
4. Settings (Comptes)
5. Export PPTX (si possible)

---

## Commandes de validation globale

```bash
# Quality Gates
npm run lint
npm run typecheck
npm test
npm run build

# Check console.* restants
grep -r "console\.(log|debug|info|trace)" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "__tests__" | grep -v ".test." | grep -v "debugFlags" | grep -v "eslint-disable"

# Check imports ../../ restants
grep -r "from.*\.\./\.\./" src/pages/Sous-Settings/

# E2E tests
npm run test:e2e
```

---

*Plan généré le 2026-02-08 — Branche: refactor/codebase-cleanup-plan*
