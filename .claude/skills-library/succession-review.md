---
name: succession-review
description: Audit complet du simulateur succession — auto-déclenché après toute modification dans src/features/succession/ ou src/engine/succession*. Vérifie le wiring fiscal, la cohérence avec la matrice de périmètre, les golden tests et la taille des fichiers.
---

# Succession Review

## Périmètre
Ce skill couvre tout chantier touchant :
- `src/features/succession/`
- `src/engine/succession*` ou `src/engine/*Succession*`
- `src/features/succession/successionChainage.ts`, `successionUsufruit.ts`, `successionPredeces.ts`

---

## Process

### 0. Périmètre du chantier
Avant de commencer, identifier les fichiers modifiés dans le périmètre :
```bash
git diff --name-only HEAD~1 -- src/features/succession/ src/engine/
```
Cela permet d'adapter l'intensité des vérifications aux étapes 3, 4 et 6 (ex. : si aucun fichier de calcul n'est touché, l'étape 4 peut être allégée).

### 1. Wiring fiscal
Vérifier que `useFiscalContext` est correctement branché dans le simulateur :

```
rg "useFiscalContext" src/features/succession/ -n
```

Attendu : au moins une occurrence dans `SuccessionSimulator.tsx` avec `strict: true` (ou sans flag = strict par défaut).
Si absent ou `strict: false` → **bloquer**, signaler le fichier et la ligne.

Vérifier les clés normalisées utilisées :
```
rg "fiscalContext\." src/features/succession/ -n --glob "*.ts" --glob "*.tsx"
```
Les clés autorisées : `dmtgScaleLigneDirecte`, `dmtgAbattementEnfant`, `dmtgSettings`, `psRateGlobal`, `pfuRateIR`, `irScaleCurrent`.
Toute autre clé `fiscalContext.xxx` doit être justifiée.

### 2. Valeurs fiscales hardcodées
```
rg "17\.2|17,2|100000|100_000|15932|15_932|12\.8|12,8" src/features/succession/ src/engine/ --glob "!__tests__" --glob "!settingsDefaults.ts" -n
```
Zéro résultat attendu. Toute occurrence = violation à corriger avant merge.

Lancer aussi le guard CI :
```
npm run check:fiscal-hardcode
```

### 3. Cohérence matrice de périmètre
Lire `docs/METIER.md` section "Périmètre de fiabilité du modèle matrimonial et successoral" et vérifier que les modifications introduites :

- Ne régressent pas un sujet classé **"Support robuste"** sans le signaler.
- Si une **"Simplification documentée"** est étendue ou modifiée, mettre à jour la ligne concernée dans la matrice et les preuves associées.
- Si une **"Approximation assumée"** est promue en niveau supérieur, documenter le changement de statut.
- Si un sujet **"Non modélisé"** est implémenté, l'ajouter à la matrice avec son niveau.

Invariants à ne jamais violer (section "Invariants") :
- Aucune approximation masquée.
- Les produits d'assurance (AV, PER, prévoyance) ne sont jamais rattachés à une masse patrimoniale.
- `METIER.md` et `ARCHITECTURE.md` restent alignés après le chantier.

### 4. Exports succession
Si le chantier touche la logique de calcul, vérifier la cohérence des exports :
```
rg "successionXlsx|successionPptx|ScSuccessionSummaryPanel" src/features/succession/ -n
```
Les 3 surfaces (UI synthèse, XLSX, PPTX) doivent restituer les mêmes hypothèses et résultats.

### 5. Golden tests
```
npm test -- golden
```
Valeurs de référence :
- IR 80k / 2.5 parts → **6913 €**
- Succession 600k (conjoint + 2 enfants) → **16388 €**

Aucune régression tolérée. Si un golden change, c'est un bug ou un changement délibéré à valider explicitement.

Lancer aussi les tests succession complets :
```
npm test -- succession
```

### 6. Taille des fichiers modifiés
Pour chaque fichier `.ts/.tsx` modifié dans le périmètre :
- **< 400 lignes** : OK.
- **400–500** : warning — noter, ne pas bloquer.
- **> 500** : vérifier si le fichier mélange plusieurs responsabilités (cf. règle "god file" dans `docs/ARCHITECTURE.md`). Si oui, proposer un plan d'extraction.
- **> 800** : découpage obligatoire avant merge.

Fichiers à surveiller particulièrement :
- `SuccessionSimulator.tsx` (historiquement ~1239 lignes)
- `successionChainage.ts`

### 7. Vérification finale
```
npm run check
```
Doit passer en totalité.

---

## Report
Produire un résumé structuré :
1. Wiring fiscal : OK / KO (avec preuves)
2. Valeurs hardcodées : aucune / liste des violations
3. Matrice de périmètre : à jour / lignes à modifier (avec contenu proposé)
4. Exports : cohérents / divergences détectées
5. Golden tests : passent / régressions (avec delta)
6. Taille fichiers : liste avec statut
7. `npm run check` : vert / erreurs résiduelles
