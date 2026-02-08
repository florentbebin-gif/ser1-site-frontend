# Plan de Refactoring — Thème PPTX & God Files

> **Branche** : `refactor/theme-pptx-godfiles`  
> **Date** : 2026-02-08  
> **Objectif** : Unifier la source de vérité du thème, extraire les exports PPTX, réduire les god files, éliminer les hardcodes couleur — sans régression.

---

## Objectifs (4 bullets)

1. **Source de vérité unique pour le thème** — Centraliser C1-C10 dans `src/settings/theme.ts`, éliminer toute redéfinition dans `ThemeProvider.tsx`, `styles.css`, `resolvePptxColors.ts`.
2. **Sortir l'export PPTX des pages simulateurs** — Créer des modules `exportIrPptx`, `exportCreditPptx` dans `src/pptx/exports/` avec une API simple `exportXxxPptx(data, theme, options)`.
3. **Réduire les god files** — Découper `Ir.jsx` (50KB) en composants (Form/Results/Export) + hook `useIr()` pour isoler state/validation.
4. **Supprimer les hardcodes couleur** — Remplacer `#b00020` (Ir.css), `#222`, `#666666` (si présents) par tokens C1-C10 existants.

---

## Inventaire des Fichiers Impactés

### Thème (Objectif 1)
| Fichier | Action | Note |
|---------|--------|------|
| `src/settings/theme.ts` | ✅ Déjà source de vérité | Exporter `DEFAULT_COLORS` |
| `src/settings/ThemeProvider.tsx` | 🔄 Modifier | Importer `DEFAULT_COLORS` depuis `theme.ts`, supprimer redéfinition locale |
| `src/styles.css` | 🔄 Modifier | Utiliser CSS variables injectées par `ThemeProvider`, vérifier pas de valeurs hardcodées C1-C10 |
| `src/pptx/theme/resolvePptxColors.ts` | ✅ Déjà OK | Importe déjà `DEFAULT_COLORS` depuis `theme.ts` |

### Export PPTX (Objectif 2)
| Fichier | Action | Note |
|---------|--------|------|
| `src/pages/Ir.jsx` | 🔄 Modifier | Remplacer logique export inline par appel `exportIrPptx()` |
| `src/pages/Credit.jsx` | 🔄 Modifier | Remplacer logique export inline par appel `exportCreditPptx()` |
| `src/pptx/exports/irExport.ts` | ➕ Créer | Module export IR simple |
| `src/pptx/exports/creditExport.ts` | ➕ Créer | Module export Crédit simple |
| `src/pptx/exports/index.ts` | ➕ Créer | Point d'entrée public des exports |
| `src/pptx/presets/irDeckBuilder.ts` | ✅ Existant | Déjà structure `buildIrStudyDeck()` |
| `src/pptx/presets/creditDeckBuilder.ts` | ✅ Existant | Déjà structure `buildCreditStudyDeck()` |
| `src/pptx/export/exportStudyDeck.ts` | ✅ Existant | Orchestrateur `exportStudyDeck()` |

### God Files — IR (Objectif 3)
| Fichier | Action | Note |
|---------|--------|------|
| `src/pages/Ir.jsx` | 🔄 Réduire | Passer de ~1400 lignes à ~300-400 lignes (layout + composition) |
| `src/pages/ir/IrForm.tsx` | ➕ Créer | Formulaire IR complet (extraction) |
| `src/pages/ir/IrResults.tsx` | ➕ Créer | Cartes résultats + détail calcul |
| `src/pages/ir/useIr.ts` | ➕ Créer | Hook state + validation + calculs |
| `src/pages/ir/index.ts` | ➕ Créer | Point d'entrée public |

### Hardcodes Couleur (Objectif 4)
| Fichier | Action | Note |
|---------|--------|------|
| `src/pages/Ir.css:275` | 🔄 Modifier | `#b00020` → `var(--color-c1)` (danger selon gouvernance) |
| `src/pages/Credit.css` | 🔍 Vérifier | Chercher hardcodes |
| `src/pages/Placement.css` | 🔍 Vérifier | Chercher hardcodes |

---

## Stratégie "Zéro Régression"

### Validation avant chaque commit
```powershell
npm run check        # lint + typecheck + test + build
npm run test         # 83 tests unitaires
```

### Validation visuelle manuelle (obligatoire)
1. **Thème** : Changer de thème dans Settings → vérifier propagation UI + PPTX
2. **Simulateur IR** : Charger page `/sim/ir`, saisir données, vérifier calculs identiques
3. **Export PPTX IR** : Cliquer export → vérifier téléchargement + contenu slides
4. **Simulateur Crédit** : Même procédure
5. **Couleurs** : Vérifier pas de rouge hardcodé sur les erreurs IR

### Tests E2E (si disponibles)
```powershell
npm run test:e2e     # 8 smoke tests Playwright
```

### Rollback plan
- Chaque commit = 1 changement isolé (facile à revert)
- Pas de suppression de fichiers historiques sans backup logique
- Garder les anciennes fonctions export inline commentées pendant la transition

---

## Découpage en Commits

### Commit 1 : `chore(theme): verify unified source of truth`
**Contenu** :
- Vérifier `src/settings/theme.ts` exporte bien `DEFAULT_COLORS`
- Vérifier `ThemeProvider.tsx` importe `DEFAULT_COLORS` depuis `theme.ts`
- Vérifier `resolvePptxColors.ts` importe depuis `theme.ts`
- Ajouter commentaire "Source of truth" dans `theme.ts` si manquant
- Vérifier `styles.css` utilise uniquement CSS variables (pas de valeurs C1-C10 hardcodées)

**Validation** : `npm run check` vert.

---

### Commit 2 : `refactor(pptx): create simulator export modules`
**Contenu** :
- Créer `src/pptx/exports/irExport.ts` :
  ```typescript
  export async function exportIrPptx(
    irData: IrData,
    uiSettings: UiSettingsForPptx,
    logoUrl?: string,
    logoPlacement?: LogoPlacement,
    advisor?: AdvisorInfo,
    filename?: string
  ): Promise<void>
  ```
- Créer `src/pptx/exports/creditExport.ts` (même pattern)
- Créer `src/pptx/exports/index.ts` : export public
- Utiliser `buildIrStudyDeck()` + `exportStudyDeck()` (existant)

**Validation** : `npm run check` vert + test export manuel.

---

### Commit 3 : `refactor(ir): extract useIr hook and split components`
**Contenu** :
- Créer `src/pages/ir/useIr.ts` avec :
  - State (`yearKey`, `status`, `isIsolated`, `children`, `incomes`, etc.)
  - Validation
  - Calculs via `computeIrResultEngine`
  - Persistence `sessionStorage`
  - Reset handler
- Créer `src/pages/ir/IrForm.tsx` : Formulaire IR (extraction du JSX tableau)
- Créer `src/pages/ir/IrResults.tsx` : Cartes résultats + détail calcul
- Créer `src/pages/ir/index.ts` : exports publics
- Réécrire `Ir.jsx` : ~300 lignes utilisant `useIr()` + `<IrForm />` + `<IrResults />` + export PPTX via nouveau module

**Validation** :
- `npm run check` vert
- Test manuel IR : saisie → calcul → export PPTX identique

---

### Commit 4 : `chore(colors): replace hardcoded #b00020 with token`
**Contenu** :
- `src/pages/Ir.css:275` : `#b00020` → `var(--color-c1)` (per gouvernance : danger = C1)
- Vérifier `Credit.css`, `Placement.css` : pas de hardcodes similaires

**Validation** : `npm run check` vert + visuel vérification erreurs IR.

---

### Commit 5 : `refactor(credit): use new export module (optional)`
**Si temps/disposition** : Refactoring similaire au Commit 3 pour Credit.jsx.
**Sinon** : Juste remplacer export inline par appel `exportCreditPptx()`.

---

## Checklist de Fin

### Avant suppression du plan
- [ ] Tous les commits poussés sur la branche
- [ ] `npm run check` vert sur le dernier commit
- [ ] Tests manuels validés (IR + Crédit + Thème)
- [ ] Pas de régression visuelle

### Mise à jour documentation
- [ ] `README.md` : section "Thème" → pointer vers `src/settings/theme.ts` comme source de vérité
- [ ] `docs/design/color-governance.md` : vérifier cohérence avec nouvelle structure
- [ ] `CONTRIBUTING.md` : ajouter règle "Pas de hardcode couleur sauf blanc"

### Suppression du plan
- [ ] `git rm PLAN-refactor-theme-pptx.md`
- [ ] Commit : `docs: remove plan file after completion`

### Push final
```powershell
git push origin refactor/theme-pptx-godfiles
```

---

## Risques Identifiés / Out of Scope

| Risque | Mitigation | Décision |
|--------|------------|----------|
| `ThemeProvider` trop complexe à refactoriser | Ne pas toucher la logique de chargement async, juste importer `DEFAULT_COLORS` | ✅ Scope limité |
| Export PPTX Credit non testé récemment | Tester manuellement avant/après | ⚠️ À valider |
| PlacementV2.jsx (53KB) aussi god file | Hors scope — temps limité | ⏸️ Phase 2 |
| Hooks React testing | Pas de tests unitaires hooks existants | ⚠️ Compter sur tests E2E + manuels |

---

## Références

- Source de vérité thème : `src/settings/theme.ts`
- ThemeProvider : `src/settings/ThemeProvider.tsx`
- Résolution PPTX : `src/pptx/theme/resolvePptxColors.ts`
- Builders PPTX : `src/pptx/presets/irDeckBuilder.ts`, `src/pptx/presets/creditDeckBuilder.ts`
- Orchestrateur export : `src/pptx/export/exportStudyDeck.ts`
- Gouvernance couleurs : `docs/design/color-governance.md`
