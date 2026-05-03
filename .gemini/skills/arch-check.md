# Arch Check

Validation architecturale pré-merge. À appliquer avant toute PR ou après ajout de fichiers dans `src/`.

## Périmètre

- Boundaries engine / features / pages
- Logique fiscale dans les composants React
- Appels Supabase directs hors zone autorisée
- CSS cross-feature
- Imports `@/` vs relatifs profonds
- Fichiers legacy / spike
- Taille des fichiers
- `console.log` non conditionnel

---

## Process

### 1. Dependency-cruiser

```powershell
npm run check:arch
```

Règles enforcées (`.dependency-cruiser.cjs`) :

- `src/engine/` : zéro dépendance sur React, hooks, features ou pages
- `src/features/X/` : pas d'import direct depuis `src/features/Y/` (sauf via `index.ts`)
- `src/pages/` : pas d'import de logique fiscale ou `src/engine/` directement (passer par hooks/features)

### 2. Logique fiscale dans les composants React

```powershell
rg "useFiscalContext\|fiscalSettingsCache\|settingsDefaults" src/features/ src/pages/ -n --include="*.tsx"
```

- **Autorisé** : dans les hooks (`use*.ts`) ou conteneurs d'orchestration
- **Interdit** : dans les composants de rendu pur (`*Card.tsx`, `*Panel.tsx`, `*Section.tsx`)

Rechercher aussi les formules inline :

```powershell
rg "\* 0\.|/ 100\b|tranche|abattement|imposition" src/features/ src/pages/ --include="*.tsx" -n
```

→ Toute formule fiscale inline dans un `.tsx` doit être déplacée dans `src/engine/`.

### 3. Appels Supabase directs

```powershell
rg "from\('@/.*supabase|from\('.*supabase|createClient|supabase\.from" src/features/ src/pages/ -n
```

- Zéro résultat attendu dans `src/features/` et `src/pages/` (hors `src/pages/settings/`)

Dans `src/pages/settings/` :

```powershell
rg "invokeAdmin\b" src/pages/settings/ src/features/ -n
```

→ `invokeAdmin` ne doit jamais être appelé directement depuis une page/composant. Utiliser `adminClient`.

### 4. CSS cross-feature

```powershell
rg "@import.*features/" src/features/ src/pages/ --include="*.css" -n
rg "@import.*pages/" src/features/ --include="*.css" -n
```

→ Zéro résultat. Les styles partagés vont dans `src/styles/`.

### 5. Imports — cohérence `@/` vs relatifs

```powershell
rg "from '\.\./\.\./\.\." src/features/ src/pages/ --include="*.ts" --include="*.tsx" -n
```

→ Tout import remontant à plus de 2 niveaux (`../../..`) doit utiliser `@/`.

```powershell
rg "from '@/" src/engine/ --include="*.ts" -n
```

→ `src/engine/` ne doit importer que des constantes/types internes — jamais via `@/` vers des features ou hooks React.

### 6. Fichiers legacy / spike / _raw

```powershell
rg "legacy/|__spike__|/_raw" src/ -n
```

→ Ces patterns ne doivent plus exister sous `src/`. Toute réintroduction est à justifier.

### 7. Taille des fichiers

| Seuil | Action |
|---|---|
| < 400 lignes | OK |
| 400–500 | Warning — noter |
| > 500 | Vérifier "god file" : mélange de responsabilités ? |
| > 800 | Découpage obligatoire avant merge |

```powershell
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx |
  Select-Object Name, @{Name="Lignes";Expression={(Get-Content $_.FullName).Count}} |
  Sort-Object Lignes -Descending |
  Select-Object -First 20
```

### 8. Console.log non conditionnel

```powershell
rg "console\.log\b" src/ --include="*.ts" --include="*.tsx" -n
```

→ Seuls `console.error` et `console.warn` sont autorisés.
`console.log` toléré uniquement derrière `if (DEBUG_FOO)`.

### 9. Vérification finale

```powershell
npm run check
```

Doit passer en totalité. Si des erreurs persistent, appliquer le skill `fix-errors`.

---

## Critères d'arrêt

- [ ] `npm run check:arch` passe
- [ ] Aucune logique fiscale dans les composants de rendu pur
- [ ] Aucun appel Supabase direct hors `src/pages/settings/`
- [ ] Aucun CSS cross-feature
- [ ] Imports `@/` corrects (pas de `../../../`)
- [ ] Aucun fichier > 800 lignes sans plan de découpage
- [ ] Aucun `console.log` non conditionnel
- [ ] `npm run check` passe

## Ce qu'il ne faut pas faire

- ❌ Importer React dans `src/engine/`
- ❌ Appeler `supabase.from()` depuis `src/features/`
- ❌ Laisser un fichier > 800 lignes sans proposer de découpage
- ❌ Utiliser des imports relatifs `../../../` au lieu de `@/`
- ❌ Ignorer les erreurs dependency-cruiser

## Rapport

Produire un résumé structuré :

1. `check:arch` (dependency-cruiser) : OK / violations (fichiers + lignes)
2. Logique fiscale dans composants : OK / violations
3. Supabase directs : OK / violations
4. CSS cross-feature : OK / violations
5. Imports `@/` : OK / corrections à faire
6. Legacy/spike/`_raw` : OK / occurrences détectées
7. Taille fichiers : liste avec statut
8. `console.log` : OK / occurrences
9. `npm run check` : vert / erreurs résiduelles
