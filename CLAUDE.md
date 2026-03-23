# SER1 — Claude Code

## Règles & sources de vérité
- **Règles agent** : lire `AGENTS.md` (proof-first, minimal diffs, no invented paths, etc.)
- **Conventions code** : lire `.github/CONTRIBUTING.md` (naming, imports, CSS, security)
- **Architecture détaillée** : lire `docs/ARCHITECTURE.md`
- **Règles métier** : lire `docs/METIER.md`

## Stack
React 18 + Vite 5 + TypeScript strict + Supabase | Node 22.x | Vitest + Playwright

## CI gate
`npm run check` = lint + fiscal-hardcode + css-colors + theme-sync + no-js + arch + circular + typecheck + test + build.
Doit passer avant tout commit.

## Fiscal — chaîne obligatoire
```
Supabase (tax_settings, ps_settings, fiscality_settings)
  → src/utils/cache/fiscalSettingsCache.ts
    → src/hooks/useFiscalContext.ts
      → src/constants/settingsDefaults.ts (fallbacks)
```
Ne jamais hardcoder de valeurs fiscales. Ne jamais lire Supabase directement depuis un composant.

## Workflows automatiques

Appliquer ces workflows dès que le contexte le justifie, sans attendre de demande explicite.

### Après toute modification de code
1. `npm run check`
2. Si erreurs : fixer dans l'ordre lint → typecheck → test → build
3. Re-run jusqu'à tout vert
4. Vérifier taille des fichiers modifiés (seuil 400 lignes)

### Quand on parle de PR, pull request, merge, ou "pousse le code"
1. `npm run check` doit passer
2. Lire `.github/pull_request_template.md` et remplir chaque section
3. Branch : `feat/`, `fix/`, `chore/`, `refactor/`, `test/` + kebab-case
4. `git push -u origin <branch>` + `gh pr create` avec le template rempli
5. Retourner l'URL de la PR

### Quand on touche au fiscal
1. `npm run check:fiscal-hardcode`
2. Vérifier le wiring useFiscalContext dans les simulateurs concernés
3. `npm test -- golden`

### Quand on crée un commit
- Format : `type: description` (impératif, ≤72 chars)
- `npm run check` avant de committer

### Après une feature ou un fix conséquent
- Taille fichiers modifiés : >400 = warning, >800 = split
- Pas de console.log ajouté
- TODO/FIXME ont un identifiant issue
