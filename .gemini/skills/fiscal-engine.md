# Fiscal Engine

À appliquer pour toute modification du moteur fiscal SER1 : `src/engine/`, constantes fiscales dans `settingsDefaults.ts`, hooks `useFiscalContext`/`useFiscalSettings`.

---

## Règles absolues

### Interdictions

- **Pas de valeurs fiscales hardcodées** : `17.2`, `100000`, `15932`, `12.8`, `30`
  → Guard CI : `npm run check:fiscal-hardcode`
- **Pas de Supabase dans l'engine** : pas d'import `createClient` ou `supabase.from()` dans `src/engine/`
- **Pas de React dans l'engine** : pas de hooks, JSX, ou état dans `src/engine/`

### Chaîne fiscale obligatoire

```
Supabase (source de vérité)
  ↓
src/utils/cache/fiscalSettingsCache.ts (stale-while-revalidate)
  ↓
src/hooks/useFiscalContext.ts (consommation React)
  ↓
Composants / features
```

- **Fallbacks** : utiliser `src/constants/settingsDefaults.ts` uniquement
- **Engine pur** : fonctions pures `input → output`, pas d'effets de bord

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/constants/settingsDefaults.ts` | Toutes les valeurs fiscales par défaut |
| `src/utils/cache/fiscalSettingsCache.ts` | Cache singleton (stale-while-revalidate) |
| `src/hooks/useFiscalContext.ts` | Hook React unifié |
| `scripts/check-no-hardcoded-fiscal-values.mjs` | Guard CI |

## Fichiers à lire si nécessaire

| Fichier | Quand lire |
|---|---|
| `src/constants/settingsDefaults.ts` | Si besoin de valeurs fiscales par défaut |
| `src/utils/cache/fiscalSettingsCache.ts` | Si modification du cache ou invalidation |
| `src/hooks/useFiscalContext.ts` | Si modification du hook React |
| `scripts/check-no-hardcoded-fiscal-values.mjs` | Si le CI fiscal-hardcode échoue |
| `docs/METIER.md` | Si périmètre métier du simulateur concerné |

---

## Tests

- Golden tests IR : 80k / 2.5 parts → **6913 €**
- Golden tests succession : 600k (conjoint + 2 enfants) → **16388 €**
- Tout nouveau fichier `src/engine/**/*.ts` doit avoir un test unitaire `__tests__/*.test.ts` (3 cas : nominal, bord, erreur)

```powershell
# Golden tests
npm test -- golden
npm test -- succession

# Vérifier les valeurs hardcodées
npm run check:fiscal-hardcode

# Rechercher des patterns suspects
rg "17\.2|100000|15932|12\.8" src/engine/ src/features/ --include="*.ts" -n
```

---

## Critères d'arrêt

- [ ] `npm run check:fiscal-hardcode` passe
- [ ] Golden tests passent (IR 6913€, Succession 16388€)
- [ ] Aucune valeur fiscale hardcodée dans le code modifié
- [ ] Aucun import Supabase dans `src/engine/`
- [ ] Aucun hook React dans `src/engine/`

## Ce qu'il ne faut pas faire

- ❌ Hardcoder `17.2` même "temporairement"
- ❌ Importer `supabase` dans un fichier de `src/engine/`
- ❌ Utiliser `useState` ou hooks React dans `src/engine/`
- ❌ Modifier les tests golden pour qu'ils passent sans validation métier
