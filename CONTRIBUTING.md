# Contributing to SER1

## Workflow Git

```bash
# 1. Créer une branche depuis main
git checkout main
git pull
git checkout -b feature/nom-clair

# 2. Quality Gates (obligatoires avant commit)
npm run lint      # ESLint - 0 erreur
npm run typecheck # TypeScript - 0 erreur
npm test          # 71 tests passent
npm run build     # Build Vite OK

# 3. Commit et push
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

## PR Checklist

- [ ] `npm run lint` passe
- [ ] `npm run typecheck` passe (0 erreur)
- [ ] `npm test` passe
- [ ] `npm run build` passe
- [ ] Pas de `console.log` ajouté
- [ ] TODO/FIXME ont un identifiant
