# Contributing to SER1

## Workflow Git

```bash
# 1. Créer une branche depuis main
git checkout main
git pull
git checkout -b feature/nom-clair

# 2. Quality Gates (obligatoires avant commit)
npm run check      # Toutes les familles bloquantes locales
# ou individuellement :
npm run format:check # Format Prettier - 0 fichier à reformater
npm run lint       # ESLint - 0 erreur
npm run check:arch # Garde-fous d'architecture dependency-cruiser - 0 violation
npm run check:deep-imports # 0 import profond ../../../ hors tests
npm run check:supabase-rls # RLS public explicite
npm run check:settings-rls # RLS settings ciblé
npm run check:storage-policies # Policies Storage utilisées
npm run check:export-parity # Parité métriques UI/export
npm run check:ser1-colors-plugin # Tests du plugin ESLint couleurs SER1
npm run typecheck  # TypeScript - 0 erreur
npm test           # Tous les tests passent
npm run build      # Build Vite OK

# 2bis. Guardrail sécurité (avant PR / merge)
# Scan : secrets (JWT, clés API), SQL runtime trackés, patterns interdits.
# - Ne loggue pas de contenus sensibles (uniquement PASS/FAIL + fichiers)
powershell -ExecutionPolicy Bypass -File .\scripts\pre-merge-check.ps1

# 3. Analyses complémentaires
# Ces commandes restent lançables seules, mais elles sont déjà couvertes par npm run check.
npm run check:circular  # Détection dépendances circulaires
npm run check:unused    # Rapport dépendances inutilisées (avec ignore des faux positifs connus)

# Informatif, non bloquant
npm run lhci            # Lighthouse informatif, non bloquant
npm run analyze         # Visualisation bundle
npm run test:e2e        # Tests E2E Playwright

# 4. Commit et push
git add .
git commit -m "feat: description claire"
git push origin feature/nom-clair
```

## Commits & Releases

Le `CHANGELOG.md` est généré et maintenu **automatiquement par Release Please** à partir des commits. **Ne pas l'éditer manuellement dans une PR fonctionnelle.**

### Règles

- **Les PR fonctionnelles ne modifient pas `CHANGELOG.md`.** Toute édition manuelle sera écrasée par la PR de release.
- **Les commits suivent Conventional Commits.** commitlint (hook `commit-msg`) valide localement à chaque commit.
- **Types autorisés** : `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `build`, `ci`, `revert`.
- **Sujet en minuscules**, descriptif, 10-100 caractères, sans point final.
  - ✅ `feat(succession): ajouter le sélecteur de régime matrimonial`
  - ❌ `Update stuff.` (trop court, capitalisation, point final)
- **Seuls `feat:` et `fix:` déclenchent une release** (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major).
- **`chore:`, `docs:`, `test:`, `refactor:`** : utiles au repo, n'apparaissent pas dans le CHANGELOG client.

### Cycle de release

Release Please ne tourne **plus à chaque merge sur main** : il est déclenché manuellement ou via cron mensuel pour éviter le bruit.

1. Tu pousses des commits `feat:`/`fix:` sur main (via PRs mergées).
2. Quand tu décides de release : onglet **Actions** GitHub → workflow **Release Please** → **Run workflow**.
3. Release Please ouvre ou met à jour la PR `chore(main): release X.Y.Z` avec le diff `CHANGELOG.md` + bump `package.json`.
4. Tu **relis** la PR de release, ajustes si nécessaire (édition du CHANGELOG OK ici, c'est son rôle).
5. Tu **merges** la PR de release → tag automatique + GitHub Release + CHANGELOG publié.

Filet de sécurité : cron mensuel le 1er du mois à 09:00 UTC qui met la PR à jour si elle a été oubliée.

### À NE PAS faire

- ❌ Ajouter une règle CI « la PR doit modifier `CHANGELOG.md` » → conflits permanents avec Release Please.
- ❌ Commit `feat:` pour un simple refactor → fausse une minor bump.
- ❌ Merger directement sur main sans passer par une PR avec quality gate.

---

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
  - UI / `/sim/*` / thème → `docs/DESIGN.md` puis `docs/GOUVERNANCE.md`
  - PPTX / Excel → `docs/GOUVERNANCE_EXPORTS.md`
- **Imports** :
  - **`@/`** pour les imports cross-module / cross-feature (ex: `@/utils/`, `@/components/`)
  - **Chemins relatifs** (`./`, `../`) OK pour les imports locaux (même dossier ou sous-dossier)
  - **`../../../` interdit hors tests** : `npm run check:deep-imports` garde une baseline à zéro pour les imports statiques, dynamiques et CSS.
  - **`src/reporting/` n'importe jamais `src/features/`** : les migrations de snapshots et contrats reporting consomment les moteurs/domaines purs.

### Sécurité

- **Auth** : Ne JAMAIS utiliser `user_metadata` pour les décisions d'autorisation (rôles, permissions). Utiliser `app_metadata` uniquement.
  - Voir [docs/GOUVERNANCE.md](../docs/GOUVERNANCE.md)
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
- `any` explicite interdit hors tests : `@typescript-eslint/no-explicit-any` est en erreur. Utiliser un type précis ou `unknown` avec narrowing réel ; ne pas remplacer par `unknown` pour masquer un contournement.

### TODO/FIXME

- Format obligatoire : `TODO(#123): description` avec référence issue
- Interdit : `TODO: fix this` sans identifiant

### Logging

- `console.error/warn` : erreurs réelles et observabilité serveur sans contenu sensible
- `console.log/info/debug` : **interdit** dans `src/` et `api/`
- En prod : aucun log sensible (pas de données utilisateur)

### Scripts

- Tout script dans `scripts/` ou `tools/scripts/` doit être soit référencé dans `package.json`, soit documenté avec un commentaire `// Usage: <description>` en tête de fichier.
- Un script non référencé et non documenté est considéré orphelin et candidat à la suppression.

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

- **Garde automatique** : `npm run check:deep-imports` scanne `.ts`, `.tsx`, `.js`, `.jsx` et `.css` hors tests. La baseline attendue est `0`; ne pas ajouter d'exception sans justification dans `docs/ARCHITECTURE.md`.

### Chaînes UI

- Toute chaîne UI visible modifiée dans une PR doit être relue en français correct.
- Utiliser les accents et les apostrophes typographiques sur les textes affichés à l’utilisateur.

## PR Checklist

- [ ] `npm run check` passe (tous les checks)
- [ ] `npm run lint` passe
- [ ] `npm run check:arch` passe (0 violation d'architecture)
- [ ] `npm run check:deep-imports` passe (0 import profond hors tests)
- [ ] `npm run typecheck` passe (0 erreur)
- [ ] `npm test` passe
- [ ] `npm run build` passe
- [ ] Pas de `console.log` ajouté
- [ ] TODO/FIXME ont un identifiant
- [ ] Imports `@/` utilisés pour cross-module
- [ ] Pas d'import CSS croisé entre pages
- [ ] Appels admin via `adminClient`, pas `invokeAdmin` directement
- [ ] Relire les textes UI touchés : orthographe, accents, apostrophes typographiques
