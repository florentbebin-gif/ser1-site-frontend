# Fix Errors

À appliquer quand `npm run check` échoue ou après une modification qui casse le build.

---

## Process

### 1. Diagnostic

```powershell
npm run check 2>&1 | Tee-Object -FilePath check_output.log
```

Identifier quelles étapes échouent :

- lint
- fiscal-hardcode
- css-colors
- theme-sync
- no-js
- arch
- circular
- typecheck
- test
- build

### 2. Correction par ordre de dépendance

Résoudre dans cet ordre (chaque étape débloque la suivante) :

| Ordre | Check | Commande | Action typique |
|---|---|---|---|
| 1 | lint | `npm run lint` | ESLint --fix, puis corrections manuelles |
| 2 | fiscal-hardcode | `npm run check:fiscal-hardcode` | Remplacer valeurs par `settingsDefaults` |
| 3 | css-colors | `npm run check:css-colors` | Remplacer couleurs hardcodées par CSS vars |
| 4 | theme-sync | `npm run check:theme-sync` | Synchroniser les tokens de thème |
| 5 | no-js | `npm run check:no-js` | Renommer `.js/.jsx` → `.ts/.tsx` |
| 6 | arch | `npm run check:arch` | Corriger imports (dependency-cruiser) |
| 7 | circular | `npm run check:circular` | Extraire types partagés, inverser dépendances |
| 8 | typecheck | `npm run typecheck` | Corriger les erreurs TypeScript |
| 9 | test | `npm test` | Corriger les tests ou le code source |
| 10 | build | `npm run build` | Corriger les erreurs Vite |

### 3. Vérification par étape

Après chaque correction, vérifier que l'étape passe avant de passer à la suivante :

```powershell
npm run check:lint
npm run check:fiscal-hardcode
npm run check:arch
npm run typecheck
npm test
npm run build
```

### 4. Vérification finale

```powershell
npm run check
```

Toutes les étapes doivent passer.

---

## Fichiers à lire si nécessaire

| Type d'erreur | Fichiers à lire |
|---|---|
| fiscal-hardcode | `src/constants/settingsDefaults.ts`, fichiers incriminés |
| arch | `.dependency-cruiser.cjs` |
| typecheck | Fichiers avec erreurs TypeScript |
| test | Fichiers de test échoués + code testé |

---

## Règles obligatoires

1. **Corriger dans l'ordre** : lint → fiscal → css → arch → circular → typecheck → test → build
2. **Vérifier chaque étape** avant de passer à la suivante
3. **Corriger la source**, jamais les tests pour qu'ils passent artificiellement
4. **Documenter** les changements dans le message de commit

## Ce qu'il ne faut pas faire

- ❌ Passer à l'étape suivante sans vérifier la précédente
- ❌ Modifier les tests pour qu'ils passent sans corriger la source
- ❌ Ignorer une étape qui échoue "parce que ce n'est pas grave"
- ❌ Faire un gros commit avec toutes les corrections
- ❌ Oublier de documenter les changements

---

## Critères d'arrêt

- [ ] `npm run check` passe en totalité (toutes les étapes)
- [ ] Chaque étape intermédiaire a été vérifiée individuellement
- [ ] Aucun test n'a été modifié pour "faire passer" le build (sauf bug de test)
- [ ] Les corrections sont documentées

---

## Rapport

```
- [FIX] lint: 3 erreurs auto-fixées (espaces, quotes)
- [FIX] fiscal-hardcode: remplacé 17.2 par PS_RATE_GLOBAL dans src/engine/ir/calcul.ts
- [FIX] typecheck: ajouté type manquant dans src/features/foo/types.ts
- ...
```
