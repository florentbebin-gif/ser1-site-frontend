# Succession Review

À appliquer après toute modification dans `src/features/succession/`, `src/engine/succession*`, ou `successionChainage.ts` / `successionUsufruit.ts` / `successionPredeces.ts`.

---

## Checklist

### 0. Périmètre du chantier

```powershell
git diff --name-only HEAD~1 -- src/features/succession/ src/engine/
```

### 1. Wiring fiscal

```powershell
rg "useFiscalContext" src/features/succession/ -n
```

- Attendu : au moins une occurrence dans `SuccessionSimulator.tsx` avec `strict: true`
- Si absent ou `strict: false` → **bloquer**

Clés normalisées autorisées : `dmtgScaleLigneDirecte`, `dmtgAbattementEnfant`, `dmtgSettings`, `psRateGlobal`, `pfuRateIR`, `irScaleCurrent`

```powershell
rg "fiscalContext\." src/features/succession/ -n --glob "*.ts" --glob "*.tsx"
```

### 2. Valeurs fiscales hardcodées

```powershell
rg "17\.2|17,2|100000|100_000|15932|15_932|12\.8|12,8" src/features/succession/ src/engine/ --glob "!__tests__" --glob "!settingsDefaults.ts" -n
npm run check:fiscal-hardcode
```

→ Zéro résultat attendu.

### 3. Cohérence matrice de périmètre

Lire `docs/METIER.md` section "Périmètre de fiabilité du modèle matrimonial et successoral" :

- Ne pas régresser un sujet "Support robuste" sans le signaler
- Mettre à jour la matrice si une "Simplification documentée" change
- Documenter si une "Approximation assumée" est promue

Invariants à ne jamais violer :

- Aucune approximation masquée
- Les produits d'assurance (AV, PER, prévoyance) ne sont jamais rattachés à une masse patrimoniale
- `METIER.md` et `ARCHITECTURE.md` restent alignés

### 4. Exports succession (si logique de calcul modifiée)

```powershell
rg "successionXlsx|successionPptx|ScSuccessionSummaryPanel" src/features/succession/ -n
```

Les 3 surfaces (UI synthèse, XLSX, PPTX) doivent restituer les mêmes hypothèses et résultats.

### 5. Golden tests

```powershell
npm test -- golden
npm test -- succession
```

Valeurs de référence :

- IR 80k / 2.5 parts → **6913 €**
- Succession 600k (conjoint + 2 enfants) → **16388 €**

**Aucune régression tolérée.** Si un golden change, c'est un bug ou un changement délibéré à valider explicitement.

### 6. Taille des fichiers

| Fichier | Seuil | Action |
|---|---|---|
| Général | > 500 lignes | Vérifier god file |
| `SuccessionSimulator.tsx` | ~1239 lignes historique | Ne pas augmenter |
| `successionChainage.ts` | — | Surveillance |

### 7. Vérification finale

```powershell
npm run check
```

---

## Critères d'arrêt

- [ ] `useFiscalContext` présent avec `strict: true` dans `SuccessionSimulator.tsx`
- [ ] Golden test succession passe (16388€)
- [ ] `npm run check:fiscal-hardcode` passe
- [ ] `npm run check` passe
- [ ] Aucun fichier > 800 lignes ajouté

## Ce qu'il ne faut pas faire

- ❌ Modifier `SuccessionSimulator.tsx` sans vérifier le wiring fiscal
- ❌ Accepter une régression des golden tests sans validation métier
- ❌ Ajouter des valeurs fiscales hardcodées
- ❌ Oublier de mettre à jour `METIER.md` si le périmètre change
- ❌ Laisser diverger les exports UI/XLSX/PPTX

---

## Rapport

```
1. Wiring fiscal : ✅ OK / ❌ KO (preuves)
2. Valeurs hardcodées : ✅ Aucune / ❌ Violations listées
3. Matrice périmètre : ✅ À jour / ❌ Lignes à modifier
4. Exports : ✅ Cohérents / ❌ Divergences
5. Golden tests : ✅ Passent / ❌ Régressions (delta: ...)
6. Taille fichiers : [liste avec statut]
7. npm run check : ✅ Vert / ❌ Erreurs
```
