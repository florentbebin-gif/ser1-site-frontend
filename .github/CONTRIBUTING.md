# Contributing to SER1

## Workflow Git

```bash
# 1. Créer une branche depuis main
git checkout main
git pull
git checkout -b feature/nom-clair

# 2. Quality Gates (obligatoires avant commit)
npm run check      # Tous les checks (lint + check:fiscal-hardcode + check:arch + typecheck + test + build)
# ou individuellement :
npm run lint       # ESLint - 0 erreur
npm run check:arch # Garde-fous d'architecture dependency-cruiser - 0 violation
npm run typecheck  # TypeScript - 0 erreur
npm test           # Tous les tests passent
npm run build      # Build Vite OK

# 2bis. Guardrail sécurité (avant PR / merge)
# Scan : secrets (JWT, clés API), SQL runtime trackés, patterns interdits.
# - Ne loggue pas de contenus sensibles (uniquement PASS/FAIL + fichiers)
powershell -ExecutionPolicy Bypass -File .\scripts\pre-merge-check.ps1

# 3. Analyses optionnelles
npm run check:circular  # Détection dépendances circulaires
npm run check:unused    # Rapport dépendances inutilisées (avec ignore des faux positifs connus)
npm run analyze         # Visualisation bundle
npm run test:e2e        # Tests E2E Playwright

# 4. Commit et push
git add .
git commit -m "feat: description claire"
git push origin feature/nom-clair
```

## Conventions

### Nommage fichiers
- Nouveau code : **TypeScript** (`.ts` / `.tsx`) dans `src/`
- `src/` ne doit contenir aucun fichier `.js/.jsx` ; `npm run check:no-js` bloque ces extensions
- Composants : PascalCase (`SettingsCard.tsx`)
- Utilitaires : camelCase (`settingsHelpers.ts`)
- Tests : `*.test.ts` à côté du fichier testé

### Architecture
- **Logique métier** → `src/engine/` uniquement
- **UI / State** → `src/pages/` ou `src/features/`
- **Pas de calcul fiscal dans les composants React**
- **Docs de référence** :
  - UI / `/sim/*` / thème → `docs/GOUVERNANCE.md`
  - PPTX / Excel → `docs/GOUVERNANCE_EXPORTS.md`
- **Imports** :
  - **`@/`** pour les imports cross-module / cross-feature (ex: `@/utils/`, `@/components/`)
  - **Chemins relatifs** (`./`, `../`) OK pour les imports locaux (même dossier ou sous-dossier)

### Sécurité
- **Auth** : Ne JAMAIS utiliser `user_metadata` pour les décisions d'autorisation (rôles, permissions). Utiliser `app_metadata` uniquement.
  - Voir [docs/GOUVERNANCE.md](docs/GOUVERNANCE.md)
- **Admin** : Toujours consommer les actions admin via `adminClient` (`src/settings/admin/adminClient.ts`), **jamais via `invokeAdmin` directement** depuis une page ou un composant.
  - `invokeAdmin` est un détail d'implémentation interne — les consommateurs doivent utiliser `adminClient`.
- **`update_user_role`** : Action réservée au `owner` uniquement (`principal.accountKind === 'owner'`). Ne pas exposer de bouton de changement de rôle à un `dev_admin`.
- **Logging** : Aucun log de données sensibles en production.
- **Runbooks / Evidence** : Interdit de committer des outputs runtime bruts (SQL, logs, dumps HTTP).
  - Utiliser uniquement des templates `*.example` + redactions.

### TypeScript
- Types importés depuis les **modules sources**, pas depuis les Providers
- Exemple : `import { ThemeColors } from './theme'` ✓  
  Pas : `import { ThemeColors } from './ThemeProvider'` ✗ (sauf si ré-exporté)
- `allowJs: true` dans `tsconfig` ne change pas la règle repo : pas de nouveau `.js/.jsx` dans `src/`

### TODO/FIXME
- Format obligatoire : `TODO(#123): description` avec référence issue
- Interdit : `TODO: fix this` sans identifiant

### Logging
- `console.error/warn` : erreurs réelles uniquement
- `console.log/info/debug` : **interdit** sauf derrière flag `DEBUG_*`
- En prod : aucun log sensible (pas de données utilisateur)

### CSS Governance
- **Interdiction** : Un fichier CSS d'une page ou d'une feature ne doit jamais importer le CSS d'une autre page/feature
- **Pattern correct** : 
  - Styles partagés → `src/styles/` (variables CSS, utilitaires, patterns communs)
  - Styles spécifiques → co-localisés avec la surface concernée (`src/pages/` ou `src/features/...`)
- **Si deux surfaces partagent des styles** : extraire la base commune vers `src/styles/` ou vers un composant partagé, jamais vers le CSS d'une autre page

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
- [ ] `npm run check:arch` passe (0 violation d'architecture)
- [ ] `npm run typecheck` passe (0 erreur)
- [ ] `npm test` passe
- [ ] `npm run build` passe
- [ ] Pas de `console.log` ajouté
- [ ] TODO/FIXME ont un identifiant
- [ ] Imports `@/` utilisés pour cross-module
- [ ] Pas d'import CSS croisé entre pages
- [ ] Appels admin via `adminClient`, pas `invokeAdmin` directement
