# Contributing to SER1

## Workflow Git

```bash
# 1. Créer une branche depuis main
git checkout main
git pull
git checkout -b feature/nom-clair

# 2. Quality Gates (obligatoires avant commit)
npm run check      # Tous les checks (lint + typecheck + test + build)
# ou individuellement :
npm run lint       # ESLint - 0 erreur
npm run typecheck  # TypeScript - 0 erreur
npm test           # 83 tests passent
npm run build      # Build Vite OK

# 2bis. Guardrail sécurité (avant PR / merge)
# - Ne loggue pas de contenus sensibles (uniquement PASS/FAIL + fichiers)
powershell -ExecutionPolicy Bypass -File .\tools\scripts\pre-merge-check.ps1

# 3. Analyses optionnelles
npm run check:circular  # Détection dépendances circulaires
npm run check:unused    # Rapport dépendances inutilisées
npm run analyze         # Visualisation bundle
npm run test:e2e        # Tests E2E Playwright

# 4. Commit et push
git add .
git commit -m "feat: description claire"
git push origin feature/nom-clair
```

## Conventions

### Nommage fichiers
- Nouveau code : **TSX** obligatoire (pas JSX)
- Composants : PascalCase (`SettingsCard.tsx`)
- Utilitaires : camelCase (`settingsHelpers.ts`)
- Tests : `*.test.ts` à côté du fichier testé

### Architecture
- **Logique métier** → `src/engine/` uniquement
- **UI / State** → `src/pages/` ou `src/features/`
- **Pas de calcul fiscal dans les composants React**
- **Imports** :
  - **`@/`** pour les imports cross-module / cross-feature (ex: `@/utils/`, `@/components/`)
  - **Chemins relatifs** (`./`, `../`) OK pour les imports locaux (même dossier ou sous-dossier)

### Sécurité
- **Auth** : Ne JAMAIS utiliser `user_metadata` pour les décisions d'autorisation (rôles, permissions). Utiliser `app_metadata` uniquement.
  - Voir [docs/technical/security-user-metadata-guidelines.md](docs/technical/security-user-metadata-guidelines.md)
- **Logging** : Aucun log de données sensibles en production.
- **Runbooks / Evidence** : Interdit de committer des outputs runtime bruts (SQL, logs, dumps HTTP).
  - Utiliser uniquement des templates `*.example` + redactions.

### TypeScript
- Types importés depuis les **modules sources**, pas depuis les Providers
- Exemple : `import { ThemeColors } from './theme'` ✓  
  Pas : `import { ThemeColors } from './ThemeProvider'` ✗ (sauf si ré-exporté)

### TODO/FIXME
- Format obligatoire : `TODO(#123): description` avec référence issue
- Interdit : `TODO: fix this` sans identifiant

### Logging
- `console.error/warn` : erreurs réelles uniquement
- `console.log/info/debug` : **interdit** sauf derrière flag `DEBUG_*`
- En prod : aucun log sensible (pas de données utilisateur)

### CSS Governance
- **Interdiction** : Un fichier CSS d'une page ne doit jamais importer un CSS d'une autre page
- **Pattern correct** : 
  - Styles partagés → `src/styles/` (variables CSS, utilitaires)
  - Styles page-spécifiques → `src/pages/PageName.css` uniquement
- **Exemple de correction** : `PlacementV2.jsx` importait `Ir.css` ; `src/pages/Placement.css` removed (PR2) — styles migrated to `src/features/placement/components/PlacementSimulator.css`

### Imports (règles détaillées)
- **Alias `@/`** : Toujours privilégié pour les imports cross-module
  ```javascript
  // ✅ Correct
  import { Button } from '@/components/Button';
  import { debugLog } from '@/utils/debugFlags';
  
  // ❌ Incorrect
  import { Button } from '../../../components/Button';
  ```
- **Chemins relatifs** : Uniquement pour imports locaux (même dossier ou sous-dossier)
  ```javascript
  // ✅ Correct - import local
  import { helper } from './utils';
  import { Input } from '../components/Input';
  ```

## PR Checklist

- [ ] `npm run check` passe (tous les checks)
- [ ] `npm run lint` passe
- [ ] `npm run typecheck` passe (0 erreur)
- [ ] `npm test` passe (83 tests)
- [ ] `npm run build` passe
- [ ] Pas de `console.log` ajouté
- [ ] TODO/FIXME ont un identifiant
- [ ] Imports `@/` utilisés pour cross-module
- [ ] Pas d'import CSS croisé entre pages
