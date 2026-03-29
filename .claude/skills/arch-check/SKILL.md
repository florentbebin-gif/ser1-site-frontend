---
description: Vérifie les boundaries architecturales SER1 avant toute PR — auto-déclenché avant un merge ou après ajout de fichiers dans src/. Contrôle les imports croisés, la séparation engine/feature/page, les appels Supabase, les CSS cross-feature, et la taille des fichiers.
---

# Arch Check

## Périmètre
Skill de validation pré-merge couvrant :
- Boundaries engine / features / pages
- Logique fiscale dans les composants React
- Appels Supabase directs hors `adminClient`
- CSS cross-feature
- Imports `@/` vs relatifs
- Taille des fichiers

---

## Process

### 1. CI dependency-cruiser
```
npm run check:arch
```
Ce guard vérifie les règles de `.dependency-cruiser.cjs`. S'il échoue, lire le rapport et corriger l'import incriminé avant de continuer.

Règles enforced :
- `src/engine/` : zéro dépendance sur React, hooks, features ou pages.
- `src/features/X/` : pas d'import direct depuis `src/features/Y/` (sauf via `src/features/Y/index.ts`).
- `src/pages/` : pas d'import de logique fiscale ou de `src/engine/` directement (passer par hooks/features).

### 2. Logique fiscale dans les composants React
```
rg "useFiscalContext\|fiscalSettingsCache\|settingsDefaults" src/features/ src/pages/ -n --include="*.tsx"
```
Les occurrences dans des composants (`.tsx`) sont **autorisées uniquement** si elles viennent d'un hook (`use*.ts`) ou d'un conteneur d'orchestration.
Toute occurrence directe dans un composant de rendu pur (`*Card.tsx`, `*Panel.tsx`, `*Section.tsx`) est une violation.

Chercher aussi les calculs fiscaux inline :
```
rg "\* 0\.\|/ 100\b\|tranche\|abattement\|imposition" src/features/ src/pages/ --include="*.tsx" -n
```
Toute formule fiscale inline dans un `.tsx` doit être déplacée dans `src/engine/`.

### 3. Appels Supabase directs
```
rg "from\('@/.*supabase\|from\('.*supabase\|createClient\|supabase\.from" src/features/ src/pages/ -n
```
Zéro résultat attendu dans `src/features/` et `src/pages/` (hors `src/pages/settings/` qui utilise `adminClient`).

Dans `src/pages/settings/` :
```
rg "invokeAdmin\b" src/pages/settings/ src/features/ -n
```
`invokeAdmin` est un détail d'implémentation interne — ne doit jamais être appelé directement depuis une page ou un composant. Utiliser `adminClient`.

### 4. CSS cross-feature
```
rg "@import.*features/" src/features/ src/pages/ --include="*.css" -n
rg "@import.*pages/" src/features/ --include="*.css" -n
```
Zéro résultat attendu. Les styles partagés vont dans `src/styles/`.

### 5. Imports — cohérence `@/` vs relatifs
```
rg "from '\.\./\.\./\.\." src/features/ src/pages/ --include="*.ts" --include="*.tsx" -n
```
Tout import remontant à plus de 2 niveaux (`../../..`) doit utiliser `@/`.

```
rg "from '@/" src/engine/ --include="*.ts" -n
```
Le dossier `src/engine/` ne doit importer que des constantes/types internes — jamais de features ou hooks React via `@/`.

### 6. Fichiers `legacy/`, `__spike__`, `_raw`
```
rg "legacy/|__spike__|/_raw" src/ -n
```
Ces patterns ne doivent plus exister sous `src/` (nettoyés depuis PR-19). Toute réintroduction est à justifier.

### 7. Taille des fichiers nouveaux et modifiés
Pour chaque fichier `.ts/.tsx` modifié dans la PR :

| Seuil | Action |
|---|---|
| < 400 lignes | OK |
| 400–500 | Warning — noter dans le report |
| > 500 | Vérifier la règle "god file" : mélange de responsabilités ? Si oui, proposer un plan d'extraction. |
| > 800 | Découpage obligatoire avant merge |

Commande de vérification rapide (fichiers les plus longs) :
```
wc -l src/features/**/*.ts src/features/**/*.tsx src/engine/**/*.ts 2>/dev/null | sort -rn | head -20
```

### 8. Pas de `console.log` non conditionnel
```
rg "console\.log\b" src/ --include="*.ts" --include="*.tsx" -n
```
Seuls `console.error` et `console.warn` sont autorisés.
`console.log` est toléré uniquement derrière un flag `DEBUG_*` (`if (DEBUG_FOO) console.log(...)`).

### 9. Vérification finale
```
npm run check
```
Doit passer en totalité. Si des erreurs persistent, utiliser le skill `fix-errors`.

---

## Report
Produire un résumé structuré :
1. `check:arch` (dependency-cruiser) : OK / violations (avec fichiers + lignes)
2. Logique fiscale dans composants : OK / violations
3. Supabase directs : OK / violations
4. CSS cross-feature : OK / violations
5. Imports `@/` : OK / remontées à corriger
6. Conventions `legacy/spike/_raw` : OK / occurrences détectées
7. Taille fichiers : liste avec statut
8. `console.log` : OK / occurrences
9. `npm run check` : vert / erreurs résiduelles
