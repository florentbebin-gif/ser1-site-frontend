# Clean Code Review

À appliquer après implémentation d'une feature, correction d'un bug, ou refactor. Vérifier avant toute PR.

---

## Checklist

### 1. Taille des fichiers

Pour chaque fichier modifié/créé :

```powershell
Get-ChildItem -Path src/features,src/pages,src/engine -Recurse -Include *.ts,*.tsx |
  Select-Object Name, @{Name="Lignes";Expression={(Get-Content $_.FullName).Count}} |
  Sort-Object Lignes -Descending |
  Select-Object -First 20
```

| Seuil | Statut | Action |
|---|---|---|
| < 400 lignes | ✅ OK | Aucune action |
| 400–500 lignes | ⚠️ Warning | Noter, continuer |
| > 500 lignes | 🔴 Dette | Vérifier "god file" : mélange de responsabilités ? |
| > 800 lignes | 🚫 Bloquant | Découpage obligatoire avant merge |

Signes de "god file" :

- UI orchestration + state + effects
- Business logic + data transforms
- Persistence + network + I/O
- Large inline JSX / modals

### 2. Console statements

```powershell
rg "console\.log\b|console\.info\b|console\.debug\b" src/ --include="*.ts" --include="*.tsx" -n
```

- ❌ Pas de `console.log/info/debug` nouveaux
- ✅ `console.error/warn` autorisés pour erreurs réelles
- ✅ `console.log` toléré derrière `if (DEBUG_FOO)`

### 3. TODO / FIXME

```powershell
rg "TODO|FIXME" src/ --include="*.ts" --include="*.tsx" -n
```

→ Doivent avoir un ID d'issue : `TODO(#123): description`

### 4. Extensions de fichiers

- Nouveaux fichiers : `.ts/.tsx` uniquement (jamais `.js/.jsx`)

### 5. Imports

```powershell
rg "from '\.\./\.\./\.\." src/features/ src/pages/ --include="*.ts" --include="*.tsx" -n
```

- Utiliser `@/` pour les imports cross-module
- Pas d'imports CSS cross-feature

### 6. Validation

```powershell
npm run check
```

Doit passer sans erreur.

---

## Critères d'arrêt

- [ ] Tous les fichiers < 500 lignes (ou justification documentée pour > 500)
- [ ] Aucun `console.log/info/debug` non conditionnel
- [ ] Tous les TODO/FIXME ont un ID d'issue `(#123)`
- [ ] Nouveaux fichiers en `.ts/.tsx`
- [ ] Imports `@/` pour cross-module
- [ ] `npm run check` passe

## Ce qu'il ne faut pas faire

- ❌ Laisser un fichier > 800 lignes sans découpage
- ❌ Ajouter des `console.log` de debug sans les retirer
- ❌ Laisser des TODO sans ID d'issue
- ❌ Créer des fichiers `.js/.jsx`
- ❌ Utiliser des imports relatifs `../../../` au lieu de `@/`

---

## Rapport

```
## Clean Code Review

### Fichiers vérifiés
| Fichier | Lignes | Statut |
|---|---|---|
| src/features/foo/bar.ts | 234 | ✅ OK |
| src/features/baz/qux.tsx | 567 | 🔴 God file — extraction proposée |

### Warnings
- [ ] console.log ligne 42 (pas de flag DEBUG)
- [ ] TODO sans issue ID ligne 88

### Validation
- [x] npm run check passe
```
